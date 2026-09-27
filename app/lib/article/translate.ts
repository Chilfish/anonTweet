import type { LanguageModel } from 'ai'
import type { ThinkingLevel } from '~/lib/stores/appConfig'
import type { ArticleBlock, ArticleRun, TweetArticle } from '~/types'
import { generateText, Output, zodSchema } from 'ai'
import { z } from 'zod'
import { createAITranslationAbortSignal } from '~/lib/ai-timeout'
import { models } from '~/lib/constants'
import { obsLog } from '~/lib/obs-log'
import { getProviderStrategy, getThinkingConfig } from '~/lib/providers'

/**
 * X Article 的**按块**翻译管线。
 *
 * 与推文实体翻译（`AITranslation.ts`）解耦：长文无法塞进单个 maskedText，且位置回填
 * 一旦错位就静默损坏。这里以**块 key** 为对齐键分批翻译：
 * - 只翻可翻译块（段落/标题/列表项/引用）+ 标题；代码/图片/嵌入帖/分隔线原样跳过
 * - 块内 link/mention/hashtag 换为占位符 `<<__LINK_n__>>`（n 为该块内非文本 run 序号），
 *   逐块校验占位符集合，失败只重试该批
 * - 返回 `Record<blockKey, string>`，与位置无关
 */

const LINK_PLACEHOLDER_RE = /<<__LINK_\d+__>>/g
const KANA_RE = /[\u3040-\u30FF]/
const CJK_RE = /[\u4E00-\u9FFF]/

const TRANSLATABLE_TYPES = new Set<ArticleBlock['type']>(['paragraph', 'heading', 'list-item', 'quote'])

/** 每批送入 LLM 的字符预算（保守，避免单次超长） */
const BATCH_CHAR_BUDGET = 2600

export interface ArticleTranslation {
  title?: string
  /** 块 key → 译文（含占位符） */
  blocks: Record<string, string>
}

interface TranslatableBlock {
  key: string
  text: string
  placeholders: string[]
  runs: ArticleRun[]
}

interface BatchItem {
  key: string
  text: string
  placeholders: string[]
}

/** 块 → 送入 LLM 的文本（非文本 run → per-block 占位符） */
export function serializeArticleBlock(block: Extract<ArticleBlock, { runs: ArticleRun[] }>): { text: string, placeholders: string[] } {
  const placeholders: string[] = []
  let counter = 0
  const text = block.runs
    .map((run) => {
      if (run.type === 'text')
        return run.text
      const placeholder = `<<__LINK_${counter++}__>>`
      placeholders.push(placeholder)
      return placeholder
    })
    .join('')
  return { text, placeholders }
}

function isTranslatable(block: ArticleBlock): block is Extract<ArticleBlock, { runs: ArticleRun[] }> {
  return TRANSLATABLE_TYPES.has(block.type)
}

/** 文本是否已是简体中文（含 CJK 且无假名即视作中文，跳过翻译） */
export function looksLikeChinese(text: string): boolean {
  return CJK_RE.test(text) && !KANA_RE.test(text)
}

function collectTranslatable(article: TweetArticle): { title: string, blocks: TranslatableBlock[] } {
  const blocks: TranslatableBlock[] = []
  for (const block of article.blocks ?? []) {
    if (!isTranslatable(block))
      continue
    const { text, placeholders } = serializeArticleBlock(block)
    if (!text.trim())
      continue
    blocks.push({ key: block.key, text, placeholders, runs: block.runs })
  }
  return { title: article.title?.trim() ?? '', blocks }
}

function chunkBlocks(blocks: TranslatableBlock[]): TranslatableBlock[][] {
  const batches: TranslatableBlock[][] = []
  let current: TranslatableBlock[] = []
  let size = 0
  for (const block of blocks) {
    if (current.length > 0 && size + block.text.length > BATCH_CHAR_BUDGET) {
      batches.push(current)
      current = []
      size = 0
    }
    current.push(block)
    size += block.text.length
  }
  if (current.length > 0)
    batches.push(current)
  return batches
}

function unique(list: string[]): string[] {
  return Array.from(new Set(list))
}

