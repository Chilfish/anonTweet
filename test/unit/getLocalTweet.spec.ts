import type { EnrichedTweet } from '~/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * test/unit/getLocalTweet.spec.ts
 *
 * AC-SPACE-011 —— 旧缓存回填 `space`。
 *
 * `space` 是后加字段：改动前落地的缓存（memory LRU / 本地文件 / DB jsonContent）没有它，
 * 而命中缓存时不会再走 `getEnrichedTweet`，于是 Space 卡片/墓碑永远不出现
 * （实测表现：已删除的 Space 推文仍然只渲染一个裸链接）。
 *
 * 这里 mock 掉缓存层与上游取数，只验证 `getLocalTweet` 出口的回填契约。
 */

const getLocalCache = vi.fn()
const setLocalCache = vi.fn()
const resolveSpaceById = vi.fn()

vi.mock('~/lib/localCache', () => ({
  getLocalCache: (...args: unknown[]) => getLocalCache(...args),
  setLocalCache: (...args: unknown[]) => setLocalCache(...args),
}))

vi.mock('~/lib/react-tweet/utils/get-tweet', () => ({
  getEnrichedTweet: vi.fn(),
  resolveSpaceById: (...args: unknown[]) => resolveSpaceById(...args),
}))

const { getLocalTweet } = await import('~/lib/service/getTweet.server')

/** 旧缓存里的推文：无 card、无 space，只有一条 Space 链接实体（真实样本形态） */
function cachedSpaceTweet(overrides: Partial<EnrichedTweet> = {}): EnrichedTweet {
  return {
    id_str: '1871586443388420240',
    lang: 'zxx',
    url: 'https://twitter.com/nonoka_yumemita/status/1871586443388420240',
    created_at: 'Tue Dec 24 14:59:15 +0000 2024',
    __typename: 'Tweet',
    text: 'https://t.co/ELCNFX5yGy',
    user: {
      id_str: '1',
      name: '宮永ののか',
      screen_name: 'nonoka_yumemita',
      profile_image_url_https: '',
      profile_image_shape: 'Circle',
      verified: false,
      is_blue_verified: false,
    },
    entities: [{
      type: 'url',
      index: 0,
      url: 'https://t.co/ELCNFX5yGy',
      text: 'x.com/i/spaces/1djGX…',
      display_url: 'x.com/i/spaces/1djGX…',
      expanded_url: 'https://x.com/i/spaces/1djGXroNWDExZ',
      href: 'https://x.com/i/spaces/1djGXroNWDExZ',
    }],
    ...overrides,
  } as EnrichedTweet
}

const tombstone = {
  id: '1djGXroNWDExZ',
  url: 'https://x.com/i/spaces/1djGXroNWDExZ',
  title: '',
  state: '',
  availability: 'unavailable' as const,
  createdAt: 0,
  startedAt: null,
  endedAt: null,
  durationMs: null,
  listenersCount: 0,
  liveListenersCount: 0,
  replayCount: 0,
  isReplayAvailable: false,
  host: {
    id_str: '',
    name: '',
    screen_name: '',
    profile_image_url_https: '',
    verified: false,
    is_blue_verified: false,
  },
}

beforeEach(() => {
  vi.clearAllMocks()
  setLocalCache.mockResolvedValue(undefined)
})

describe('AC-SPACE-011: backfills space for tweets cached before the field existed', () => {
  it('AC-SPACE-011: attaches the space resolved from the body link and persists it', async () => {
    getLocalCache.mockResolvedValue(cachedSpaceTweet())
    resolveSpaceById.mockResolvedValue(tombstone)

    const tweet = await getLocalTweet('1871586443388420240')

    expect(resolveSpaceById).toHaveBeenCalledWith('1djGXroNWDExZ', expect.anything())
    expect(tweet?.space).toMatchObject({ availability: 'unavailable' })
    // 写回缓存，避免每次浏览都重打上游
    expect(setLocalCache).toHaveBeenCalledWith(expect.objectContaining({
      id: '1871586443388420240',
      type: 'tweet',
      value: expect.objectContaining({ space: expect.objectContaining({ id: '1djGXroNWDExZ' }) }),
    }))
  })

  it('AC-SPACE-011: leaves tweets that already have a current-shape space untouched', async () => {
    getLocalCache.mockResolvedValue(cachedSpaceTweet({ space: tombstone }))

    const tweet = await getLocalTweet('1871586443388420240')

    expect(resolveSpaceById).not.toHaveBeenCalled()
    expect(setLocalCache).not.toHaveBeenCalled()
    expect(tweet?.space).toEqual(tombstone)
  })

  // 早期缓存里落下的 space 没有 availability（后加字段）→ 顺带升级一次，而不是只靠渲染兜底
  it('AC-SPACE-011: upgrades a stale space entry that lacks availability', async () => {
    const stale = { ...tombstone, availability: undefined } as unknown as typeof tombstone
    getLocalCache.mockResolvedValue(cachedSpaceTweet({ space: stale }))
    resolveSpaceById.mockResolvedValue(tombstone)

    const tweet = await getLocalTweet('1871586443388420240')

    expect(resolveSpaceById).toHaveBeenCalledWith('1djGXroNWDExZ', expect.anything())
    expect(tweet?.space?.availability).toBe('unavailable')
    expect(setLocalCache).toHaveBeenCalled()
  })

  it('AC-SPACE-011: ignores tweets without any space link', async () => {
    getLocalCache.mockResolvedValue(cachedSpaceTweet({
      entities: [{ type: 'text', index: 0, text: 'hello' }],
    }))

    const tweet = await getLocalTweet('1')

    expect(resolveSpaceById).not.toHaveBeenCalled()
    expect(tweet?.space).toBeUndefined()
  })

  // 请求失败（429 / 网络）不得被当成「已删除」——否则限流会被误报成墓碑
  it('AC-SPACE-011: does not fabricate a tombstone when the upstream call fails', async () => {
    getLocalCache.mockResolvedValue(cachedSpaceTweet())
    resolveSpaceById.mockResolvedValue(null)

    const tweet = await getLocalTweet('1871586443388420240')

    expect(tweet?.space).toBeUndefined()
    expect(setLocalCache).not.toHaveBeenCalled()
  })

  it('AC-SPACE-011: returns null for a cache miss', async () => {
    getLocalCache.mockResolvedValue(null)

    expect(await getLocalTweet('1')).toBeNull()
    expect(resolveSpaceById).not.toHaveBeenCalled()
  })
})
