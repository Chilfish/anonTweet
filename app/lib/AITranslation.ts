import type { GoogleGenerativeAIProviderOptions } from '@ai-sdk/google'
import type { LanguageModel, ModelMessage } from 'ai'
import type { ThinkingLevel } from '~/lib/stores/appConfig'
import type { EnrichedTweet, Entity } from '~/types'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText } from 'ai'
import { models } from '~/lib/constants'
import {
  restoreEntities,
  serializeForAI,
} from '~/lib/react-tweet'

/**
 * 将思考程度映射为 Gemini 2.5 的 thinkingBudget (token 数)
 */
export function mapLevelToBudget(level: ThinkingLevel): number {
  switch (level) {
    case 'minimal': return 0
    case 'low': return 1024
    case 'medium': return 4096
    case 'high': return 16384
    default: return 0
  }
}

/**
 * 获取对应模型的思考配置
 */
export function getThinkingConfig(modelName: string, level: ThinkingLevel = 'minimal') {
  const modelConfig = models.find(m => m.name === modelName)
  const thinkingConfig: any = { includeThoughts: false }

  if (modelConfig?.thinkingType === 'level') {
    thinkingConfig.thinkingLevel = level
  }
  else if (modelConfig?.thinkingType === 'budget') {
    thinkingConfig.thinkingBudget = mapLevelToBudget(level)
  }

  return thinkingConfig
}

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
    contextStr += `- ${placeholder}: ${contentInfo}\n`
  })
  return contextStr
}

interface TranslatePayload {
  tweet: EnrichedTweet
  maskedText: string
  entityContext: string
  translationGlossary?: string
  model: LanguageModel
  modelName: string
  thinkingLevel?: ThinkingLevel
}

export async function translateText({
  tweet,
  maskedText,
  entityContext,
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
2. **Retain Original**: If a Proper Noun (especially names with mixed Kanji/Kana or creative Katakana) is NOT in the glossary and does not have a widely accepted Chinese translation
3. **Do Not force-translate**: Never invent a Chinese name for a character or person if you are unsure.

# 3. Entity Placeholder Rules
The input contains immutable placeholders like \`<<__TYPE_INDEX__>>\`.
- **PRESERVE**: Keep them exactly as is.
- **REORDER**: Move them to fit valid Chinese syntax.
- **CONTEXT**: Use "Entity Reference" to determine if the placeholder is a Subject, Object, or Modifier, and adjust the surrounding verbs accordingly.

# 4. Universal Domain Adaptation
Analyze the [Author] and [Context] to adapt your style:
- **Corporate/Official**: Accurate, Informative, Professional.
- **Personal/Idol/Artist**: Emotional, Expressive, preservation of "Voice".
- **Tech/Specialist**: Precise terminology, Logical flow.

# Output Format
Return ONLY the translated string. No markdown, no notes.
`

  const userContent = `
# Contextual Data

<Glossary>
(Priority Level: HIGH. Use these exact translations.)
${translationGlossary}
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

  const messages: ModelMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent },
  ]

  const thinkingConfig = getThinkingConfig(modelName, thinkingLevel)

  try {
    const response = await generateText({
      model,
      messages,
      temperature: 1,
      providerOptions: {
        google: {
          thinkingConfig,
        } satisfies GoogleGenerativeAIProviderOptions,
      },
    })
    const text = response.text.trim()

    return text.replace(/^thought[ful].*\n/g, '')
  }
  catch (error) {
    console.error('AI Translation Failed:', error)
    return null
  }
}

interface TranslationOptions {
  model: string
  apiKey: string
  translationGlossary?: string
  tweet: EnrichedTweet
  thinkingLevel?: ThinkingLevel
}

export async function autoTranslateTweet({
  tweet,
  model,
  translationGlossary,
  apiKey,
  thinkingLevel,
}: TranslationOptions) {
  const { entityMap, maskedText } = serializeForAI(tweet.entities)
  if (!maskedText.trim()) {
    return []
  }
  const entityContext = generateEntityContext(entityMap)

  const gemini = createGoogleGenerativeAI({
    apiKey,
  })

  const translatedTextString = await translateText({
    tweet,
    maskedText,
    entityContext,
    model: gemini(model),
    modelName: model,
    translationGlossary,
    thinkingLevel,
  })
  if (!translatedTextString) {
    return []
  }
  return restoreEntities(translatedTextString, entityMap)
}
