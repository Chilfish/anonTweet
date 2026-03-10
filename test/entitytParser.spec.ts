import type { Entity } from '~/types'
import { describe, expect, it } from 'vitest'
import { restoreEntities, serializeForAI } from '~/lib/react-tweet/utils/entitytParser'

describe('entitytParser', () => {
  it('serializes placeholders and restores translation entities', () => {
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
      { type: 'text', text: 'Hello ', index: 0, translation: '你好 ' },
      { ...originalEntities[1]!, index: 1 },
      { type: 'text', text: ' see ', index: 2, translation: ' 看 ' },
      { type: 'media_alt', text: 'A CAT', translation: ' 一只猫', index: 20000 },
    ])
  })
})
