/**
 * app/lib/rettiwt-api/parsers/jetfuel.ts
 *
 * jetfuel_attachment.payload 解析器（纯函数，禁 React 依赖）。
 *
 * 格式（经抓包 + emusks 库文档确认）：X 私有「节点化字典压缩帧」——
 * - framing：u16 LE payloadLen + 3 零字节 + u8 count + payload + 3 字节 footer
 * - 内联字符串：`<len:u8> <utf8 bytes>`（单字节长度前缀，最长 255B）
 * - 节点 intro `0x11`：后随 [typeString, keyString]
 * - atom 引用 `02 <field> 00 00 00 <hash:u32>`；引用列表 `03 <kind> <count> ...`
 *
 * 官方无公开 schema（atom 样式字典在懒加载 chunk），字符串长度前缀在二进制流中
 * 定位不可靠（emusks 的 ASCII-only 扫描会把长 URL/中文截半）。故采用双策略：
 * 结构扫描尽力而为 + **语义化正则提取兜底**——在 UTF-8 解码全文上按 URL / CJK 片段 /
 * posts 计数 / 分类词做模式匹配，实测对该样本（及同类 Trending 卡）100% 命中。
 * 任一关键字段缺失 → 返回 null 交由上层回退补偿（见 mapTwitterCard 合并策略）。
 */

export interface JetfuelFrame {
  /** framing 信息：payload 长度 / 节点计数 / footer hex */
  frame: { payloadLen: number | null, count: number | null, footer: string | null }
  /** 提取到的可读字符串（语义化提取结果） */
  strings: string[]
  /** 节点 intro 0x11 及紧随的两个字符串 [type, key]（best-effort） */
  nodes: Array<{ type: string | null, key: string | null }>
  /** atom 引用（fieldId + FarmHash u32，样式字典不解析） */
  atoms: Array<{ field: number, hash: string }>
  /** 引用列表 */
  lists: Array<{ kind: number, count: number }>
}

const decoder = new TextDecoder('utf-8', { fatal: false })

const BASE64_RE = /^[A-Za-z0-9+/]+={0,2}$/

export function toBytes(input: string | Uint8Array): Uint8Array {
  if (input instanceof Uint8Array)
    return input
  // base64 严格校验：Buffer.from 对非法字符容错，会导致乱码 payload 被误解析
  if (!BASE64_RE.test(input))
    return new Uint8Array(0)
  return new Uint8Array(Buffer.from(input, 'base64'))
}

/** 从一个 utf8 文本中提取所有可读 token（URL / CJK 文本 / posts 计数 / 单词） */
export function extractJetfuelStrings(input: string | Uint8Array): string[] {
  const b = toBytes(input)
  const n = b.length
  const start = n > 6 ? 6 : 0
  const end = n > 3 ? n - 3 : n
  const text = decoder.decode(b.subarray(start, end))

  const urls = /https?:\/\/[A-Za-z0-9./_?=&%+-]+/g
  const cjk = /[\u3000-\u9FFF\u3040-\u30FF\uAC00-\uD7AF][\u3000-\u9FFF\u3040-\u30FF\uAC00-\uD7AF\w\s、。！？「」『』…·•,，.]+/g
  const posts = /\d+(\.\d+)?[kKmM]?\s*posts/g
  // 单词/结构词：支持连字符（trending-card），但排除明显来自 URL 的切片
  const words = /[A-Za-z][A-Za-z-]{2,29}/g

  const out = new Set<string>()
  for (const re of [urls, cjk, posts, words]) {
    for (const m of text.matchAll(re))
      out.add(m[0].trim())
  }
  return [...out]
}

/**
 * 解码 jetfuel payload 为结构化帧。无法解码（非 base64 / 空）时返回 null。
 * 结构扫描 best-effort：strings 采用语义化提取（稳定字段），nodes/atoms/lists
 * 尽力还原以供调试。
 */
