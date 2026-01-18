import type { ClassValue } from 'clsx'
import type { EnrichedTweet } from '~/types'
import { clsx } from 'clsx'
import { format, parseISO } from 'date-fns'
import { twMerge } from 'tailwind-merge'
import { toastManager } from '~/components/ui/toast'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function extractTweetId(input: string): string | null {
  // Remove whitespace
  const trimmed = input.trim()

  // If it's already just a tweet ID (numeric string)
  if (/^\d+$/.test(trimmed)) {
    return trimmed
  }

  // Twitter URL patterns
  const patterns = [
    // Standard twitter.com URLs
    /(?:https?:\/\/)?(?:www\.)?twitter\.com\/\w+\/status\/(\d+)/i,
    // x.com URLs
    /(?:https?:\/\/)?(?:www\.)?x\.com\/\w+\/status\/(\d+)/i,
    // Mobile URLs
    /(?:https?:\/\/)?(?:mobile\.)?twitter\.com\/\w+\/status\/(\d+)/i,
    /(?:https?:\/\/)?(?:mobile\.)?x\.com\/\w+\/status\/(\d+)/i,
  ]

  for (const pattern of patterns) {
    const match = trimmed.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

export function proxyMedia(url: string) {
  return url
  // return `https://proxy.chilfish.top/${url}`
}

export function formatDate(
  date: Date | string,
  formatString = 'yyyy-MM-dd',
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, formatString)
}

export function flatTweets(tweets: EnrichedTweet[]): EnrichedTweet[] {
  const copiedTweets = structuredClone(tweets)
  return copiedTweets.flatMap((tweet) => {
    const quotedTweet = tweet.quotedTweet

    if (quotedTweet) {
      delete tweet.quotedTweet
      return [
        quotedTweet,
        tweet,
      ]
    }
    return [tweet]
  })
}

const toastTimeout = 3000
export const toast = {
  success: (title: string, args?: { description: string }) => {
    toastManager.add({
      title,
      type: 'success',
      timeout: toastTimeout,
      ...args,
    })
  },
  error: (title: string, args?: { description: string }) => {
    toastManager.add({
      title,
      type: 'error',
      timeout: toastTimeout,
      ...args,
    })
  },
  info: (title: string, args?: { description: string }) => {
    toastManager.add({
      title,
      type: 'info',
      timeout: toastTimeout,
      ...args,
    })
  },
}

// 预定义常用实体映射表 (根据需求定制)
const ENTITY_MAP: Record<string, string> = {
  // 基础字符
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': '\'',
  '&nbsp;': '\u00A0', // Non-breaking space

  // 符号与标点
  '&ndash;': '–',
  '&mdash;': '—',
  '&copy;': '©',
  '&reg;': '®',
  '&trade;': '™',

  // 数学与货币
  '&asymp;': '≈',
  '&ne;': '≠',
  '&pound;': '£',
  '&euro;': '€',
  '&deg;': '°',
}

export function decodeHtmlEntities(text: string): string {
  if (!text)
    return ''

  // Regex 解释:
  // &           : 匹配 & 开始
  // (           : 捕获组开始
  //   #x[0-9a-f]+ : 十六进制实体 (如 &#x27;)
  //   |           : 或
  //   #[0-9]+     : 十进制实体 (如 &#39;)
  //   |           : 或
  //   [a-z0-9]+   : 命名实体 (如 &amp;)
  // )           : 捕获组结束
  // ;           : 匹配 ; 结束
  const entityPattern = /&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z0-9]+);/g

  return text.replace(entityPattern, (fullMatch, content) => {
    // 1. 优先查表 (最快路径)
    const mapped = ENTITY_MAP[fullMatch]
    if (mapped)
      return mapped

    // 2. 处理数字编码 (通用兜底)
    if (content.charAt(0) === '#') {
      const isHex = content.charAt(1).toLowerCase() === 'x'
      const code = isHex
        ? Number.parseInt(content.substring(2), 16)
        : Number.parseInt(content.substring(1), 10)

      // 过滤无效的 Unicode 码点
      if (!isNaN(code) && code >= -1) {
        return String.fromCharCode(code)
      }
    }

    // 3. 无法解析时保留原样
    return fullMatch
  })
}