/** 逐块校验占位符集合是否精确相等 */
function placeholdersOk(translated: string, expected: string[]): boolean {
  const expectedSet = new Set(unique(expected))
  const actual = unique(translated.match(LINK_PLACEHOLDER_RE) ?? [])
  if (actual.length !== expectedSet.size)
    return false
  return actual.every(p => expectedSet.has(p))
}

const SYSTEM_PROMPT = `
# Role
You are a professional localization expert. Translate the given documents into natural Simplified Chinese.

# Rules
1. Translate every block faithfully; keep the author's tone.
2. Placeholders like \`<<__LINK_0__>>\` are immutable anchors (links / @mentions / #hashtags). Keep them EXACTLY as-is inside the translation, and place them where natural Chinese syntax requires.
3. Never translate a block into anything other than Simplified Chinese.

# Output
Return a single JSON object: {"title":"...","blocks":{"<blockKey>":"<translated text>"}}
- Copy the block keys EXACTLY as given.
- Every input block key MUST appear in "blocks".
`.trim()

function buildOutputSchema() {
  return Output.object({
    schema: zodSchema(z.object({
      title: z.string().optional(),
      blocks: z.record(z.string(), z.string()),
    })),
    name: 'article_translation',
    description: 'Block-keyed Simplified Chinese translation of an X article.',
  })
}

export interface AutoTranslateArticleOptions {
  modelInstance: LanguageModel
  modelName: string
  thinkingLevel?: ThinkingLevel
  translationGlossary?: string
}

/**
 * 翻译整篇文章（分批）。返回按块 key 索引的译文；占位符校验失败的块会被丢弃（不写脏数据）。
 */
export async function autoTranslateArticle(
  article: TweetArticle,
  options: AutoTranslateArticleOptions,
): Promise<ArticleTranslation> {
  const { title, blocks } = collectTranslatable(article)
  const result: ArticleTranslation = { blocks: {} }

  const hasAnyText = blocks.length > 0 || title.length > 0
  if (!hasAnyText)
    return result

  const modelConfig = models.find(m => m.name === options.modelName)
  const strategy = modelConfig ? getProviderStrategy(modelConfig.provider) : null
  const thinkingConfig = getThinkingConfig(options.modelName, options.thinkingLevel ?? 'minimal')
  const output = buildOutputSchema()

  const translateBatch = async (items: BatchItem[]): Promise<Record<string, string>> => {
    const payload = JSON.stringify(items.map(item => ({ key: item.key, text: item.text })), null, 0)
    const userContent = `${options.translationGlossary ? `<Glossary>\n${options.translationGlossary}\n</Glossary>\n\n` : ''}Translate these blocks:\n${payload}`

    const startedAt = Date.now()
    let lastRaw: Record<string, string> = {}
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await generateText({
        model: options.modelInstance,
        system: SYSTEM_PROMPT,
        prompt: userContent,
        output,
        temperature: 0.4,
        abortSignal: createAITranslationAbortSignal(),
        providerOptions: strategy && modelConfig
          ? strategy.buildProviderOptions(thinkingConfig, modelConfig)
          : {},
      })

      const returned = response.output.blocks ?? {}
      const accepted: Record<string, string> = {}
      for (const item of items) {
        const translated = returned[item.key]?.trim()
        if (translated && placeholdersOk(translated, item.placeholders))
          accepted[item.key] = translated
      }
      lastRaw = accepted
      if (Object.keys(accepted).length === items.length)
        break
    }

    obsLog('ai.translate.article.batch', {
      blocks: items.length,
      translated: Object.keys(lastRaw).length,
      ms: Date.now() - startedAt,
    })
    return lastRaw
  }

  // 标题单独一批（预算小、优先保证）
  if (title && !looksLikeChinese(title)) {
    const titleResult = await translateBatch([{ key: '__title__', text: title, placeholders: [] }])
    if (titleResult.__title__)
      result.title = titleResult.__title__
  }

  const pending = blocks.filter(block => !looksLikeChinese(block.text))
  for (const batch of chunkBlocks(pending)) {
    const translated = await translateBatch(batch.map(block => ({ key: block.key, text: block.text, placeholders: block.placeholders })))
    Object.assign(result.blocks, translated)
  }

  return result
}
