import type { IRawAudioSpace, IRawSpaceDetailsResponse } from '~/lib/rettiwt-api'
import type { SpaceAvailability, SpaceDetails, SpaceHost, TweetUser } from '~/types'
import { formatDate } from './date-utils'

/**
 * Space（语音直播/录音回放）卡片纯逻辑。
 *
 * 上游两段数据来源不同、结构不同，故这里只做「纯映射」，不做任何 IO：
 * - **卡片识别**：`extractAudiospaceId()` 读推文自带的 `card.name = '…:audiospace'`
 *   （其 `binding_values` 只有 `tweet_id` / `id` / `card_url` 等，无 title/图片，
 *   因此会被 `mapTwitterCard` 的最终校验丢弃——这正是 Space 卡片过去完全不显示的原因）。
 * - **元数据**：`mapSpaceDetails()` 把 `AudioSpaceById` 的 `audioSpace.metadata`
 *   映射为 {@link SpaceDetails}（标题/状态/起止时间/收听人数/主播）。
 *
 * 字段口径全部对齐官方卡片实测值（样本：Space `1yoKMPnjEbOxQ`，Ended + 可回放）。
 * 下沉为纯函数以便单测（Postmortem #002：纯逻辑必须脱离 React 才能验证）。
 */

/** 官方 Space 卡片名形如 `3691233323:audiospace`（前缀为卡片模板号，随版本变动） */
const AUDIOSPACE_CARD_SUFFIX = 'audiospace'

/** 正文中的 Space 链接（`x.com/i/spaces/<id>` / `twitter.com/i/spaces/<id>`） */
const SPACE_URL_RE = /^https?:\/\/(?:www\.|mobile\.)?(?:twitter|x)\.com\/i\/spaces\/([0-9A-Za-z]+)/

/**
 * 从推文原始 `card` 中取出 Space id。
 *
 * @param cardData - 原始 `TweetResultByRestId` 响应里的 `card` 节点
 * @returns Space id；非 audiospace 卡或缺 `id` binding 时返回 null
 */
export function extractAudiospaceId(cardData: unknown): string | null {
  const legacy = (cardData as { legacy?: unknown })?.legacy ?? cardData
  const name = (legacy as { name?: unknown })?.name
  const bindingValues = (legacy as { binding_values?: unknown })?.binding_values

  if (typeof name !== 'string' || !name.endsWith(AUDIOSPACE_CARD_SUFFIX) || !Array.isArray(bindingValues))
    return null

  const id = bindingValues
    .find((v: any) => v?.key === 'id')
    ?.value
    ?.string_value

  return typeof id === 'string' && id ? id : null
}

/** 该 URL 是否指向 X Space 页面（正文据此避免与卡片重复展示同一个跳转） */
export function isSpaceUrl(url?: string | null): boolean {
  return typeof url === 'string' && SPACE_URL_RE.test(url)
}

/** 从 Space 链接里取出 Space id；不是 Space 链接时返回 null */
export function extractSpaceIdFromUrl(url?: string | null): string | null {
  if (typeof url !== 'string')
    return null
  return SPACE_URL_RE.exec(url)?.[1] ?? null
}

/**
 * 解析推文对应的 Space id，**优先卡片、回退正文链接**。
 *
 * 两种推文都要能识别：
 * - 带 `…:audiospace` 卡片（常见形态，id 在 binding 里）
 * - **无卡片**、只在正文里贴了 `x.com/i/spaces/…` 链接（实测样本：推文
 *   `1871586443388420240` 完全没有 card，只有一个 url 实体）——这类过去会被整条漏掉
 */
export function resolveSpaceId(
  cardData: unknown,
  entities?: ReadonlyArray<unknown> | null,
): string | null {
  const fromCard = extractAudiospaceId(cardData)
  if (fromCard)
    return fromCard

  // 实体是联合类型（text/hashtag/… 多数没有 href），故按 unknown 收进来再窄化
  for (const entity of entities ?? []) {
    const id = extractSpaceIdFromUrl((entity as { href?: string } | null | undefined)?.href)
    if (id)
      return id
  }

  return null
}