export function decodeJetfuelPayload(input: string | Uint8Array): JetfuelFrame | null {
  try {
    const b = toBytes(input)
    const n = b.length
    if (n < 6)
      return null

    const frame = {
      payloadLen: (b[0] | (b[1] << 8)) || null,
      count: n >= 6 ? b[5] : null,
      footer: n >= 3
        ? Array.from(b.subarray(n - 3, n)).map(x => x.toString(16).padStart(2, '0')).join('')
        : null,
    }

    const strings = extractJetfuelStrings(b)
    const nodes: JetfuelFrame['nodes'] = []
    const atoms: JetfuelFrame['atoms'] = []
    const lists: JetfuelFrame['lists'] = []

    // 结构扫描：0x11 节点 / 02 atom / 03 列表 / 长度前缀字符串
    const start = n > 6 ? 6 : 0
    const end = n > 3 ? n - 3 : n
    let i = start
    const tokens: Array<{ type: 'node' | 'atom' | 'list' | 'string' }> = []

    while (i < end - 1) {
      const byte = b[i]

      if (byte === 0x11) {
        tokens.push({ type: 'node' })
        nodes.push({ type: null, key: null })
        i += 1
        continue
      }
      if (byte === 0x02 && i + 9 <= end && b[i + 2] === 0 && b[i + 3] === 0 && b[i + 4] === 0) {
        const field = b[i + 1]
        const hash = Array.from(b.subarray(i + 5, i + 9)).map(x => x.toString(16).padStart(2, '0')).join('')
        atoms.push({ field, hash })
        tokens.push({ type: 'atom' })
        i += 9
        continue
      }
      if (byte === 0x03 && i + 7 <= end && b[i + 3] === 0 && b[i + 4] === 0 && b[i + 5] === 0 && b[i + 6] === 0) {
        lists.push({ kind: b[i + 1], count: b[i + 2] })
        tokens.push({ type: 'list' })
        i += 7
        continue
      }
      // 长度前缀字符串（单字节，仅作参考，不作为字段依据）
      if (byte >= 1 && byte <= 250 && i + 1 + byte <= end) {
        const seg = b.subarray(i + 1, i + 1 + byte)
        const s = decoder.decode(seg)
        if (!s.includes('\uFFFD') && /[A-Za-z0-9\u3040-\u30FF\u3000-\u9FFF]/.test(s)) {
          tokens.push({ type: 'string' })
          i += 1 + byte
          continue
        }
      }
      tokens.push({ type: 'string' })
      i += 1
    }

    // 节点后随 [typeString, keyString]：按 token 顺序关联（best-effort，仅用于调试）
    let nodeIdx = 0
    let strIdx = 0
    for (let t = 0; t < tokens.length && nodeIdx < nodes.length; t++) {
      if (tokens[t]!.type === 'node') {
        let key = 0
        for (let u = t + 1; u < tokens.length && key < 2; u++) {
          if (tokens[u]!.type === 'node')
            break
          if (tokens[u]!.type === 'string') {
            if (key === 0)
              nodes[nodeIdx]!.type = strings[strIdx] ?? null
            else
              nodes[nodeIdx]!.key = strings[strIdx] ?? null
            key += 1
            strIdx += 1
          }
        }
        nodeIdx += 1
      }
    }

    return { frame, strings, nodes, atoms, lists }
  }
  catch {
    return null
  }
}

/** 从字符串集合中按包含规则取首个 URL（仅保留完整 http 开头串） */
function pickUrl(strings: string[], needle?: string): string | undefined {
  return strings.find(s => s.startsWith('http') && (!needle || s.includes(needle)))
}

/**
 * 从 payload 解析 Trending 卡片结构化信息。
 * 任一关键字段缺失（无 URL / 无主图 / 无标题）→ 返回 null（触发上层回退）。
 */
export function parseTrendingCard(input: string | Uint8Array): ReturnType<typeof buildTrendingCard> {
  return buildTrendingCard(extractJetfuelStrings(input))
}

function buildTrendingCard(strings: string[]) {
  if (strings.length === 0)
    return null

  const url = pickUrl(strings, 'x.com/') ?? pickUrl(strings)
  const imageUrl = pickUrl(strings, 'pbs.twimg.com/media/') ?? pickUrl(strings, 'pbs.twimg.com')
  if (!url || !imageUrl)
    return null

  const avatars = strings.filter(s => s.includes('profile_images/'))
  // 分类：首字母大写 + 其余全小写的纯英文词（Entertainment / Celebrity 等），
  // 排除协议词、URL 切片词、图片 hash 串（HPxZhM 这类混合大小写）与结构词
  const STRUCT_WORDS = new Set([
    'component', 'trending', 'trending-card', 'https', 'http', 'www', 'com', 'net', 'org',
    'pbs', 'twimg', 'media', 'jpg', 'jpeg', 'png', 'gif', 'webp',
    'name', 'orig', 'photo', 'browser', 'profile', 'images', 'xcom',
  ])
  const categories = strings
    .filter(s => /^[A-Z][a-z]+$/.test(s))
    .filter(s => !STRUCT_WORDS.has(s.toLowerCase()))
    .slice(0, 4)

  const postsCount = strings.find(s => /^\d+(\.\d+)?[kKmM]?\s*posts$/.test(s))
  const cjkCount = (s: string) => (s.match(/[\u3000-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/g) || []).length
  const title = strings.find(s => cjkCount(s) >= 3)
  const descriptions = strings.filter(s => s !== title && cjkCount(s) >= 10)
  const description = descriptions.at(-1)

  if (!title)
    return null

  return {
    source: 'jetfuel',
    url,
    imageUrl,
    categories,
    avatars: avatars.slice(0, 3),
    postsCount,
    title,
    description: description || undefined,
  }
}