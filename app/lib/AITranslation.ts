import type { LanguageModel, ModelMessage } from 'ai'
import type { EnrichedTweet, Entity } from '~/types'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText } from 'ai'
import {
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
}

export async function translateText({ tweet, maskedText, entityContext, translationGlossary, model }: TranslatePayload) {
  const systemPrompt = `
# Role Definition
You are a top-tier Localization Specialist converting Japanese Social Media posts (Twitter/X) into **Simplified Chinese (简体中文)**.
You are an expert in Japanese Internet culture, ACG (Anime/Comic/Games), Idol fandoms, and modern slang.

# Core Objective
Produce a translation that feels "native" to the Chinese community. It should not read like a translation but like a post originally written by a Chinese user in the same context.

# Contextual Analysis Protocol (CRITICAL)
Before translating, analyze the provided [Glossary], [Author Info], and [Quoted Tweet] to determine the **Domain**:
- **Entertainment/ACG Context**: If keywords involve anime, games, idols, or events (e.g., Bushiroad):
    - "コンテンツ" (Contents) → "IP" / "企划" / "系列作品".
    - "参戦" → "出演" / "登场" / "加入".
    - "解禁" → "公开" / "发布".
- **General/Casual Context**: Use trendy, natural Chinese internet slang appropriate for the tone.
- **Tone Matching**: If the author is a character/idol, preserve their unique speech quirks (e.g., cuteness, emojis) in the Chinese phrasing.

# Critical Rules for Entity Placeholders
The input text contains placeholders like \`<<__TYPE_INDEX__>>\` (e.g., \`<<__URL_0__>>\`, \`<<__HASHTAG_1__>>\`).
1. **IMMUTABLE**: You MUST preserve these placeholders EXACTLY. Do NOT translate or modify the internal IDs.
2. **SYNTACTIC REORDERING**: You MUST move these placeholders to fit natural Chinese sentence structure.
    - *Bad*: "关于 <<__HASHTAG_0__>>" (Japanese order).
    - *Good*: "关于 <<__HASHTAG_0__>> 这个话题" or placing it where a noun belongs.
3. **CONTEXT**: Use the "Entity Reference" to understand if a placeholder is a Person, Event, or Link, and choose the surrounding verbs/particles accordingly.

# Output Rules
- Return **ONLY** the translated text string.
- No markdown, no explanations, no "Translation:" prefix.
- Do not keep Japanese punctuation (use Chinese full-width punctuation).
`

  const userContent = `
# 1. Domain Knowledge & Glossary
(Strictly prioritize these terms if they appear)
<Glossary>
${translationGlossary}
</Glossary>

# 2. Situational Context
**Author Profile**: ${tweet.user.screen_name} (Analyze this to determine tone: Official vs. Personal vs. Role-play)
**Post Time**: ${tweet.created_at}

${tweet.quotedTweet ? `
**Reference Material (Quoted Tweet)**:
(Use this ONLY to understand what the author is reacting to. DO NOT translate this.)
**Author**: ${tweet.quotedTweet.user.screen_name}
**Post Time**: ${tweet.quotedTweet.created_at}

"""
${tweet.quotedTweet.text}
"""
` : ''}

# 3. Entity Reference
(Use this to identify what the placeholders represent, e.g., if <<__MENTION_0__>> is a company or a friend)
${entityContext}

# 4. Source Text to Translate
(Translate the text below into natural, localized Simplified Chinese)
"""
${maskedText}
"""
`

  const messages: ModelMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent },
  ]

  try {
    const response = await generateText({
      model,
      messages,
      temperature: 1,
    })
    return response.text.trim()
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
}

export async function autoTranslateTweet({ tweet, model, translationGlossary, apiKey }: TranslationOptions) {
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
    translationGlossary,
  })
  if (!translatedTextString) {
    return []
  }
  return restoreEntities(translatedTextString, entityMap)
}
