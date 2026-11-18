/**
 * test/unit/visited-store.spec.ts
 *
 * AC-HOME-001：首页「最近查看」的 IndexedDB 水合必须一定收尾。
 * 无论读写成功、失败还是 IndexedDB 不可用，`_hasHydrated` 都要变 true，
 * 否则首页会停在骨架态。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useVisitedStore } from '~/lib/stores/visited'

const mocks = vi.hoisted(() => ({
  loadRecentVisited: vi.fn(),
}))

vi.mock('~/lib/storage/visited', () => ({
  clearVisitedStore: vi.fn(),
  loadRecentVisited: mocks.loadRecentVisited,
  migrateLegacyVisited: vi.fn(async () => {}),
  recordVisited: vi.fn(),
  removeVisitedRecord: vi.fn(),
}))

const item = {
  type: 'tweet' as const,
  id: '2032649981690261684',
  title: 'Chilfish',
  ts: 1_700_000_000_000,
}

describe('AC-HOME-001: visited store hydration always settles', () => {
  beforeEach(() => {
    useVisitedStore.setState({ _hasHydrated: false, items: [] })
    // node 环境没有 indexedDB，stub 一个非空对象以通过可用性判断
    vi.stubGlobal('indexedDB', {})
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('hydrates records and flips the flag', async () => {
    mocks.loadRecentVisited.mockResolvedValue([item])

    await useVisitedStore.getState().hydrate()

    expect(useVisitedStore.getState().items).toEqual([item])
    expect(useVisitedStore.getState()._hasHydrated).toBe(true)
  })

  it('still flips the flag when IndexedDB reads throw', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    mocks.loadRecentVisited.mockRejectedValue(new Error('IndexedDB blocked'))

    await useVisitedStore.getState().hydrate()

    expect(error).toHaveBeenCalled()
    expect(useVisitedStore.getState().items).toEqual([])
    expect(useVisitedStore.getState()._hasHydrated).toBe(true)
  })

  it('flips the flag immediately without a storage backend', async () => {
    vi.unstubAllGlobals()

    await useVisitedStore.getState().hydrate()

    expect(mocks.loadRecentVisited).not.toHaveBeenCalled()
    expect(useVisitedStore.getState()._hasHydrated).toBe(true)
  })
})