/** 上游时间戳混用秒/毫秒，`< 1e12` 视为秒；空值/非法值统一为 null */
function toMillis(value: unknown): number | null {
  if (value === null || value === undefined || value === '')
    return null
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0)
    return null
  return n < 1e12 ? Math.round(n * 1000) : n
}

function asRecord(value: unknown): Record<string, any> | undefined {
  return value && typeof value === 'object' ? value as Record<string, any> : undefined
}

/**
 * 由 `state` + `is_space_available_for_replay` 推导卡片可播放状态。
 *
 * 关键分支是「已结束但未开启回放」：此时**没有**录音可放，绝不能给播放入口
 * （官方卡片同样不给）。
 */
function resolveAvailability(state: string, isReplayAvailable: boolean): SpaceAvailability {
  const normalized = state.toLowerCase()
  if (normalized === 'running')
    return 'live'
  if (normalized === 'notstarted')
    return 'upcoming'
  // Ended / TimedOut / 未知一律按「已结束」处理，能否播由回放开关决定
  return isReplayAvailable ? 'replayable' : 'no-replay'
}

const EMPTY_HOST: SpaceHost = {
  id_str: '',
  name: '',
  screen_name: '',
  profile_image_url_https: '',
  verified: false,
  is_blue_verified: false,
}

/**
 * 把 `AudioSpaceById` 的 `data.audioSpace` 节点映射为卡片所需的 {@link SpaceDetails}。
 *
 * @param spaceId - 卡片 binding 里的 Space id（墓碑态也要靠它构造 URL，故必须先于元数据拿到）
 * @param audioSpace - GraphQL `data.audioSpace` 节点
 * @param tweetAuthor - 推文作者（可选）。当作者就是主播时，用推文侧更完整的用户对象
 *   补齐认证信息与头像——`AudioSpaceById` 的 `creator_results` 是精简对象，缺
 *   `is_blue_verified` / `verified_type`，只靠它渲染会丢掉官方卡片上的认证徽标。
 * @returns `spaceId` 为空时返回 null；**上游无 metadata 时返回 `unavailable` 墓碑态**
 *   ——已删除 / 不可访问的 Space 也要有 UI 提示，而不是静默什么都不显示
 *   （实测这类 id 的响应是 `{ is_subscribed: false }`，没有 metadata）
 */
export function mapSpaceDetails(
  spaceId: string,
  audioSpace?: IRawAudioSpace | Record<string, any> | null,
  tweetAuthor?: TweetUser | null,
): SpaceDetails | null {
  if (!spaceId)
    return null

  const url = `https://x.com/i/spaces/${spaceId}`
  const metadata = asRecord(asRecord(audioSpace)?.metadata) as IRawSpaceDetailsResponse | undefined

  if (!metadata) {
    return {
      id: spaceId,
      url,
      title: '',
      state: '',
      availability: 'unavailable',
      createdAt: 0,
      startedAt: null,
      endedAt: null,
      durationMs: null,
      listenersCount: 0,
      liveListenersCount: 0,
      replayCount: 0,
      isReplayAvailable: false,
      host: { ...EMPTY_HOST },
    }
  }

  const title = typeof metadata.title === 'string' ? metadata.title.trim() : ''

  const creator = asRecord(asRecord(metadata.creator_results)?.result)
  const creatorLegacy = asRecord(creator?.legacy)

  const host: SpaceHost = {
    id_str: typeof creator?.rest_id === 'string' ? creator.rest_id : '',
    name: typeof creatorLegacy?.name === 'string' ? creatorLegacy.name : '',
    screen_name: typeof creatorLegacy?.screen_name === 'string' ? creatorLegacy.screen_name : '',
    profile_image_url_https: typeof creatorLegacy?.profile_image_url_https === 'string'
      ? creatorLegacy.profile_image_url_https
      : '',
    verified: creatorLegacy?.verified === true,
    is_blue_verified: creator?.is_blue_verified === true,
    verified_type: creatorLegacy?.verified_type,
  }

  if (tweetAuthor?.screen_name && tweetAuthor.screen_name === host.screen_name) {
    // 上游会省略 `verified` 字段（仅在真为 true 时出现），故一律用 `=== true` 收敛为布尔
    host.verified = host.verified || tweetAuthor.verified === true
    host.is_blue_verified = host.is_blue_verified || tweetAuthor.is_blue_verified === true
    host.verified_type ??= tweetAuthor.verified_type
    host.profile_image_url_https ||= tweetAuthor.profile_image_url_https
  }

  const startedAt = toMillis(metadata.started_at)
  const endedAt = toMillis(metadata.ended_at)
  const liveListenersCount = Number(metadata.total_live_listeners) || 0
  const replayCount = Number(metadata.total_replay_watched) || 0
  const isReplayAvailable = metadata.is_space_available_for_replay === true
  const state = typeof metadata.state === 'string' ? metadata.state : ''

  return {
    id: spaceId,
    url,
    title,
    state,
    availability: resolveAvailability(state, isReplayAvailable),
    createdAt: toMillis(metadata.created_at) ?? 0,
    startedAt,
    endedAt,
    durationMs: startedAt !== null && endedAt !== null && endedAt > startedAt
      ? endedAt - startedAt
      : null,
    listenersCount: liveListenersCount + replayCount,
    liveListenersCount,
    replayCount,
    isReplayAvailable,
    host,
  }
}

