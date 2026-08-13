import type { ModelMessage } from 'ai'
import type { VisionPromptPreset } from './prompts'

/**
 * AI 视觉描述 —— 消息构建纯函数（app/lib/vision/messages.ts）
 *
 * buildVisionMessages：预取好的图片（base64 data URI）+ 预设 + 可选推文上下文
 * → ModelMessage[]。服务端编排层（describeImages.ts）在 fetch 之后调用。
 * 图片 content part 走 AI SDK v7 FilePart（data 形态），openai-compatible 会
 * 转成 `data:<mime>;base64,<data>` 的 image_url。
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
  /** 附推文上下文（ocr 翻译的关键开关） */
  withContext?: boolean
  tweetText?: string
  quotedText?: string
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

function buildContextText(tweetText?: string, quotedText?: string): string {
  const lines: string[] = []
  if (tweetText)
    lines.push(`推文原文：\n${tweetText}`)
  if (quotedText)
    lines.push(`引用推文：\n${quotedText}`)
  lines.push('以上为推文上下文。若需要翻译，请据此将图片文字翻译为简体中文。')
  return lines.join('\n\n')
}

export function buildVisionMessages(args: BuildVisionMessagesArgs): ModelMessage[] {
  const { images, preset, withContext, tweetText, quotedText, customPrompt } = args

  const systemPrompt = preset.mode === 'custom'
    ? (customPrompt || preset.systemPrompt)
    : preset.systemPrompt

  const parts: UserContentPart[] = []
  for (const img of images) {
    const { mediaType, base64 } = parseDataUri(img.dataUri)
    parts.push({ type: 'file', data: { type: 'data', data: base64 }, mediaType })
  }
  if (withContext && (tweetText || quotedText)) {
    parts.push({ type: 'text', text: buildContextText(tweetText, quotedText) })
  }
  parts.push({ type: 'text', text: '请处理以上图片。' })

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: parts },
  ]
}
