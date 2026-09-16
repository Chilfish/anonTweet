import type { IRawAudioSpace } from '~/lib/rettiwt-api'
import type { EnrichedTweet } from '~/types'
import { describe, expect, it } from 'vitest'
import {
  extractAudiospaceId,
  extractSpaceIdFromUrl,
  formatSpaceDate,
  formatSpaceDuration,
  formatSpaceListeners,
  isSpaceUrl,
  mapSpaceDetails,
  resolveSpaceId,
  resolveSpacePlaybackState,
} from '~/lib/react-tweet/utils/space'
import { ResourceType, SpaceRequests } from '~/lib/rettiwt-api'
import { FetchResourcesGroup } from '~/lib/rettiwt-api/collections/Groups'
import { Requests } from '~/lib/rettiwt-api/collections/Requests'
import { loadFixture } from '../helpers/load-fixture'

/**
 * test/unit/space.spec.ts
 *
 * AC-SPACE-001~004 / 008~010 —— Space 卡片纯逻辑（无网络、无 React）。
 *
 * 样本全部为真实上游响应固化：推文 `1968314084207788302` 的 `card`（audiospace）、
 * Space `1yoKMPnjEbOxQ` 的 `AudioSpaceById` 响应，以及已删除 Space `1DGLdvzVZmLGm`
 * 的响应（只有 `is_subscribed`、无 metadata）。断言值对齐官方卡片实测文案
 * （`2,478 人がリスニング/リプレイ` / `9月17日` / `42:40`）。
 */

const SPACE_ID = '1yoKMPnjEbOxQ'

const card = loadFixture<unknown>('space/audio-space-card.json')
const audioSpace = loadFixture<IRawAudioSpace>('space/audio-space-ended.json')
const unavailableSpace = loadFixture<IRawAudioSpace>('space/audio-space-unavailable.json')
const tweet = loadFixture<EnrichedTweet>('tweets/with-space-ja.json')

/** 以真实 metadata 为底派生待测场次：只翻转被考察的字段，保留真实结构 */
function derived(over: Record<string, unknown>): Record<string, any> {
  return {
    metadata: { ...audioSpace.metadata, ...over },
  }
}

describe('AC-SPACE-001: audiospace card detection', () => {
  it('AC-SPACE-001: extracts the space id from the real audiospace card', () => {
    expect(extractAudiospaceId(card)).toBe(SPACE_ID)
  })

  it('AC-SPACE-001: returns null for anything that is not an audiospace card', () => {
    expect(extractAudiospaceId(undefined)).toBeNull()
    expect(extractAudiospaceId({})).toBeNull()
    expect(extractAudiospaceId({ legacy: { name: 'summary_large_image', binding_values: [] } })).toBeNull()
    // 名称像 audiospace 但没有 id binding / 没有 binding_values
    expect(extractAudiospaceId({
      legacy: { name: '3691233323:audiospace', binding_values: [{ key: 'card_url', value: { string_value: 'x' } }] },
    })).toBeNull()
    expect(extractAudiospaceId({ legacy: { name: '3691233323:audiospace' } })).toBeNull()
    // 也支持已是 legacy 层的直接传入（无 legacy 包裹）
    expect(extractAudiospaceId({ name: '3691233323:audiospace', binding_values: [{ key: 'id', value: { string_value: 'abc' } }] })).toBe('abc')
  })
})

