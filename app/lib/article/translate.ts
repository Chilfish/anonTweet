import type { LanguageModel } from 'ai'
import type { ThinkingLevel } from '~/lib/stores/appConfig'
import type { ArticleBlock, ArticleRun, TweetArticle } from '~/types'
import { generateText, Output, zodSchema } from 'ai'
import { z } from 'zod'
import { createAITranslationAbortSignal } from '~/lib/ai-timeout'
import { models } from '~/lib/constants'
import { obsLog } from '~/lib/obs-log'
import { getProviderStrategy, getThinkingConfig } from '~/lib/providers'
import { serializeArticleBlock } from './serialize'

// 序列化是纯逻辑，拆到 `./serialize` 供客户端/Storybook 复用；此处再导出保持原 API
export { serializeArticleBlock }

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
Return a single JSON object of exactly this shape:
{"title":"...","blocks":{"<blockKey>":"<translated text>"}}
- "blocks" is ONE object holding EVERY input key, in the same order as the input.
- Do NOT wrap each block in its own object, and do NOT close "blocks" before the last key.
- Only include "title" when a title is supplied; otherwise omit it.
- Copy the block keys EXACTLY as given.
Two blocks example: {"title":"标题","blocks":{"abc":"第一段译文","def":"第二段译文"}}
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
    // 以「块 key → 原文」的对象喂入，与要求模型返回的 blocks 对象同构。
    // 早前用的是 `[{ key, text }]` 数组，模型会把每个元素当成独立对象，
    // 输出里逐块多打一个 `}`，导致整段 JSON 无法解析（见 AC-TWEET-020）。
    const payload = JSON.stringify(Object.fromEntries(items.map(item => [item.key, item.text])), null, 0)
    const userContent = `${options.translationGlossary ? `<Glossary>\n${options.translationGlossary}\n</Glossary>\n\n` : ''}Translate these blocks:\n${payload}`

    const startedAt = Date.now()
    let lastRaw: Record<string, string> = {}
    let lastError: unknown
    for (let attempt = 0; attempt < 2; attempt++) {
      let response
      try {
        response = await generateText({
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
      }
      catch (error) {
        // 模型偶尔吐出无法解析的 JSON（AI_NoObjectGeneratedError）；重试一次，
        // 而不是让它直接把整篇翻译打断（旧实现会把异常抛出重试循环）。
        lastError = error
        continue
      }

      const returned = response.output.blocks ?? {}
      const accepted: Record<string, string> = {}
      for (const item of items) {
        const translated = returned[item.key]?.trim()
        if (translated && placeholdersOk(translated, item.placeholders))
          accepted[item.key] = translated
      }
      lastRaw = accepted
      lastError = undefined
      if (Object.keys(accepted).length === items.length)
        break
    }

    obsLog('ai.translate.article.batch', {
      blocks: items.length,
      translated: Object.keys(lastRaw).length,
      ms: Date.now() - startedAt,
      error: lastError instanceof Error ? lastError.message : undefined,
    })
    return lastRaw
  }

  let attempted = 0
  let translated = 0

  // 标题单独一批（预算小、优先保证）
  if (title && !looksLikeChinese(title)) {
    attempted += 1
    const titleResult = await translateBatch([{ key: '__title__', text: title, placeholders: [] }])
    if (titleResult.__title__) {
      result.title = titleResult.__title__
      translated += 1
    }
  }

  const pending = blocks.filter(block => !looksLikeChinese(block.text))
  for (const batch of chunkBlocks(pending)) {
    attempted += batch.length
    const batchResult = await translateBatch(batch.map(block => ({ key: block.key, text: block.text, placeholders: block.placeholders })))
    translated += Object.keys(batchResult).length
    Object.assign(result.blocks, batchResult)
  }

  // 单批失败可容忍（保留已翻译成功的块），但整篇一块都没翻出来必须显式报错，
  // 避免以 success 返回空译文、让前端把「失败」当成「已翻译」。
  if (attempted > 0 && translated === 0)
    throw new Error('Article translation failed: no block could be translated')

  return result
}
