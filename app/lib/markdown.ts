import type { EnrichedTweet, Entity, MediaDetails, TweetData } from '~/types'
import { format } from 'date-fns'
import { formatDate } from './react-tweet'

export function generateText(tweet: EnrichedTweet): string {
  const tweetText = tweet.entities.map((entity) => {
    if (entity.type === 'hashtag' || entity.type === 'mention' || entity.type === 'url')
      return entity.text

    if (entity.type === 'text' || entity.type === 'media_alt') {
      const translation = entity.translation ?? (tweet.autoTranslationEntities?.find(e => e.index === entity.index)?.translation || '')
      const altPrefix = entity.type === 'media_alt' ? `\n图${entity.index - 20000 + 1} Alt：` : ''
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
    .join('---\n\n')
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
  const hasTranslation = tweet.entities.some(e => !!e.translation)
  const translatedText = generateTextFromEntities(tweet.entities, true)

  if (hasTranslation && translatedText && translatedText !== originalText) {
    parts.push(indent)
    parts.push(`${indent}**Translation:**\n`)
    parts.push(applyIndent(translatedText, indent))
  }
  else if (tweet.autoTranslationEntities && tweet.autoTranslationEntities.length > 0 && !hasTranslation) {
    // Fallback to auto translation if no manual translation in main entities
    const autoText = generateTextFromEntities(tweet.autoTranslationEntities, true)
    if (autoText) {
      parts.push(indent)
      parts.push(`${indent}**AI Translation:**\n`)
      parts.push(applyIndent(autoText, indent))
    }
  }

  if (tweet.mediaDetails && tweet.mediaDetails.length > 0) {
    parts.push(indent)
    const altTranslationEntities = [
      (tweet.autoTranslationEntities || []).filter(e => e.type === 'media_alt'),
      (tweet.entities.filter(e => e.type === 'media_alt') || []),
    ]
      .flat()
      .filter(e => e.translation)
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
    // Determine content
    const content = (useTranslation && item.translation) ? item.translation : item.text

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
      const alt = item.ext_alt_text ? `\n\nAlt(${idx + 1} of ${media.length}): ${item.ext_alt_text}` : ''
      const autoAlt = altTranslationEntities[idx]?.translation

      return `![Image(${idx + 1} of ${media.length})](${item.media_url_https})${alt}${autoAlt ? `\n\n**Alt Translation:** ${autoAlt}` : ''}`
    }
    else if (item.type === 'video' || item.type === 'animated_gif') {
      const bestVariant = item.video_info?.variants
        .filter(v => v.content_type === 'video/mp4')
        .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0]

      const videoUrl = bestVariant?.url || item.media_url_https
      return `![Video Thumbnail](${item.media_url_https})\n[Watch Video](${videoUrl})`
    }
    return ''
  }).join('\n\n')
}
