import type { LanguageModel } from 'ai'
import type { IGPost } from '~/types'
import { generateText, Output } from 'ai'

/**
 * IG Caption 翻译参数
 */
export interface TranslateIGCaptionArgs {
  post: IGPost
  apiKey: string
  model: string
  provider: string
  modelInstance: LanguageModel
  thinkingLevel?: string
  translationGlossary?: string
}

/**
 * 翻译 Instagram 帖子 caption。
 *
 * 相比推文翻译，caption 是纯文本，不需要实体占位符保护。
 * 但如果 caption 中有 @mention / #hashtag，可后续扩展占位符机制。
 */
export async function translateIGCaption(args: TranslateIGCaptionArgs): Promise<string> {
  const { post, modelInstance, translationGlossary } = args

  const text = post.description
  if (!text)
    return ''

  const glossarySection = translationGlossary
    ? `\n## Glossary\nUse these preferred translations:\n${translationGlossary}\n`
    : ''

  const systemPrompt = `
You are an expert translator. Translate the following Instagram caption into **natural, fluent Simplified Chinese**, preserving the tone and style of the original.
${glossarySection}

Guidelines:
- Keep emoji and line breaks
- Translate @mentions but keep the @username format
- Keep hashtags as-is, but you may translate the text after the #
- Preserve any URLs exactly
- If the text is already Chinese, return it unchanged
`.trim()

  try {
    const result = await generateText({
      model: modelInstance,
      system: systemPrompt,
      prompt: text,
      temperature: 0.3,
      maxTokens: 1024,
      experimental_output: Output.text(),
    })

    return result.text?.trim() ?? ''
  }
  catch (error) {
    console.error('[IG Translation] Failed:', error)
    throw error
  }
}

/**
 * 检测 caption 是否为中文（跳过 AI 翻译）。
 */
export function isChinese(text: string): boolean {
  if (!text)
    return false
  // 中文字符占比 > 50% 视为中文
  const chineseChars = text.match(/[\u4E00-\u9FFF]/g)
  return chineseChars ? chineseChars.length / text.length > 0.5 : false
}
