import type { EnrichedTweet, Entity } from '~/types'
import { describe, expect, it } from 'vitest'
import { generateMarkdownFromTweets, generateText } from '~/lib/markdown'
import { materializeTweetWithManualTranslations } from '~/lib/translation/materialize'

function makeTweet(entities: Entity[]): EnrichedTweet {
  return {
    id_str: '1',
    url: 'u',
    created_at: '2024-01-01T00:00:00.000Z',
    text: 'hello',
    user: {
      id_str: 'u1',
      name: 'n',
      screen_name: 's',
      is_blue_verified: false,
      profile_image_shape: 'Circle',
      profile_image_url_https: '',
    } as any,
    entities,
  } as any
}

describe('markdown export', () => {
  it('includes the prepend entity (index -1) in translated text but not in the original', () => {
    const original: Entity[] = [{ type: 'text', text: 'hello', index: 0 }]
    const manual: Entity[] = [
      { type: 'text', text: '（补充）', index: -1, translation: '（补充）' },
      { type: 'text', text: 'hello', index: 0, translation: '你好' },
    ]
    const tweet = materializeTweetWithManualTranslations(makeTweet(original), manual)

    // 复制正文（译文）包含句首补充
    const text = generateText(tweet)
    expect(text).toContain('（补充）')
    expect(text).toContain('你好')

    // Markdown：原文部分不含句首补充，译文部分包含
    const markdown = generateMarkdownFromTweets([tweet])
    const [originalSection, translationSection] = markdown.split('**Translation:**')
    expect(originalSection).not.toContain('（补充）')
    expect(originalSection).toContain('hello')
    expect(translationSection).toContain('（补充）你好')
  })
})
