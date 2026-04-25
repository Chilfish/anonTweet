import type { EnrichedTweet, Entity, MediaDetails, TweetData } from '~/types'
import { format } from 'date-fns'
import { formatDate } from './react-tweet'

export function generateText(tweet: EnrichedTweet): string {
  const entities = tweet.entities || []
  const hasTranslation = entities.some(e => !!e.translation || !!e.aiTranslation)

  // 兼容逻辑：如果没有新规范翻译，看看有没有旧规范翻译
  const entitiesForTranslation = hasTranslation
    ? entities
    : (tweet.autoTranslationEntities?.length ? tweet.autoTranslationEntities : entities)

  const tweetText = entitiesForTranslation.map((entity) => {
    if (entity.type === 'hashtag' || entity.type === 'mention' || entity.type === 'url')
      return entity.text

    if (entity.type === 'text' || entity.type === 'media_alt') {
      const translation = entity.translation || entity.aiTranslation || ''
      const altPrefix = entity.type === 'media_alt' ? `
图${entity.index - 20000 + 1} Alt：` : ''
      return altPrefix + translation
    }
    return null
  })
    .filter(Boolean)
    .join(' ')
  const createAt = formatDate(tweet.created_at)
  const author = tweet.user.name

  return `@${author}
${tweetText}

发布于：${createAt}
链接：${tweet.url}`
}

/**
 * Generates a Markdown string from a list of tweets (thread).
 */
export function generateMarkdownFromTweets(tweets: TweetData): string {
  if (!tweets || tweets.length === 0) {
    return ''
  }

  return tweets
    .map(tweet => generateTweetMarkdown(tweet))
    .join(`---

`)
}

/**
 * Generates Markdown for a single tweet.
 */
function generateTweetMarkdown(tweet: EnrichedTweet): string {
  const indent = ''
  const parts: string[] = []

  const author = tweet.user
  const date = new Date(tweet.created_at)
  const formattedDate = format(date, 'yyyy-MM-dd HH:mm:ss')
  const tweetUrl = tweet.url || `https://x.com/${author.screen_name}/status/${tweet.id_str}`

  parts.push(`${indent}**${author.name}** (@${author.screen_name}) · ${formattedDate}`)
  parts.push(`${indent}[Link to Tweet](${tweetUrl})`)
  parts.push(indent) // Empty line

  const originalText = generateTextFromEntities(tweet.entities, false)
  if (originalText) {
    parts.push(applyIndent(originalText, indent))
  }

  const hasManualTranslation = tweet.entities.some(e => !!e.translation)
  const hasAITranslation = tweet.entities.some(e => !!e.aiTranslation)
  const hasOldAITranslation = !!tweet.autoTranslationEntities?.length

  if (hasManualTranslation) {
    const translatedText = generateTextFromEntities(tweet.entities, true)
    if (translatedText && translatedText !== originalText) {
      parts.push(indent)
      parts.push(`${indent}**Translation:**
`)
      parts.push(applyIndent(translatedText, indent))
    }
  }
  else if (hasAITranslation) {
    const aiText = generateTextFromEntities(tweet.entities, true)
    if (aiText && aiText !== originalText) {
      parts.push(indent)
      parts.push(`${indent}**AI Translation:**
`)
      parts.push(applyIndent(aiText, indent))
    }
  }
  else if (hasOldAITranslation) {
    // Fallback to old auto translation if no new translation fields
    const autoText = generateTextFromEntities(tweet.autoTranslationEntities!, true)
    if (autoText && autoText !== originalText) {
      parts.push(indent)
      parts.push(`${indent}**AI Translation:**
`)
      parts.push(applyIndent(autoText, indent))
    }
  }

  if (tweet.mediaDetails && tweet.mediaDetails.length > 0) {
    parts.push(indent)
    const altTranslationEntities = [
      (tweet.entities.filter(e => e.type === 'media_alt') || []),
      (tweet.autoTranslationEntities || []).filter(e => e.type === 'media_alt'),
    ]
      .flat()
      // 这里的排序优先级：手动 translation > 新 AI aiTranslation > 旧 AI translation
      .filter(e => e.translation || e.aiTranslation)

    const mediaMarkdown = generateMediaMarkdown(tweet.mediaDetails, altTranslationEntities)
    parts.push(applyIndent(mediaMarkdown, indent))
  }

  if (tweet.quotedTweet) {
    parts.push(indent)
    parts.push(`${indent}**Quoted Tweet:**`)
    // Recursive call for quoted tweet
    parts.push(generateTweetMarkdown(tweet.quotedTweet))
  }

  return parts.join('\n')
}

/**
 * Helper to apply indentation to multiline strings
 */
function applyIndent(text: string, indent: string): string {
  if (!indent)
    return text
  return text.split('\n').map(line => `${indent}${line}`).join('\n')
}

/**
 * Generates text content from entities.
 * If useTranslation is true, prefers 'translation' field over 'text'.
 */
function generateTextFromEntities(entities: Entity[], useTranslation: boolean): string {
  if (!entities || entities.length === 0)
    return ''

  return entities.map((item) => {
    // Determine content: manual translation > AI translation > original text
    const content = useTranslation
      ? (item.translation || item.aiTranslation || item.text)
      : item.text

    // Skip technical/hidden entities
    if (item.index < 0)
      return ''
    if (item.type === 'media' || item.type === 'media_alt' || item.type === 'separator')
      return '' // Handled separately

    // Format based on type
    switch (item.type) {
      case 'url':
        return `[${item.display_url}](${item.expanded_url || item.url})`
      case 'hashtag':
        return `[${content}](https://x.com/hashtag/${content})`
      case 'mention':
        return `[@${content}](https://x.com/${content})`
      case 'symbol':
        return `$${content}`
      default:
        return content
    }
  }).join('').trim()
}

/**
 * Generates Markdown for media items.
 */
function generateMediaMarkdown(media: MediaDetails[], altTranslationEntities: Entity[]): string {
  return media.map((item, idx) => {
    if (item.type === 'photo') {
      const alt = item.ext_alt_text ? `

Alt(${idx + 1} of ${media.length}): ${item.ext_alt_text}` : ''
      // 获取该图片的翻译：优先取 manual translation，其次取 aiTranslation
      const altEntity = altTranslationEntities.find(e =>
        (e as any).mediaIndex === idx || e.index === 20000 + idx,
      )
      const autoAlt = altEntity?.translation || altEntity?.aiTranslation

      return `![Image(${idx + 1} of ${media.length})](${item.media_url_https})${alt}${autoAlt ? `

**Alt Translation:** ${autoAlt}` : ''}`
    }
    else if (item.type === 'video' || item.type === 'animated_gif') {
      const bestVariant = item.video_info?.variants
        .filter(v => v.content_type === 'video/mp4')
        .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0]

      const videoUrl = bestVariant?.url || item.media_url_https
      return `![Video Thumbnail](${item.media_url_https})
[Watch Video](${videoUrl})`
    }
    return ''
  }).join('\n\n')
}
