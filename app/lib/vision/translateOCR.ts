import type { LanguageModel } from 'ai'
import type { ThinkingLevel } from '~/lib/stores/appConfig'
import { generateText } from 'ai'
import { z } from 'zod'
import { isChinese } from '~/lib/translateIGCaption'
import { VisionParseError } from './parse'

/**
 * AI 视觉描述 —— OCR 结果翻译（app/lib/vision/translateOCR.ts）
 *
 * 与描述/OCR 生成解耦（用户反馈：不要「OCR+翻译」合在一个模型调用里——OCR 是纯提取，
 * 翻译交给翻译模型并附推文上下文）。translateVisionOCR 将多图 OCR 原文批量翻译为简体中文。
 *
 * 注意：翻译步复用翻译侧模型（DeepSeek 等 chat 模型不支持结构化输出 responseFormat），
 * 因此走纯文本输出 + 宽容解析（keyed-object / 裸数组 / code fence 均容忍），而非 Output.object。
 */

export interface TranslateVisionOCRItem {
  index: number
  originalText: string
}

export interface TranslateVisionOCRArgs {
  items: TranslateVisionOCRItem[]
  /** 推文上下文（翻译用，帮助理解语境） */
  tweetText?: string
  modelInstance: LanguageModel
  thinkingLevel?: ThinkingLevel
  translationGlossary?: string
}

/** 首选形态：{ translations: [{ index, translatedText }] }（容忍多余键，多余键被剥离） */
const itemSchema = z.object({
  index: z.number(),
  translatedText: z.string(),
})
const ocrTranslationSchema = z.object({
  translations: z.array(itemSchema),
})

function toTranslationItem(item: unknown): { index: number, translatedText: string } | null {
  const parsed = itemSchema.safeParse(item)
  return parsed.success ? parsed.data : null
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** 形态 2：{ "0": "译文", "1": "译文" } —— key 为图片 index（无结构化输出模型的常见形态） */
function parseKeyedTranslations(
  json: Record<string, unknown>,
): Array<{ index: number, translatedText: string }> | null {
  const entries = Object.entries(json)
  if (entries.length === 0)
    return null
  const out: Array<{ index: number, translatedText: string }> = []
  for (const [key, value] of entries) {
    if (!/^\d+$/.test(key) || typeof value !== 'string')
      return null
    out.push({ index: Number(key), translatedText: value })
  }
  return out.sort((a, b) => a.index - b.index)
}

/**
 * 宽容解析 OCR 翻译结果：容忍三种形态——
 * 1. { translations: [{ index, translatedText }] }（首选）
 * 2. { "0": "译文" } keyed-object（index 作字符串 key）
 * 3. 裸数组 [{ index, translatedText }]
 * 全部失败才抛错（DeepSeek 等模型曾返回形态 2 导致 Output.object 严格校验失败）。
 */
export function parseOcrTranslation(
  json: unknown,
): Array<{ index: number, translatedText: string }> {
  const strict = ocrTranslationSchema.safeParse(json)
  if (strict.success)
    return strict.data.translations

  if (isPlainObject(json)) {
    const keyed = parseKeyedTranslations(json)
    if (keyed)
      return keyed
  }

  if (Array.isArray(json)) {
    const arr = json.map(toTranslationItem)
    if (arr.length > 0 && arr.every(Boolean)) {
      return arr as Array<{ index: number, translatedText: string }>
    }
  }

  throw new VisionParseError(
    `Vision OCR translation schema validation failed: ${typeof json === 'string' ? json.slice(0, 120) : JSON.stringify(json)?.slice(0, 120)}`,
  )
}

/** 从模型文本中提取 JSON：容忍首尾说明文字 / markdown code fence / 前后缀 */
function extractJson(text: string): unknown {
  const trimmed = text.trim()
  const candidates: string[] = []
  try {
    return JSON.parse(trimmed)
  }
  catch {
    // fall through
  }
  const fenced = trimmed.match(/```(?:json)?([\s\S]*?)```/)
  if (fenced?.[1])
    candidates.push(fenced[1].trim())
  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')
  if (firstBrace >= 0 && lastBrace > firstBrace)
    candidates.push(trimmed.slice(firstBrace, lastBrace + 1))
  const firstBracket = trimmed.indexOf('[')
  const lastBracket = trimmed.lastIndexOf(']')
  if (firstBracket >= 0 && lastBracket > firstBracket)
    candidates.push(trimmed.slice(firstBracket, lastBracket + 1))
  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate)
    }
    catch {
      // try next
    }
  }
  throw new VisionParseError(`Vision OCR translation: invalid JSON from model: ${trimmed.slice(0, 200)}`)
}

const SYSTEM_PROMPT = `你是推文图片 OCR 文字的翻译助手。将每张图片的 OCR 原文（originalText）翻译为自然、通顺的简体中文：
保持原文换行结构，@mention / #hashtag / URL 原样保留，人名、地名按常见中文译法。若提供了推文上下文，结合语境理解。
每张图片只输出一个对象。index 必须使用用户消息中给出的图片索引，不得自编序号。
输出严格 JSON，不要输出任何多余文字或 markdown 代码块标记，格式：
{"translations": [{"index": 0, "translatedText": "译文"}]}`

/**
 * 批量翻译 OCR 结果：已含中文的条目直接回填原文（不送模型），其余走文本输出翻译。
 * 返回与 items 同序、同 index 的翻译数组。
 */
export async function translateVisionOCR(
  args: TranslateVisionOCRArgs,
): Promise<Array<{ index: number, translatedText: string }>> {
  const { items, tweetText, modelInstance, translationGlossary } = args
  if (items.length === 0)
    return []

  const result = items.map(item => ({
    index: item.index,
    translatedText: item.originalText,
  }))
  const toTranslate = items.filter(item => !isChinese(item.originalText))
  if (toTranslate.length === 0)
    return result

  const glossarySection = translationGlossary
    ? `\n<Glossary>\n(Priority Level: HIGH. Use these exact translations.)\n${translationGlossary}\n</Glossary>\n`
    : ''
  const contextSection = tweetText ? `\n# 推文上下文\n${tweetText}\n` : ''

  const userContent = `# 翻译请求
${glossarySection}
${contextSection}
# OCR 原文（逐图）
${toTranslate.map(item => `${item.index}: ${item.originalText}`).join('\n')}`

  const response = await generateText({
    model: modelInstance,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
    temperature: 0.5,
  })

  const parsed = parseOcrTranslation(extractJson(response.text))
  const byIndex = new Map(parsed.map(t => [t.index, t.translatedText]))
  return result.map(item => ({
    index: item.index,
    translatedText: byIndex.get(item.index) ?? item.translatedText,
  }))
}
