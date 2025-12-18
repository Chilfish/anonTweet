import type { ClassValue } from 'clsx'
import type { EnrichedTweet } from './react-tweet'
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

export function parseUserAgent(userAgent: string): {
  system: string
  browser: string
  isMobile: boolean
} {
  const ua = userAgent.toLowerCase()

  let system = 'Unknown'
  let isMobile = false

  if (ua.includes('android')) {
    system = 'Android'
    isMobile = true
  }
  else if (
    ua.includes('ios')
    || ua.includes('iphone')
    || ua.includes('ipad')
  ) {
    system = 'iOS'
    isMobile = true
  }
  else if (ua.includes('windows')) {
    system = 'Windows'
  }
  else if (ua.includes('mac os') || ua.includes('macos')) {
    system = 'Macintosh'
  }
  else if (ua.includes('linux')) {
    system = 'Linux'
  }

  const browserMatchers: {
    regex: RegExp
    name: (match: RegExpMatchArray) => string
  }[] = [
    { regex: /firefox\/(\d+(\.\d+)?)/, name: match => `Firefox ${match[1]}` },
    { regex: /edg\/(\d+(\.\d+)?)/, name: match => `Edge ${match[1]}` },
    { regex: /chrome\/(\d+(\.\d+)?)/, name: match => `Chrome ${match[1]}` },
    { regex: /safari\/(\d+(\.\d+)?)/, name: match => `Safari ${match[1]}` },
    {
      regex: /(opera|opr)\/(\d+(\.\d+)?)/,
      name: match => `Opera ${match[2]}`,
    },
  ]

  let browser = 'Unknown'

  for (const matcher of browserMatchers) {
    const match = ua.match(matcher.regex)
    if (
      match
      && !(matcher.regex.source.includes('safari') && ua.includes('chrome'))
    ) {
      browser = matcher.name(match)
      break
    }
  }

  return { system, browser, isMobile }
}

export function callAll<Args extends Array<unknown>>(
  ...fns: Array<((...args: Args) => unknown) | undefined>
) {
  return (...args: Args) => {
    for (const fn of fns) {
      fn?.(...args)
    }
  }
}

export function formatDate(
  date: Date | string,
  formatString = 'yyyy-MM-dd',
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, formatString)
}

export function getAvatarUrl(
  userImage: string | null | undefined,
  userName: string | null | undefined,
) {
  const seed = userName || 'defaultUser'
  const placeholderUrl = `https://api.dicebear.com/9.x/glass/svg?seed=${seed}&backgroundType=gradientLinear,solid`
  let avatarUrl = null
  if (userImage?.startsWith('http://') || userImage?.startsWith('https://')) {
    avatarUrl = userImage
  }
  else if (userImage?.startsWith('user-avatar/')) {
    avatarUrl = `/images/${userImage}`
  }
  return {
    avatarUrl,
    placeholderUrl,
  }
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

export const toast = {
  success: (title: string, args?: { description: string }) => {
    toastManager.add({
      title,
      type: 'success',
      ...args,
    })
  },
  error: (title: string, args?: { description: string }) => {
    toastManager.add({
      title,
      type: 'error',
      ...args,
    })
  },
  info: (title: string, args?: { description: string }) => {
    toastManager.add({
      title,
      type: 'info',
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