describe('AC-SPACE-002: AudioSpaceById metadata mapping', () => {
  const space = mapSpaceDetails(SPACE_ID, audioSpace, tweet.user)

  it('AC-SPACE-002: maps the real metadata onto the card fields', () => {
    expect(space).not.toBeNull()

    expect(space!.id).toBe(SPACE_ID)
    expect(space!.url).toBe('https://x.com/i/spaces/1yoKMPnjEbOxQ')
    // 标题含 CJK + emoji，未被截断
    expect(space!.title).toBe('#ゆめみた合宿3日目！ついに最終日！✨コメントはハッシュタグにてお願いします✨')
    expect(space!.state).toBe('Ended')
    expect(space!.isReplayAvailable).toBe(true)
    expect(space!.availability).toBe('replayable')

    // 官方卡片 42:40 = ended_at - started_at
    expect(space!.startedAt).toBe(1758117620659)
    expect(space!.endedAt).toBe(1758120181605)
    expect(space!.durationMs).toBe(2560946)

    // 官方卡片 2,478 人がリスニング/リプレイ = 直播收听 + 回放
    expect(space!.liveListenersCount).toBe(1245)
    expect(space!.replayCount).toBe(1233)
    expect(space!.listenersCount).toBe(2478)

    expect(space!.host.name).toBe('夢限大みゅーたいぷ')
    expect(space!.host.screen_name).toBe('BDP_yumemita')
    expect(space!.host.id_str).toBe('1546362523561390081')
    expect(space!.host.profile_image_url_https).toContain('pbs.twimg.com/profile_images/')
  })

  it('AC-SPACE-002: fills verification from the tweet author when the host is the author', () => {
    // AudioSpaceById 的 creator_results 是精简对象：不含 is_blue_verified / verified_type
    const creator = (audioSpace.metadata.creator_results as any).result
    expect(creator.is_blue_verified).toBeUndefined()
    expect(creator.legacy.verified_type).toBeUndefined()

    // 推文作者对象更完整，同账号时补齐——否则官方卡片上的认证徽标会丢
    expect(space!.host.is_blue_verified).toBe(true)
    expect(space!.host.verified_type).toBe('Business')

    // 不同账号（非主播）不借用认证
    const other = mapSpaceDetails(SPACE_ID, audioSpace, {
      ...tweet.user,
      screen_name: 'someone_else',
      is_blue_verified: true,
      verified_type: 'Government',
    })
    expect(other!.host.is_blue_verified).toBe(false)
    expect(other!.host.verified_type).toBeUndefined()
  })
})

describe('AC-SPACE-003: malformed metadata degrades without throwing', () => {
  it('AC-SPACE-003: drops the card only when the space id itself is unknown', () => {
    // 没有 id 就无法构造任何 URL —— 唯一返回 null 的情形
    expect(mapSpaceDetails('', audioSpace)).toBeNull()
    expect(mapSpaceDetails('', undefined)).toBeNull()
  })

  it('AC-SPACE-003: degrades partial metadata instead of throwing', () => {
    // 无标题：仍返回（标题空），不整块丢弃
    const noTitle = mapSpaceDetails(SPACE_ID, derived({ title: '' }))
    expect(noTitle).not.toBeNull()
    expect(noTitle!.title).toBe('')
    expect(noTitle!.availability).toBe('replayable')

    // 进行中场次（无 ended_at）→ 不抛错，时长缺失
    const live = mapSpaceDetails(SPACE_ID, derived({ state: 'Running', ended_at: undefined }))
    expect(live!.durationMs).toBeNull()
    expect(live!.state).toBe('Running')

    // 缺 creator_results → 主播信息为空，但标题/人数仍在
    const noCreator = mapSpaceDetails(SPACE_ID, derived({ creator_results: undefined }))
    expect(noCreator!.title).toContain('ゆめみた合宿3日目')
    expect(noCreator!.host.screen_name).toBe('')
    expect(noCreator!.host.name).toBe('')
    expect(noCreator!.listenersCount).toBe(2478)

    // 人数缺失 → 归一为 0，不产生 NaN
    const noCounts = mapSpaceDetails(SPACE_ID, derived({
      total_live_listeners: undefined,
      total_replay_watched: undefined,
    }))
    expect(noCounts!.listenersCount).toBe(0)

    // 上游时间戳非法 → 时长缺失，不抛错
    expect(mapSpaceDetails(SPACE_ID, derived({ ended_at: 'not-a-number' }))!.durationMs).toBeNull()
  })
})

describe('AC-SPACE-004: display formatting matches the official card', () => {
  it('AC-SPACE-004: formats duration, date and listener count', () => {
    expect(formatSpaceDuration(2560946)).toBe('42:40')
    expect(formatSpaceDuration(3723000)).toBe('1:02:03')
    expect(formatSpaceDuration(59000)).toBe('0:59')
    expect(formatSpaceDuration(null)).toBe('')
    expect(formatSpaceDuration(0)).toBe('')
    expect(formatSpaceDuration(Number.NaN)).toBe('')

    // 实测样本：2025-09-17 22:00 (Asia/Shanghai) → 官方卡片「9月17日」，不补前导零
    expect(formatSpaceDate(1758117620659)).toBe('9月17日')
    expect(formatSpaceDate(new Date('2025-09-05T04:00:00Z').getTime())).toBe('9月5日')
    expect(formatSpaceDate(null)).toBe('')

    expect(formatSpaceListeners(2478)).toBe('2,478')
    expect(formatSpaceListeners(1245)).toBe('1,245')
    expect(formatSpaceListeners(0)).toBe('0')
  })

  it('AC-SPACE-004: recognises space urls for body de-duplication', () => {
    expect(isSpaceUrl('https://x.com/i/spaces/1yoKMPnjEbOxQ')).toBe(true)
    expect(isSpaceUrl('https://twitter.com/i/spaces/1yoKMPnjEbOxQ')).toBe(true)
    expect(isSpaceUrl('https://x.com/i/spaces/1yoKMPnjEbOxQ?foo=1')).toBe(true)
    expect(isSpaceUrl('https://t.co/gOS5Qc3DS4')).toBe(false)
    expect(isSpaceUrl('https://x.com/BDP_yumemita')).toBe(false)
    expect(isSpaceUrl(undefined)).toBe(false)
  })
})

