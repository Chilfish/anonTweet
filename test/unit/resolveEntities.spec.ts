import type { Entity } from '~/types'
import { describe, expect, it } from 'vitest'
import {
  deriveManualTranslation,
  mergeEntityTranslationsByIndex,
  resolveAIEntitiesForDisplay,
  shouldRenderTranslatedEntitiesDirectly,
} from '~/lib/translation/resolveEntities'

describe('resolveEntities', () => {
  it('merges overlay-style translations by index', () => {
    const base: Entity[] = [
      { type: 'hashtag', text: '#A', index: 0, href: 'h' } as any,
      { type: 'text', text: 'x', index: 1 },
    ]
    const overlay: Entity[] = [
      { type: 'hashtag', text: '#A', index: 0, translation: '#啊' } as any,
      { type: 'text', text: 'x', index: 1, translation: 'y' },
    ]

    expect(mergeEntityTranslationsByIndex(base, overlay)).toEqual([
      { ...base[0]!, translation: '#啊' },
      { ...base[1]!, translation: 'y' },
    ])
  })

  it('detects stream-style translations (length mismatch)', () => {
    const base: Entity[] = [
      { type: 'text', text: 'x', index: 0 },
    ]
    const stream: Entity[] = [
      { type: 'text', text: 'x', index: 0, translation: 'y' },
      { type: 'hashtag', text: '#A', index: 1, href: 'h' } as any,
    ]

    expect(shouldRenderTranslatedEntitiesDirectly(base, stream)).toBe(true)
    expect(resolveAIEntitiesForDisplay(base, stream)).toBe(stream)
  })

  it('detects stream-style translations (index mismatch)', () => {
    const base: Entity[] = [
      { type: 'text', text: 'x', index: 0 },
      { type: 'text', text: 'z', index: 1 },
    ]
    const stream: Entity[] = [
      { type: 'text', text: 'x', index: 999, translation: 'y' },
      { type: 'text', text: 'z', index: 1000, translation: 'w' },
    ]

    expect(shouldRenderTranslatedEntitiesDirectly(base, stream)).toBe(true)
    expect(resolveAIEntitiesForDisplay(base, stream)).toBe(stream)
  })

  it('resolves overlay-style AI results by merging', () => {
    const base: Entity[] = [
      { type: 'hashtag', text: '#A', index: 0, href: 'h' } as any,
      { type: 'text', text: 'x', index: 1 },
    ]
    const overlay: Entity[] = [
      { type: 'hashtag', text: '#A', index: 0 } as any,
      { type: 'text', text: 'x', index: 1, aiTranslation: 'y' },
    ]

    expect(shouldRenderTranslatedEntitiesDirectly(base, overlay)).toBe(false)
    expect(resolveAIEntitiesForDisplay(base, overlay)).toEqual([
      base[0]!,
      { ...base[1]!, aiTranslation: 'y' },
    ])
  })

  it('keeps the prepend entity (index -1) at the front when merging manual translations', () => {
    const base: Entity[] = [
      { type: 'text', text: 'hello', index: 0 },
      { type: 'text', text: 'world', index: 1 },
    ]
    const overlay: Entity[] = [
      { type: 'text', text: '（补充）', index: -1, translation: '（补充）' },
      { type: 'text', text: 'hello', index: 0, translation: '你好' },
      { type: 'text', text: 'world', index: 1, translation: '世界' },
    ]

    expect(mergeEntityTranslationsByIndex(base, overlay)).toEqual([
      { type: 'text', text: '（补充）', index: -1, translation: '（补充）' },
      { ...base[0]!, translation: '你好' },
      { ...base[1]!, translation: '世界' },
    ])
  })

  it('drops extra entities that carry no translation content', () => {
    const base: Entity[] = [{ type: 'text', text: 'x', index: 0 }]
    const overlay: Entity[] = [
      { type: 'text', text: 'x', index: 0, translation: 'y' },
      { type: 'text', text: 'stray', index: -1 },
    ]

    expect(mergeEntityTranslationsByIndex(base, overlay)).toEqual([
      { ...base[0]!, translation: 'y' },
    ])
  })
})