/** 场次时长 → 官方口径 `42:40`（≥1 小时为 `1:02:03`）；无效时长返回空串 */
export function formatSpaceDuration(ms?: number | null): string {
  if (ms === null || ms === undefined || !Number.isFinite(ms) || ms <= 0)
    return ''

  const totalSeconds = Math.floor(ms / 1000)
  const seconds = totalSeconds % 60
  const minutes = Math.floor(totalSeconds / 60) % 60
  const hours = Math.floor(totalSeconds / 3600)
  const pad = (n: number) => n.toString().padStart(2, '0')

  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${minutes}:${pad(seconds)}`
}

/** 场次日期 → 官方口径 `9月17日`（时区口径复用 formatDate 的 Asia/Shanghai，不补前导零） */
export function formatSpaceDate(ms?: number | null): string {
  if (ms === null || ms === undefined || !Number.isFinite(ms) || ms <= 0)
    return ''

  const [month, day] = formatDate(ms, 'MM-dd').split('-')
  if (!month || !day)
    return ''

  return `${Number(month)}月${Number(day)}日`
}

/** 收听/回放人数 → 千分位 `2,478` */
export function formatSpaceListeners(count: number): string {
  if (!Number.isFinite(count) || count <= 0)
    return '0'
  return count.toLocaleString('en-US')
}

/** 除墓碑态外的可播放状态（卡片行动区只在这四种里选） */
export type SpacePlaybackState = Exclude<SpaceAvailability, 'unavailable'>

const SPACE_PLAYBACK_STATES: Record<SpacePlaybackState, true> = {
  'replayable': true,
  'live': true,
  'upcoming': true,
  'no-replay': true,
}

/**
 * 解析卡片行动区状态，**兼容旧缓存**。
 *
 * `availability` 是后加字段：改动前落地的 `space`（memory LRU / 本地文件 / DB jsonContent）
 * 没有它，直接查表会拿到 `undefined` 并在渲染时崩（实测于 dev）。故此处按早期就存在的
 * `isReplayAvailable` 回退推导；再退化（字段也缺失）时保守取 `no-replay`——
 * 宁可不说「可播放」，也不给一个播不了的承诺。
 */
export function resolveSpacePlaybackState(
  space: Pick<SpaceDetails, 'availability' | 'isReplayAvailable'>,
): SpacePlaybackState {
  const { availability } = space
  if (availability && availability !== 'unavailable' && availability in SPACE_PLAYBACK_STATES)
    return availability

  return space.isReplayAvailable ? 'replayable' : 'no-replay'
}
