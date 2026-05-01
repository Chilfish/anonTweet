import type { LanguageModel, ModelMessage } from 'ai'
import type { ThinkingLevel } from '~/lib/stores/appConfig'
import type { EnrichedTweet, Entity } from '~/types'
import { generateText, Output, zodSchema } from 'ai'
import { z } from 'zod'
import { models } from '~/lib/constants'
import { getProviderStrategy, getThinkingConfig } from '~/lib/providers'
import {
  applyAITranslations,
  restoreEntities,
  serializeForAI,
} from '~/lib/react-tweet'

/**
 * 将实体 Map 转换为 AI 可读的参考文本
 * 目的：让 AI 知道占位符背后是什么，以便更好地理解上下文，但不需要 AI 翻译它们
 */
export function generateEntityContext(entityMap: Map<string, Entity>): string {
  if (entityMap.size === 0)
    return 'None'

  let contextStr = ''
  entityMap.forEach((entity, placeholder) => {
    // 根据类型提供最有价值的参考信息
    let contentInfo = ''
    switch (entity.type) {
      case 'hashtag':
      case 'mention':
      case 'symbol':
        contentInfo = entity.text // 如: #Anime, @User
        break
      case 'url':
        contentInfo = `URL (${entity.display_url || 'link'})`
        break
      case 'media':
        contentInfo = 'Media Attachment'
        break
      case 'separator':
        contentInfo = 'Section Divider (Image Description follows)'
        break
      case 'media_alt':
        contentInfo = 'Image Description (Alt Text)'
        break
      default:
        contentInfo = entity.text
    }
    const translationPolicy = entity.type === 'hashtag' || entity.type === 'symbol'
      ? 'display text can be translated via entityText'
      : 'display text must NOT be translated'
    contextStr += `- ${placeholder} (${entity.type}, ${translationPolicy}): ${contentInfo}\n`
  })
  return contextStr
}

interface TranslatePayload {
  tweet: EnrichedTweet
  maskedText: string
  entityContext: string
  placeholders?: string[]
  entityMap?: Map<string, Entity>
  translationGlossary?: string
  model: LanguageModel
  modelName: string
  thinkingLevel?: ThinkingLevel
}

const PLACEHOLDER_REGEX = /<<__[A-Z]+_\d+__>>/g

function uniqueStrings(list: string[]) {
  return Array.from(new Set(list))
}

function validatePlaceholders(text: string, expectedPlaceholders: string[]) {
  const expected = uniqueStrings(expectedPlaceholders)
  if (expected.length === 0)
    return { ok: true as const, missing: [] as string[], extra: [] as string[] }

  const actual = uniqueStrings(text.match(PLACEHOLDER_REGEX) ?? [])
  const actualSet = new Set(actual)
  const expectedSet = new Set(expected)

  const missing = expected.filter(p => !actualSet.has(p))
  const extra = actual.filter(p => !expectedSet.has(p))

  return { ok: missing.length === 0 && extra.length === 0, missing, extra }
}

function validateEntityTextOverrides(
  entityText: Record<string, string> | undefined,
  placeholders: string[],
  entityMap: Map<string, Entity> | undefined,
) {
  if (!entityText)
    return { ok: true as const, errors: [] as string[] }

  const errors: string[] = []
  const placeholderSet = new Set(placeholders)
  const allowedTypes = new Set<Entity['type']>(['hashtag', 'symbol'])

  for (const [key, value] of Object.entries(entityText)) {
    if (!placeholderSet.has(key)) {
      errors.push(`unknown_placeholder:${key}`)
      continue
    }
    if (typeof value !== 'string' || !value.trim()) {
      errors.push(`invalid_value:${key}`)
      continue
    }
    const entity = entityMap?.get(key)
    if (!entity) {
      errors.push(`missing_entity:${key}`)
      continue
    }
    if (!allowedTypes.has(entity.type)) {
      errors.push(`disallowed_type:${key}:${entity.type}`)
      continue
    }
  }

  return { ok: errors.length === 0, errors }
}

function applyEntityTextOverrides(entityMap: Map<string, Entity>, entityText: Record<string, string> | undefined) {
  if (!entityText || Object.keys(entityText).length === 0)
    return entityMap

  const next = new Map<string, Entity>()
  entityMap.forEach((entity, placeholder) => {
    const override = entityText[placeholder]
    if (override) {
      next.set(placeholder, { ...entity, text: override })
    }
    else {
      next.set(placeholder, entity)
    }
  })
  return next
}

