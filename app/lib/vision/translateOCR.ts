import type { LanguageModel } from 'ai'
import type { ThinkingLevel } from '~/lib/stores/appConfig'
import { generateText, Output, zodSchema } from 'ai'
import { z } from 'zod'
import { isChinese } from '~/lib/translateIGCaption'
import { VisionParseError } from './parse'

/**
 * AI 视觉描述 —— OCR 结果翻译（app/lib/vision/translateOCR.ts）
 *
 * 与描述/OCR 生成解耦（用户反馈：不要「OCR+翻译」合在一个模型调用里——OCR 是纯提取，
 * 翻译交给翻译模型并附推文上下文）。translateVisionOCR 将多图 OCR 原文批量翻译为简体中文。
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

export const ocrTranslationSchema = z.object({
  translations: z.array(z.object({
    index: z.number(),
    translatedText: z.string(),
  }).strict()),
}).strict()

export function parseOcrTranslation(
  json: unknown,
): Array<{ index: number, translatedText: string }> {
  const parsed = ocrTranslationSchema.safeParse(json)
  if (!parsed.success) {
    throw new VisionParseError(
      `Vision OCR translation schema validation failed: ${parsed.error.message}`,
    )
  }
  return parsed.data.translations
}

const SYSTEM_PROMPT = `你是推文图片 OCR 文字的翻译助手。将每张图片的 OCR 原文（originalText）翻译为自然、通顺的简体中文：
保持原文换行结构，@mention / #hashtag / URL 原样保留，人名、地名按常见中文译法。若提供了推文上下文，结合语境理解。
每张图片只输出一个对象。index 必须使用用户消息中给出的图片索引，不得自编序号。输出严格 JSON。`

/**
 * 批量翻译 OCR 结果：已含中文的条目直接回填原文（不送模型），其余走结构化输出翻译。
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
    output: Output.object({
      schema: zodSchema(ocrTranslationSchema),
      name: 'ocr_translation',
      description: 'OCR text translations for image texts',
    }),
  })

  const parsed = parseOcrTranslation(response.output)
  const byIndex = new Map(parsed.map(t => [t.index, t.translatedText]))
  return result.map(item => ({
    index: item.index,
    translatedText: byIndex.get(item.index) ?? item.translatedText,
  }))
}