// ── AC-RESOLVER-001 ────────────────────────────────────────────────
// 三处选择链收敛为单一纯函数 deriveManualTranslation：
// manual(按 index，命中即胜出) > 实体内联 aiTranslation > legacy autoTranslationEntities > 原文。
describe('AC-RESOLVER-001 deriveManualTranslation selection chain', () => {
  const base: Entity[] = [
    { type: 'text', text: 'hello', index: 0 },
    { type: 'media_alt', text: 'alt 0', index: 1 },
    { type: 'hashtag', text: '#A', index: 2, href: 'h' } as Entity,
    { type: 'text', text: 'world', index: 3 },
  ]

  it('manual match wins over inline aiTranslation and legacy', () => {
    const result = deriveManualTranslation(base, {
      manual: [{ type: 'text', text: 'hello', index: 0, translation: '你好' }],
      legacyAI: [{ type: 'text', text: 'hello', index: 0, translation: '(ai)' }],
    })
    expect(result[0]!.translation).toBe('你好')
    // 未命中索引的实体保持原文（无 translation 字段）
    expect(result[3]).toEqual(base[3])
  })

  it('manual empty-string match still wins (presence语义，用户清空覆盖不回落 AI)', () => {
    const aiBase: Entity[] = [{ type: 'text', text: 'x', index: 0, aiTranslation: 'AI 译' }]
    const result = deriveManualTranslation(aiBase, {
      manual: [{ type: 'text', text: 'x', index: 0, translation: '' }],
    })
    expect(result[0]).toEqual({ ...aiBase[0]!, translation: '' })
  })

  it('falls back to inline aiTranslation when no manual match', () => {
    const aiBase: Entity[] = [{ type: 'text', text: 'x', index: 0, aiTranslation: 'AI 译' }]
    const result = deriveManualTranslation(aiBase, {
      manual: [{ type: 'text', text: 'other', index: 9, translation: '其他' }],
    })
    expect(result[0]!.translation).toBe('AI 译')
  })

  it('falls back to legacy autoTranslationEntities (aiTranslation || translation || text)', () => {
    const legacyBase: Entity[] = [{ type: 'text', text: 'x', index: 0 }]
    const result = deriveManualTranslation(legacyBase, {
      legacyAI: [
        { type: 'text', text: 'x', index: 0, aiTranslation: '旧译' },
      ],
    })
    expect(result[0]!.translation).toBe('旧译')

    const textOnly = deriveManualTranslation(legacyBase, {
      legacyAI: [{ type: 'text', text: '原文兜底', index: 0 }],
    })
    expect(textOnly[0]!.translation).toBe('原文兜底')
  })

  it('keeps original entity untouched when nothing matches (no mutation, no translation field)', () => {
    const clone = structuredClone(base)
    const result = deriveManualTranslation(base, {})
    expect(result).toEqual(base)
    expect(base).toEqual(clone)
    expect(result.every(e => e.translation === undefined)).toBe(true)
  })

  it('opts.types filters which entities are computed (alt editor only processes media_alt)', () => {
    const withAi = base.map((e, i) => i === 1 ? { ...e, aiTranslation: '图译' } : e)
    const result = deriveManualTranslation(withAi, {}, { types: ['media_alt'] })
    // media_alt (index 1) 被计算
    expect(result[1]!.translation).toBe('图译')
    // 其他类型原样返回（不带 translation）
    expect(result[0]).toEqual(withAi[0])
    expect(result[2]).toEqual(withAi[2])
  })

  it('matches mergeEntityTranslationsByIndex manual-overlay semantics (view layer consistency)', () => {
    // 显示层 manual 覆盖路径经 mergeEntityTranslationsByIndex —— 同一 manual 输入下
    // deriveManualTranslation 与 view 层对同一索引取到同一文本
    const manual: Entity[] = [
      { type: 'text', text: 'hello', index: 0, translation: '你好' },
      { type: 'text', text: 'world', index: 3, translation: '世界' },
    ]
    const derived = deriveManualTranslation(base, { manual })
    const viewMerged = mergeEntityTranslationsByIndex(base, manual)

    for (const d of derived) {
      const v = viewMerged.find(e => e.index === d.index)
      expect((d.translation ?? '') === (v?.translation ?? '')).toBe(true)
    }
    expect(viewMerged[0]!.translation).toBe('你好')
  })
})
