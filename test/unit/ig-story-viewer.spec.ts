import { describe, expect, it } from 'vitest'
import {
  clampViewerIndex,
  stepViewerIndex,
  storySelectionReducer,
} from '~/lib/ig/storyViewer'

/**
 * test/unit/ig-story-viewer.spec.ts
 *
 * AC-IG-STORY-007：查看器导航与选择纯逻辑。
 *
 * 验收层是 node 环境 + `renderToString`（仓库无 DOM 测试环境），`IGStoryViewer` /
 * `IGStoryGrid` 只负责渲染与事件接线；环形步进、序号夹取、选择集合的不可变更新
 * 收敛在 `storyViewer.ts`，故逻辑真源在此断言。
 */

describe('AC-IG-STORY-007: story viewer navigation and selection logic', () => {
  it('AC-IG-STORY-007: stepViewerIndex wraps around at both ends', () => {
    expect(stepViewerIndex(0, 3, -1)).toBe(2)
    expect(stepViewerIndex(2, 3, 1)).toBe(0)
    expect(stepViewerIndex(1, 3, -1)).toBe(0)
    expect(stepViewerIndex(1, 3, 1)).toBe(2)
  })

  it('AC-IG-STORY-007: stepViewerIndex stays at 0 when there is no neighbour', () => {
    expect(stepViewerIndex(0, 1, 1)).toBe(0)
    expect(stepViewerIndex(0, 1, -1)).toBe(0)
    expect(stepViewerIndex(0, 0, 1)).toBe(0)
  })

  it('AC-IG-STORY-007: clampViewerIndex clamps into range and tolerates empty lists', () => {
    expect(clampViewerIndex(4, 3)).toBe(2)
    expect(clampViewerIndex(-1, 3)).toBe(0)
    expect(clampViewerIndex(2, 3)).toBe(2)
    expect(clampViewerIndex(0, 0)).toBe(0)
  })

  it('AC-IG-STORY-007: selection reducer toggles, selects all and clears', () => {
    const empty = new Set<string>()

    const one = storySelectionReducer(empty, { type: 'toggle', id: 'a' })
    expect([...one]).toEqual(['a'])

    const back = storySelectionReducer(one, { type: 'toggle', id: 'a' })
    expect([...back]).toEqual([])

    const all = storySelectionReducer(back, { type: 'set', ids: ['a', 'b', 'c'] })
    expect([...all].sort()).toEqual(['a', 'b', 'c'])

    expect([...storySelectionReducer(all, { type: 'clear' })]).toEqual([])
  })

  it('AC-IG-STORY-007: selection reducer never mutates the incoming state', () => {
    const state = new Set(['a'])

    const next = storySelectionReducer(state, { type: 'toggle', id: 'b' })
    expect(next).not.toBe(state)
    expect([...state]).toEqual(['a'])
    expect([...next].sort()).toEqual(['a', 'b'])

    const cleared = storySelectionReducer(state, { type: 'clear' })
    expect(cleared).not.toBe(state)
    expect([...state]).toEqual(['a'])
  })
})