describe('AC-SPACE-008: request layer targets AudioSpaceById', () => {
  it('AC-SPACE-008: builds an AudioSpaceById request with replays enabled', () => {
    const config = SpaceRequests.details(SPACE_ID)

    expect(config.method).toBe('get')
    expect(config.url).toContain('/graphql/HPEisOmj1epUNLCWTYhUWw/AudioSpaceById')

    const variables = JSON.parse(config.params.variables)
    expect(variables.id).toBe(SPACE_ID)
    expect(variables.withReplays).toBe(true)
  })

  it('AC-SPACE-008: the resource is registered for fetching (wiring guard)', () => {
    expect(ResourceType.SPACE_DETAILS).toBe('SPACE_DETAILS')
    // 未注册进 FetchResourcesGroup 会被 _validateArgs 判为无效资源，请求静默失败
    expect(FetchResourcesGroup).toContain(ResourceType.SPACE_DETAILS)
    expect(Requests[ResourceType.SPACE_DETAILS]({ id: SPACE_ID }).url)
      .toContain('AudioSpaceById')
  })
})

describe('AC-SPACE-009: deleted / inaccessible space becomes a tombstone', () => {
  // 真实样本：推文 2057046686871232598 → Space 1DGLdvzVZmLGm，
  // AudioSpaceById 只回 { is_subscribed: false }，没有 metadata
  it('AC-SPACE-009: maps a metadata-less response to the unavailable state', () => {
    expect(unavailableSpace.metadata).toBeUndefined()

    const space = mapSpaceDetails('1DGLdvzVZmLGm', unavailableSpace)

    expect(space).not.toBeNull()
    expect(space!.availability).toBe('unavailable')
    expect(space!.id).toBe('1DGLdvzVZmLGm')
    // 墓碑仍需可跳转地址（由 card binding 的 id 构造，不依赖 metadata）
    expect(space!.url).toBe('https://x.com/i/spaces/1DGLdvzVZmLGm')
    expect(space!.title).toBe('')
    expect(space!.listenersCount).toBe(0)
    expect(space!.durationMs).toBeNull()
    expect(space!.isReplayAvailable).toBe(false)
    expect(space!.host.name).toBe('')
    expect(space!.host.screen_name).toBe('')
  })

  it('AC-SPACE-009: treats a missing audioSpace node the same way', () => {
    expect(mapSpaceDetails('1DGLdvzVZmLGm', null)!.availability).toBe('unavailable')
    expect(mapSpaceDetails('1DGLdvzVZmLGm', undefined)!.availability).toBe('unavailable')
    expect(mapSpaceDetails('1DGLdvzVZmLGm', {})!.availability).toBe('unavailable')
  })

  // 回归：无卡片的 Space 推文（实测 1871586443388420240）过去会被整条漏掉 —— 只认 card binding 的 id
  it('AC-SPACE-009: resolves the space id from the body link when there is no card', () => {
    const cardless = loadFixture<{
      card: unknown
      entities: Array<{ expanded_url: string, href?: string }>
    }>('space/audio-space-cardless-tweet.json')

    expect(cardless.card).toBeNull()
    // 只有卡片时才有 id，此处为空
    expect(extractAudiospaceId(cardless.card)).toBeNull()

    const entities = cardless.entities.map(e => ({ ...e, href: e.expanded_url }))
    expect(resolveSpaceId(cardless.card, entities)).toBe('1djGXroNWDExZ')

    // 卡片优先于正文链接
    expect(resolveSpaceId(card, entities)).toBe(SPACE_ID)

    // 既无卡片也无 Space 链接 → null
    expect(resolveSpaceId(null, [{ href: 'https://example.com/a' }])).toBeNull()
    expect(resolveSpaceId(null, [])).toBeNull()
    expect(resolveSpaceId(undefined, undefined)).toBeNull()

    // 该 Space 同样已删除 → 墓碑态
    const space = mapSpaceDetails('1djGXroNWDExZ', unavailableSpace)
    expect(space!.availability).toBe('unavailable')
    expect(space!.url).toBe('https://x.com/i/spaces/1djGXroNWDExZ')
  })

  it('AC-SPACE-009: extracts the space id from a space url', () => {
    expect(extractSpaceIdFromUrl('https://x.com/i/spaces/1djGXroNWDExZ')).toBe('1djGXroNWDExZ')
    expect(extractSpaceIdFromUrl('https://twitter.com/i/spaces/1yoKMPnjEbOxQ?foo=1')).toBe('1yoKMPnjEbOxQ')
    expect(extractSpaceIdFromUrl('https://x.com/BDP_yumemita')).toBeNull()
    expect(extractSpaceIdFromUrl('https://t.co/ELCNFX5yGy')).toBeNull()
    expect(extractSpaceIdFromUrl(undefined)).toBeNull()
  })
})

