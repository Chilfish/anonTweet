import type { ModelMessage } from 'ai'
import type { Route } from './+types/get'
import type { EnrichedTweet } from '~/lib/react-tweet'
import type { Entity } from '~/lib/react-tweet/api-v2/entitytParser'
import type { TweetData } from '~/types'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText } from 'ai'
import {

  restoreEntities,
  serializeForAI,
} from '~/lib/react-tweet/api-v2/entitytParser'
import { getTweets } from '~/lib/service/getTweet'
import { getDBTweet } from '~/lib/service/getTweet.server'
import { extractTweetId } from '~/lib/utils'

const gemini = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
})

// 术语表：可根据需要扩展
const translationGlossary = `

`

/**
 * 将实体 Map 转换为 AI 可读的参考文本
 * 目的：让 AI 知道占位符背后是什么，以便更好地理解上下文，但不需要 AI 翻译它们
 */
function generateEntityContext(entityMap: Map<string, Entity>): string {
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
  maskedText: string
  entityContext: string
}

async function translateText({ maskedText, entityContext }: TranslatePayload) {
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
${translationGlossary}

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
      model: gemini('models/gemini-3-flash-preview'),
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

async function autoTranslateTweet(tweet: EnrichedTweet) {
  const { entityMap, maskedText } = serializeForAI(tweet.entities)
  if (!maskedText.trim()) {
    return []
  }
  const entityContext = generateEntityContext(entityMap)
  const translatedTextString = await translateText({
    maskedText,
    entityContext,
  })
  if (!translatedTextString) {
    return []
  }
  return restoreEntities(translatedTextString, entityMap)
}

export async function loader({
  params,
}: Route.LoaderArgs): Promise<TweetData & {
  tweetId?: string
}> {
  const { id } = params
  const tweetId = extractTweetId(id)

  if (!tweetId) {
    return []
  }

  const tweets = await getTweets(tweetId, getDBTweet)

  // 并发处理所有推文的翻译（适用于 Thread/Conversation）
  // 使用 Promise.allSettled 或 Promise.all 都可以，这里直接用 Promise.all 等待完成
  // map 允许并行启动所有请求
  await Promise.all(
    tweets.map(async (tweet) => {
      try {
        // 只有当推文是主要推文或者是 Thread 的一部分时才翻译，避免翻译过多无关回复（可选优化）
        tweet.autoTranslationEntities = await autoTranslateTweet(tweet)
      }
      catch (e) {
        console.error(`Failed to translate tweet ${tweet.id_str}`, e)
        tweet.autoTranslationEntities = [] // 保持结构一致性
      }
    }),
  )

  return tweets
}
