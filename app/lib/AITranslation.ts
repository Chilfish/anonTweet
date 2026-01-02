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
You are a professional translator specializing in social media content localization (Twitter/X). You possess deep knowledge of internet slang, pop culture, and technical terminology.

# Task
Translate the user's input text into **Simplified Chinese (简体中文)**.

# Critical Rules for Entity Placeholders
The input text contains placeholders like \`<<__TYPE_INDEX__>>\` (e.g., \`<<__URL_0__>>\`, \`<<__HASHTAG_1__>>\`).
1. **IMMUTABLE**: You MUST preserve these placeholders EXACTLY as they appear. Do not translate, remove, or modify the characters inside the double brackets.
2. **POSITIONING**: You MUST reorder these placeholders within the sentence to strictly follow natural Chinese grammar and word order.
3. **CONTEXT**: Use the provided "Entity Reference" to understand what the placeholder represents (e.g., distinguishing a person from a topic), but DO NOT replace the placeholder with the reference content in your final output.

# Output Format
Return ONLY the translated text string. No markdown code blocks, no explanations, no extra quotes.
`

  const userContent = `
# Glossary & Context

<translationGlossary>
${translationGlossary}
</translationGlossary>

Tweet author: ${tweet.user.screen_name}
Tweet created at: ${tweet.created_at}

${tweet.quotedTweet ? `Context (Quoted tweet by @${tweet.quotedTweet.user.screen_name}, DO NOT TRANSLATE this part, use it only for context):\n${tweet.quotedTweet.text}` : ''}

# Entity Reference (For Context Only - Do NOT Translate Content)
${entityContext}

# Source Text to Translate
${maskedText}
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