describe('AC-SPACE-010: availability drives whether playback is offered', () => {
  it('AC-SPACE-010: only an ended space with replay enabled is replayable', () => {
    expect(mapSpaceDetails(SPACE_ID, audioSpace)!.availability).toBe('replayable')
    // 已结束但主办方未开启回放 —— 没有录音可放，不得给播放入口
    expect(mapSpaceDetails(SPACE_ID, derived({ is_space_available_for_replay: false }))!.availability)
      .toBe('no-replay')
    expect(mapSpaceDetails(SPACE_ID, derived({ state: 'TimedOut', is_space_available_for_replay: false }))!.availability)
      .toBe('no-replay')
  })

  it('AC-SPACE-010: classifies live and upcoming spaces', () => {
    expect(mapSpaceDetails(SPACE_ID, derived({ state: 'Running' }))!.availability).toBe('live')
    expect(mapSpaceDetails(SPACE_ID, derived({ state: 'NotStarted' }))!.availability).toBe('upcoming')
    // 大小写不敏感（上游 state 大小写不保证）
    expect(mapSpaceDetails(SPACE_ID, derived({ state: 'running' }))!.availability).toBe('live')
  })

  it('AC-SPACE-010: replay-disabled space still shows its metadata', () => {
    const noReplay = mapSpaceDetails(SPACE_ID, derived({ is_space_available_for_replay: false }))!
    // 回放关闭只是「不能播」，元数据照常展示（官方卡片也仍列出人数/时长）
    expect(noReplay.title).toContain('ゆめみた合宿3日目')
    expect(noReplay.listenersCount).toBe(2478)
    expect(noReplay.durationMs).toBe(2560946)
    expect(noReplay.host.name).toBe('夢限大みゅーたいぷ')
  })

  // 回归：availability 是后加字段，改动前落地的 space（memory / 本地文件 / DB）没有它。
  // 组件曾直接查表 → undefined，渲染时抛 `Cannot read properties of undefined (reading 'aria')`。
  it('AC-SPACE-010: resolves a playback state for cache entries without availability', () => {
    // 正常数据：直接用 availability
    expect(resolveSpacePlaybackState({ availability: 'live', isReplayAvailable: false })).toBe('live')
    expect(resolveSpacePlaybackState({ availability: 'upcoming', isReplayAvailable: false })).toBe('upcoming')

    // 旧缓存缺 availability → 按早期就存在的 isReplayAvailable 回退
    const stale = { isReplayAvailable: true } as unknown as Parameters<typeof resolveSpacePlaybackState>[0]
    expect(resolveSpacePlaybackState(stale)).toBe('replayable')
    expect(resolveSpacePlaybackState({ ...stale, isReplayAvailable: false })).toBe('no-replay')

    // 连 isReplayAvailable 都没有 → 保守不说「可播放」
    expect(resolveSpacePlaybackState({} as unknown as Parameters<typeof resolveSpacePlaybackState>[0]))
      .toBe('no-replay')

    // 墓碑态（unavailable）不是行动区状态，一并保守处理
    expect(resolveSpacePlaybackState({ availability: 'unavailable', isReplayAvailable: false })).toBe('no-replay')
  })
})
