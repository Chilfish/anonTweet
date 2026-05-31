import type { LanguageModel, ModelMessage } from 'ai'
import type { IGPost } from '~/types'
import { generateText, Output } from 'ai'

/**
 * IG Caption 翻译参数（精简版 — 只传真正需要的）
 */
export interface TranslateIGCaptionArgs {
  post: IGPost
  modelInstance: LanguageModel
  translationGlossary?: string
  thinkingLevel?: string
}

/**
 * 翻译 Instagram 帖子 caption。
 *
 * IG 与推文的区别：
 * - 纯文本，无实体占位符保护（media 在 UI 层渲染）
 * - 短格式内容（标题党、诗意、日常碎碎念）
 * - @mention / #hashtag 比推文更随意
 * - 大量换行排版
 */
export async function translateIGCaption(args: TranslateIGCaptionArgs): Promise<string> {
  const { post, modelInstance, translationGlossary } = args

  const text = post.description
  if (!text)
    return ''

  // 检测中文 — 如果 50%+ 是中文，跳过翻译（返回空，由调用方保持原文显示）
  if (isChinese(text))
    return ''

  const glossarySection = translationGlossary
    ? `\n<Glossary>\n(Priority Level: HIGH. Use these exact translations.)\n${translationGlossary}\n</Glossary>\n`
    : ''

  const systemPrompt = `# Role Definition
You are a professional Cross-Cultural Localization Expert specializing in Japanese/Korean/English to Simplified Chinese translation for social media.
You understand the nuances of Instagram captions: punchy one-liners, poetic micro-blogging, casual daily updates, and commercial promo copy.

# Core Mission
Translate the Instagram caption into **natural, fluent Simplified Chinese**, preserving the original tone, emotional weight, and stylistic intent.

# 1. Tone & Style Adaptation
Analyze the caption's vibe and adapt accordingly:
- **Casual / Daily**: Colloquial, warm, like a friend's 朋友圈. Use natural Chinese expressions (不是, 了啦, 呀 etc. where appropriate).
- **Poetic / Aesthetic**: Keep the lyrical flow. Translate metaphors naturally — don't over-literalize.
- **Commercial / Promo**: Professional, punchy, marketing-native Chinese. Clear call-to-action.
- **Humorous / Meme**: Prioritize the laugh over literal accuracy. Chinese internet slang OK if it fits.
- **Short-form / One-liner**: Keep it equally short. Don't pad.

# 2. Element Handling
- **Emoji**: Keep ALL emoji exactly as-is. Do NOT remove, replace, or reorder them. Emoji carry emotional weight.
- **Line Breaks**: Preserve the original line break structure. IG captions use line breaks heavily for visual rhythm — respect that.
- **@mentions**: Keep @username format intact. Translate surrounding text naturally.
- **#hashtags**: Keep #hashtag format. You MAY translate the text part of the tag (e.g., #東京散歩 → #东京散步), but only if the translation is natural and commonly used. When in doubt, keep original.
- **URLs**: Preserve EXACTLY as-is. Never modify URLs.

# 3. Conservative Naming
- **People names**: NEVER translate personal names. Keep original.
- **Place names**: Use established Chinese names if they exist (東京→东京, 京都→京都). If unsure, keep original.
- **Brand names**: Keep original unless there's a widely recognized Chinese equivalent.
- **Song/Work titles**: Translate only if a widely accepted Simplified Chinese name exists. If unsure, keep original.

# 4. Quality Standards
- Read the translation aloud mentally — it should sound like natural Chinese, not translationese.
- No explanatory additions. Translate what's there, not what's implied.
- If the source is already mostly Chinese, return it unchanged.`

  const userContent = `# Translation Request

${glossarySection}

**Author**: @${post.username}${post.fullname ? ` (${post.fullname})` : ''}
**Post Type**: ${post.type}${post.created_at ? `\n**Posted**: ${post.created_at}` : ''}

# Source Caption
${text}`

  try {
    const messages: ModelMessage[] = [
      { role: 'user', content: userContent },
    ]

    let result = await generateText({
      model: modelInstance,
      system: systemPrompt,
      messages,
      temperature: 0.5,
      experimental_output: Output.text(),
    })

    let translated = result.text?.trim() ?? ''

    // 简单重试：如果结果为空或是纯空白，再试一次
    if (!translated || translated === text) {
      result = await generateText({
        model: modelInstance,
        system: systemPrompt,
        messages: [
          ...messages,
          {
            role: 'user',
            content: 'Your last output was empty or identical to the source. Please translate the caption into Chinese.',
          },
        ],
        temperature: 0.6,
        experimental_output: Output.text(),
      })
      translated = result.text?.trim() ?? ''
    }

    return translated
  }
  catch (error) {
    console.error('[IG Translation] Failed:', error)
    throw error
  }
}

/**
 * 检测文本是否主要为中文（用于跳过翻译）。
 */
export function isChinese(text: string): boolean {
  if (!text)
    return false
  const chineseChars = text.match(/[\u4E00-\u9FFF]/g)
  return chineseChars ? chineseChars.length / text.length > 0.5 : false
}
