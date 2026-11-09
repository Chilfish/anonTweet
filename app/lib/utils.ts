import type { ClassValue } from 'clsx'
import type { TranslationDicEntry } from './stores/TranslationDictionary'
import type { EnrichedTweet } from '~/types'
import { clsx } from 'clsx'
import { format, parseISO } from 'date-fns'
import { twMerge } from 'tailwind-merge'
import { toastManager } from '~/components/ui/toast'
// 纯 URL 检测（无 DOM/UI 依赖）已抽离到 url-detect.ts；此处 re-export 保持既有调用点不变
export {
  detectInputType,
  extractIGId,
  extractTweetId,
  igIdToSourceUrl,
  isIGListId,
} from '~/lib/url-detect'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const HTML_ENTITY_RE = /&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z0-9]+);/g

export function formatDate(
  date: Date | string,
  formatString = 'yyyy-MM-dd',
): string {
  const dateObj = typeof date === 'string'
    ? parseISO(date)
    : date
  return format(dateObj, formatString)
}

/**
 * Instagram 卡片专用时间格式化（中日风格）。
 * @param iso   ISO 时间字符串
 * @param format 'card' = "2026年05月31日 19:30"，'plain' = "2026-05-31 19:30"
 */
export function formatIGTime(iso: string, format: 'card' | 'plain' = 'card'): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  if (format === 'plain')
    return `${y}-${mo}-${day} ${h}:${mi}`
  return `${y}年${mo}月${day}日 ${h}:${mi}`
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
  const entityPattern = HTML_ENTITY_RE

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

export function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for non-secure contexts
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

export async function downloadExcel(entries: TranslationDicEntry[]) {
  const XLSX = await import('xlsx')
  const data = entries.map(e => ({
    原文: e.original,
    译文: e.translated,
  }))
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Dictionary')
  XLSX.writeFile(wb, `翻译对照表_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

export async function parseExcel(data: ArrayBuffer): Promise<Omit<TranslationDicEntry, 'id' | 'createdAt'>[]> {
  const XLSX = await import('xlsx')
  const wb = XLSX.read(data, { type: 'array' })
  const wsName = wb.SheetNames[0]
  if (!wsName)
    return []
  const ws = wb.Sheets[wsName]!
  const jsonData = XLSX.utils.sheet_to_json<any>(ws)

  return jsonData
    .map((item) => {
      // Try to find fields by common names (case-insensitive or Chinese)
      const keys = Object.keys(item)
      const originalKey = keys.find(k => k.toLowerCase() === 'original' || k === '原文')
      const translatedKey = keys.find(k => k.toLowerCase() === 'translated' || k === '译文')

      if (originalKey && translatedKey) {
        return {
          original: String(item[originalKey]),
          translated: String(item[translatedKey]),
        }
      }
      return null
    })
    .filter((e): e is Omit<TranslationDicEntry, 'id' | 'createdAt'> =>
      e !== null && Boolean(e.original.trim()) && Boolean(e.translated.trim()),
    )
}

/**
 * 确保 DOM 真正稳定并准备好截图。
 *
 * 时序要点：调用方通常先 setState 切到截图态（如轮播 → 平铺网格），若立刻
 * 收集 `img`，等到的是即将被卸载的旧节点，新布局里的图根本没被等待（导出后
 * 仍是骨架/占位）。因此先等 React 提交 + 布局稳定，再收集并等待当前 DOM。
 *
 * 图片加载后再 `decode()`，并等 MediaImage 的 `data-status` 从 loading 变为
 * success（其 onLoad 后才把 img 从 opacity-0 切到可见），最后双帧收尾。
 */
export async function waitForRenderReady(container?: HTMLElement) {
  // 1. 让调用方的 setState 完成渲染（宏任务 + 双帧，覆盖布局与合成）
  await new Promise(resolve => setTimeout(resolve, 0))
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))

  // 2. 等待字体就绪（防止截图时排版塌陷）
  if (typeof document !== 'undefined' && 'fonts' in document) {
    await document.fonts.ready
  }

  // 3. 等待当前 DOM 中的图片加载并解码（用 addEventListener，避免覆盖 React 的 onLoad）
  const images = Array.from(container?.querySelectorAll('img') || document.images)
  await Promise.all(images.map(async (img) => {
    if (!img.complete) {
      await new Promise<void>((resolve) => {
        let settled = false
        const done = () => {
          if (settled)
            return
          settled = true
          resolve()
        }
        // 先挂监听再复查 complete：避免「检查后刚好加载完成、事件已错过」的竞态
        img.addEventListener('load', done, { once: true })
        img.addEventListener('error', done, { once: true })
        if (img.complete)
          done()
      })
    }
    if (typeof img.decode === 'function') {
      try {
        await img.decode()
      }
      catch {
        // 坏图 / CORS 解码失败不阻塞截图，MediaImage 会渲染错误占位
      }
    }
  }))

  // 4. MediaImage 在 onLoad 后才移除骨架屏；等 React 把状态提交到 DOM
  const statusImages = images.filter(img => img.dataset.status !== undefined)
  const deadline = Date.now() + 1000
  while (statusImages.some(img => img.dataset.status === 'loading') && Date.now() < deadline)
    await new Promise(resolve => requestAnimationFrame(resolve))

  // 5. MediaImage 用 300ms opacity 淡入；状态变 success 时动画才刚开始，
  //    此时截图会得到半透明图片。等淡入结束（或超时兜底）再放行。
  await new Promise(resolve => requestAnimationFrame(resolve))
  if (typeof getComputedStyle === 'function') {
    const fading = statusImages.filter((img) => {
      const opacity = Number.parseFloat(getComputedStyle(img).opacity)
      return Number.isFinite(opacity) && opacity < 1
    })
    await Promise.all(fading.map(img => new Promise<void>((resolve) => {
      let settled = false
      const done = () => {
        if (settled)
          return
        settled = true
        resolve()
      }
      img.addEventListener('transitionend', done, { once: true })
      setTimeout(done, 500) // transition-duration 300ms 的兜底
    })))
  }

  // 6. 双重 requestAnimationFrame：完成最终重绘与层叠合成
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve)
    })
  })
}
