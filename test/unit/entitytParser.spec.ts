import type { Entity } from '~/types'
import { describe, expect, it } from 'vitest'
import { applyAITranslations, restoreEntities, serializeForAI } from '~/lib/react-tweet/utils/entitytParser'

describe('entitytParser', () => {
  // AC-TRANS-001/002: serialize → restore 占位符往返（自 verify/translation.verifier 并入）
  it('AC-TRANS-001/002: serializes placeholders and restores translation entities', () => {
    const originalEntities: Entity[] = [
      { type: 'text', text: 'Hello ', index: 0 },
      {
        type: 'mention',
        text: '@alice',
        id_str: '1',
        name: 'Alice',
        screen_name: 'alice',
        href: 'https://twitter.com/alice',
        index: 1,
      },
      { type: 'text', text: ' see ', index: 2 },
      { type: 'separator', text: ' | ', mediaIndex: 0, index: 30000 } as any,
      { type: 'media_alt', text: 'A CAT', index: 20000 } as any,
    ]

    const { maskedText, entityMap } = serializeForAI(originalEntities)

    expect(maskedText).toContain('<<__MENTION_0__>>')
    expect(maskedText).toContain('<<__SEPARATOR_1__>>')
    expect(entityMap.size).toBe(2)
    expect(entityMap.has('<<__MENTION_0__>>')).toBe(true)
    expect(entityMap.has('<<__SEPARATOR_1__>>')).toBe(true)

    const translatedText = '你好 <<__MENTION_0__>> 看 <<__SEPARATOR_1__>> 一只猫'
    const restored = restoreEntities(translatedText, entityMap, originalEntities)

    expect(restored).toEqual([
      { type: 'text', text: 'Hello ', index: 0, aiTranslation: '你好 ' },
      { ...originalEntities[1]!, index: 1 },
      { type: 'text', text: ' see ', index: 2, aiTranslation: ' 看 ' },
      { type: 'media_alt', text: 'A CAT', aiTranslation: ' 一只猫', index: 20000 },
    ])
  })

  // AC-TRANS-003: 纯文本不产生占位符，还原后 aiTranslation = 译文（自 verify/translation.verifier 并入）
  it('AC-TRANS-003: text-only entities pass through without placeholders', () => {
    const originalEntities: Entity[] = [
      { type: 'text', text: '今日の天気はいいですね', index: 0 },
    ]

    const { maskedText, entityMap } = serializeForAI(originalEntities)
    expect(maskedText).toBe('今日の天気はいいですね')
    expect(entityMap.size).toBe(0)

    const restored = restoreEntities('今天天气很好', entityMap, originalEntities)
    expect(restored[0]).toMatchObject({
      type: 'text',
      text: '今日の天気はいいですね',
      aiTranslation: '今天天气很好',
    })
  })

  // AC-TRANS-004: URL 实体被占位符保护，还原后原样保留（自 verify/translation.verifier 并入）
  it('AC-TRANS-004: URL entities are protected and restored unchanged', () => {
    const originalEntities: Entity[] = [
      {
        type: 'url',
        text: 'https://example.com',
        href: 'https://example.com',
        display_url: 'example.com',
        index: 0,
      } as Entity,
    ]

    const { maskedText, entityMap } = serializeForAI(originalEntities)
    expect(maskedText).toBe('<<__URL_0__>>')
    expect(entityMap.size).toBe(1)

    const restored = restoreEntities('<<__URL_0__>>', entityMap, originalEntities)
    expect(restored[0]).toMatchObject({
      type: 'url',
      text: 'https://example.com',
      href: 'https://example.com',
      index: 0,
    })
    expect(restored[0]).not.toHaveProperty('aiTranslation')
  })

  it('applyAITranslations keeps the full stream when the AI result is not index-aligned (no fragment loss)', () => {
    const base: Entity[] = [
      { type: 'hashtag', text: '#めるサマー反田', index: 0, href: 'https://twitter.com/hashtag/x' } as any,
      { type: 'text', text: ' で渡瀬の名前が出たと聞き...嬉しいねᕕ😄ᕗ', index: 1 },
    ]
    const { entityMap } = serializeForAI(base)
    // AI 把占位符移到句中，restoreEntities 会产生 base 没有的 index（30000）
    const ai = restoreEntities('听说在 <<__HASHTAG_0__>> 里出现了渡濑的名字…开心捏', entityMap, base)

    expect(ai.length).toBe(3)
    const merged = applyAITranslations(base, ai)

    // 返回翻译流本身，不丢任何片段
    expect(merged).toEqual(ai)
    expect(merged.some(e => e.aiTranslation === '听说在 ')).toBe(true)
    expect(merged.some(e => e.aiTranslation === ' 里出现了渡濑的名字…开心捏')).toBe(true)
  })

  it('applyAITranslations merges index-aligned AI results as before', () => {
    const base: Entity[] = [
      { type: 'text', text: 'hello', index: 0 },
    ]
    const ai: Entity[] = [
      { type: 'text', text: 'hello', index: 0, aiTranslation: '你好' },
    ]

    expect(applyAITranslations(base, ai)).toEqual([
      { ...base[0]!, aiTranslation: '你好' },
    ])
  })
})