function countNewlines(text: string) {
  return (text.match(/\n/g) ?? []).length
}

function normalizeNewlineEscapes(text: string, expectedNewlineCount: number) {
  if (expectedNewlineCount > 0 && !text.includes('\n') && text.includes('\\n'))
    return text.replaceAll('\\n', '\n')
  return text
}

export async function translateText({
  tweet,
  maskedText,
  entityContext,
  placeholders = [],
  entityMap,
  translationGlossary,
  model,
  modelName,
  thinkingLevel = 'minimal',
}: TranslatePayload) {
  const systemPrompt = `
# Role Definition
You are a professional Cross-Cultural Localization Expert specializing in Japanese-to-Chinese (Simplified) translation for social media.
Your expertise covers precise nuance mapping, social hierarchy management (Keigo/Honorifics), and industry-standard terminology handling.

# Core Mission
Translate the input text into natural, native-level Simplified Chinese while strictly preserving the original social distance, tone, and information accuracy.

# 1. Social Distance & Honorifics Mapping
Japanese address terms reflect strict social hierarchies.

# 2. Conservative Naming Protocol (Industry Standard)
To avoid "Hallucinated Translation" or "Awkward Transliteration", follow these rules for Proper Nouns (Names, Song Titles, Event Names, Neologisms):
1. **Check Glossary First**: If the term exists in the provided glossary, use it.
2. **People Names (STRICT)**: Never translate personal names (real people, characters, artists, VAs). Keep the original form unless the glossary explicitly provides an established Simplified Chinese name.
3. **Works/Programs (OK to translate)**: For works/program titles (anime, songs, albums, TV shows, events), translate only if there is a widely accepted Simplified Chinese name or a clear, non-hallucinated semantic translation. If unsure, keep original.

# 3. Entity Placeholder Rules
The input contains immutable placeholders like \`<<__TYPE_INDEX__>>\`.
- **PRESERVE**: Keep them exactly as is.
- **REORDER**: Move them to fit valid Chinese syntax.
- **CONTEXT**: Use "Entity Reference" to determine if the placeholder is a Subject, Object, or Modifier, and adjust the surrounding verbs accordingly.
You may provide translated display text for HASHTAG/SYMBOL placeholders via the \`entityText\` field in JSON, but you must still keep the placeholders unchanged inside \`translation\`. Never translate MENTION placeholders.

# 4. Newline Preservation (Preferred)
If the source text contains newline characters, keep line breaks where it makes sense for readability.
If you output newlines in JSON, output real newline characters (not the two-character sequence "\\n").

# 5. Universal Domain Adaptation
Analyze the [Author] and [Context] to adapt your style:
- **Corporate/Official**: Accurate, Informative, Professional.
- **Personal/Idol/Artist**: Emotional, Expressive, preservation of "Voice".
- **Tech/Specialist**: Precise terminology, Logical flow.

# Output Format
Return a single JSON object with EXACTLY this shape:
{"translation":"...","entityText":{"<<__HASHTAG_0__>>":"#翻译后tag"}}
No markdown, no notes, no extra keys.
`

  const userContent = `
# Contextual Data

<Glossary>
(Priority Level: HIGH. Use these exact translations.)
${translationGlossary || ''}
</Glossary>

**Author Profile**: ${tweet.user.screen_name}
(Analyze the author: Is this an official account, a real person, or a bot? Adjust the politeness level accordingly.)

**Post Time**: ${tweet.created_at}

${tweet.quotedTweet ? `
**Reference Context (Quoted Tweet)**:
(The author is reacting to this. Use this to clarify pronouns like "sore" or "kare".)
"""
${tweet.quotedTweet.text}
"""
` : ''}

# Entity Reference (Type Identification)
(Use this to identify if a placeholder is a Person, Group, or Abstract Concept)
${entityContext}

# Source Text to Translate
(Instruction: Apply the 'Conservative Naming Protocol'. If unsure about a name, keep original.)
"""
${maskedText}
"""
`

  const baseMessages: ModelMessage[] = [
    { role: 'user', content: userContent },
  ]

  const modelConfig = models.find(m => m.name === modelName)
  const strategy = modelConfig ? getProviderStrategy(modelConfig.provider) : null

  const thinkingConfig = getThinkingConfig(modelName, thinkingLevel)
  const expectedNewlineCount = countNewlines(maskedText)
  const output = Output.object({
    schema: zodSchema(z.object({
      translation: z.string().min(1),
      entityText: z.record(z.string(), z.string()).optional(),
    })),
    name: 'translation_result',
    description: 'A single JSON object containing the translated text.',
  })

  try {
    let messages = baseMessages
    let lastValidation = { ok: false, missing: [] as string[], extra: [] as string[] }
    let lastOverrideValidation: {
      ok: boolean
      errors: string[]
    } = { ok: true as const, errors: [] }

    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await generateText({
        model,
        system: systemPrompt,
        messages,
        output,
        temperature: 0.5,
        providerOptions: strategy && modelConfig
          ? strategy.buildProviderOptions(thinkingConfig, modelConfig)
          : {},
      })

      const translated = normalizeNewlineEscapes(response.output.translation, expectedNewlineCount).trim()
      lastValidation = validatePlaceholders(translated, placeholders)
      lastOverrideValidation = validateEntityTextOverrides(response.output.entityText, placeholders, entityMap)
      const newlineOk = expectedNewlineCount === 0 || countNewlines(translated) > 0
      if (lastValidation.ok && lastOverrideValidation.ok) {
        if (newlineOk || attempt === 1) {
          return {
            translatedText: translated,
            entityText: response.output.entityText,
          }
        }
      }

      messages = [
        ...baseMessages,
        {
          role: 'user',
          content: [
            '你的上一次输出违反了占位符规则：',
            lastValidation.missing.length ? `- 缺失占位符: ${lastValidation.missing.join(', ')}` : '- 缺失占位符: 无',
            lastValidation.extra.length ? `- 多余/未知占位符: ${lastValidation.extra.join(', ')}` : '- 多余/未知占位符: 无',
            lastOverrideValidation.ok ? '- entityText 校验: 通过' : `- entityText 校验失败: ${lastOverrideValidation.errors.join(', ')}`,
            expectedNewlineCount > 0 && countNewlines(translated) === 0 ? '- 换行提示: 你的输出把换行全部压成一行了，请尽量保留换行以提升可读性。' : '- 换行提示: 无',
            '',
            '请重新输出，并且：',
            '1) 保留所有占位符，完全一致（包括大小写与下划线）。',
            '2) 不要新增或改写任何占位符。',
            '3) 仅输出 JSON：{"translation":"...","entityText":{...}}（不需要的 key 就不要写）。',
            '4) entityText 只允许写 hashtag/symbol 的占位符；@mention（人名/用户名）绝对不要翻译。',
            '5) 如果原文有换行，请尽量保留换行（不要把全部内容挤成一行；不要输出 "\\n"，要输出真实换行）。',
          ].join('\n'),
        },
      ]
    }

    throw new Error(`AI Translation Validation Failed (missing=${lastValidation.missing.length}, extra=${lastValidation.extra.length}, entityTextErrors=${lastOverrideValidation.errors.length})`)
  }
  catch (error) {
    console.error('AI Translation Failed:', error)
    throw error
  }
}

interface TranslationOptions {
  model: string
  apiKey: string
  provider: 'google' | 'deepseek'
  translationGlossary?: string
  tweet: EnrichedTweet
  thinkingLevel?: ThinkingLevel
}

export async function autoTranslateTweet({
  tweet,
  model,
  provider,
  translationGlossary,
  apiKey,
  thinkingLevel,
}: TranslationOptions) {
  const { entityMap, maskedText } = serializeForAI(tweet.entities)
  if (!maskedText.trim()) {
    return []
  }
  const entityContext = generateEntityContext(entityMap)

  const strategy = getProviderStrategy(provider)
  const sdkProvider = strategy.createSDKProvider(apiKey)

  const { translatedText, entityText } = await translateText({
    tweet,
    maskedText,
    entityContext,
    placeholders: Array.from(entityMap.keys()),
    entityMap,
    model: sdkProvider(model),
    modelName: model,
    translationGlossary,
    thinkingLevel,
  })
  if (!translatedText) {
    return tweet.entities
  }
  const entityMapForRestore = applyEntityTextOverrides(entityMap, entityText)
  const aiEntities = restoreEntities(translatedText, entityMapForRestore, tweet.entities)
  return applyAITranslations(tweet.entities, aiEntities)
}
