import type { ModelMessage } from 'ai'
import type { VisionPromptPreset } from './prompts'

/**
 * AI 视觉描述 —— 消息构建纯函数（app/lib/vision/messages.ts）
 *
 * buildVisionMessages：预取好的图片（base64 data URI）+ 预设 + 可选推文上下文
 * → ModelMessage[]。服务端编排层（describeImages.ts）在 fetch 之后调用。
 * 图片 content part 走 AI SDK v7 FilePart（data 形态），openai-compatible 会
 * 转成 `data:<mime>;base64,<data>` 的 image_url。
 *
 * 上下文注入对齐翻译侧（AITranslation.ts）的「结构化上下文」：
 * - withContext 开关控制「推文上下文」区块：作者 / 发布时间 / 推文原文 / 引用推文 /
 *   实体参考（占位符 → 类型/内容，hashtag/mention/URL 是图中名称/链接的线索）。
 * - 官方 alt 文本（media_alt，原作者的图片描述）与术语表（词典 + 自定义）**不受
 *   withContext 开关控制**：它们是图片自身的描述与用户知识库，始终注入——正是
 *   「仅看图片会对知识库以外内容瞎猜」的对应解药。
 * - 所有上下文区块都强调「仅供辅助理解，不得把上下文内容当作图片内容」。
 */

export interface VisionImageInput {
  /** 对应 tweet.mediaDetails 索引 */
  index: number
  /** base64 data URI，如 data:image/jpeg;base64,/9j/... */
  dataUri: string
}

export interface BuildVisionMessagesArgs {
  images: VisionImageInput[]
  preset: VisionPromptPreset
  /** 附推文上下文（作者/时间/原文/引用/实体参考；glossary 与 alt 不受此开关控制） */
  withContext?: boolean
  tweetText?: string
  quotedText?: string
  /** 作者 screen_name（@xxx） */
  authorName?: string
  /** 发布时间（created_at 原文） */
  createdAt?: string
  /** 实体参考文本（对齐翻译 generateEntityContext：占位符 → 类型/内容） */
  entityContext?: string
  /** mediaDetails index → 官方 alt 文本（原作者的图片描述，最强锚点） */
  mediaAltTexts?: Record<number, string>
  /** 术语表（词典 + 自定义，HIGH 优先级） */
  glossary?: string
  customPrompt?: string
}

type UserContentPart
  = | { type: 'file', data: { type: 'data', data: string }, mediaType: string }
    | { type: 'text', text: string }

function parseDataUri(dataUri: string): { mediaType: string, base64: string } {
  const m = /^data:([^;,]+);base64,(.+)$/s.exec(dataUri)
  if (!m) {
    throw new Error(`Invalid data URI (expected data:<mime>;base64,<data>): ${dataUri.slice(0, 48)}`)
  }
  return { mediaType: m[1]!, base64: m[2]! }
}

/** 推文上下文区块（withContext 开关控制；首行明确上下文 ≠ 图片内容） */
function buildContextText(args: {
  tweetText?: string
  quotedText?: string
  authorName?: string
  createdAt?: string
  entityContext?: string
}): string {
  const { tweetText, quotedText, authorName, createdAt, entityContext } = args
  const lines: string[] = []
  lines.push('推文上下文（仅供理解语境；切勿把上下文内容当作图片内容，只描述图中可见内容）：')
  if (authorName)
    lines.push(`- 作者：@${authorName}`)
  if (createdAt)
    lines.push(`- 发布时间：${createdAt}`)
  if (tweetText)
    lines.push(`- 推文原文：\n${tweetText}`)
  if (quotedText)
    lines.push(`- 引用推文：\n${quotedText}`)
  if (entityContext)
    lines.push(`- 推文实体参考（图中可能涉及名称/链接的线索）：\n${entityContext}`)
  return lines.join('\n')
}

/** 官方 alt 文本区块：mediaDetails index → 原作者对图片的描述（过滤空白条目） */
function buildAltTextSection(mediaAltTexts: Record<number, string>): string | null {
  const entries = Object.entries(mediaAltTexts)
    .filter(([, text]) => text.trim().length > 0)
    .sort(([a], [b]) => Number(a) - Number(b))
  if (entries.length === 0)
    return null
  const lines = entries.map(([index, text]) => `图 ${index}: ${text}`)
  return `图片官方 alt 文本（原作者对图片的描述，可参考；仍以图中可见内容为准）：\n${lines.join('\n')}`
}

/** 术语表区块（HIGH 优先级，对齐翻译侧 <Glossary> 形态） */
function buildGlossarySection(glossary: string): string | null {
  const trimmed = glossary.trim()
  if (!trimmed)
    return null
  return `<Glossary>\n(Priority Level: HIGH. 术语表中出现的名称，描述/翻译时必须使用给出的对应译名)\n${trimmed}\n</Glossary>`
}

export function buildVisionMessages(args: BuildVisionMessagesArgs): ModelMessage[] {
  const {
    images,
    preset,
    withContext,
    tweetText,
    quotedText,
    customPrompt,
    authorName,
    createdAt,
    entityContext,
    mediaAltTexts,
    glossary,
  } = args

  const systemPrompt = preset.mode === 'custom'
    ? (customPrompt || preset.systemPrompt)
    : preset.systemPrompt

  const parts: UserContentPart[] = []
  for (const img of images) {
    const { mediaType, base64 } = parseDataUri(img.dataUri)
    parts.push({ type: 'file', data: { type: 'data', data: base64 }, mediaType })
  }
  // 图片与 mediaDetails 索引的对应必须告诉模型，否则模型会自造 index
  // （describe 单图返回 index 1、ocr 把行号当 index），导致按图查找命中失败。
  parts.push({
    type: 'text',
    text: `图片索引映射（输出 JSON 时请为每张图片使用其对应 index，不要自编序号）：${images.map(img => img.index).join(', ')}。`,
  })
  const hasTweetContext = !!(tweetText || quotedText || authorName || createdAt || entityContext)
  if (withContext && hasTweetContext) {
    parts.push({
      type: 'text',
      text: buildContextText({ tweetText, quotedText, authorName, createdAt, entityContext }),
    })
  }
  const altSection = buildAltTextSection(mediaAltTexts ?? {})
  if (altSection)
    parts.push({ type: 'text', text: altSection })
  const glossarySection = buildGlossarySection(glossary ?? '')
  if (glossarySection)
    parts.push({ type: 'text', text: glossarySection })
  parts.push({ type: 'text', text: '请处理以上图片。' })

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: parts },
  ]
}
