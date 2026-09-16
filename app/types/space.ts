import type { TweetUser } from './user'

/**
 * Space 主播（对应元数据 `creator_results.result`）。
 *
 * 认证字段与 {@link TweetUser} 同名同义，便于直接复用 `VerifiedBadge` 渲染。
 */
export interface SpaceHost extends Pick<TweetUser, 'verified' | 'verified_type' | 'is_blue_verified'> {
  id_str: string
  name: string
  screen_name: string
  profile_image_url_https: string
}

/** `metadata.state` 原样值：`NotStarted` / `Running` / `Ended` / `TimedOut` */
export type SpaceState = string

/**
 * 卡片的可播放状态（由 `state` + `is_space_available_for_replay` 推导）：
 *
 * - `replayable`：已结束且可回放 → 「播放录音」
 * - `live`：进行中 → 尚未产生录音，只能去 X 收听
 * - `upcoming`：未开始
 * - `no-replay`：已结束但主办方未开启回放 → **录音不可回放**（不能给播放入口）
 * - `unavailable`：Space 已删除 / 不可访问（上游无 `metadata`）→ 只给不可用提示
 */
export type SpaceAvailability = 'replayable' | 'live' | 'upcoming' | 'no-replay' | 'unavailable'

/**
 * Space 卡片展示所需的全部信息（由 `AudioSpaceById` 的 `audioSpace.metadata` 映射而来）。
 *
 * 字段口径对齐官方卡片：`listenersCount` 为「直播收听 + 回放」总数（官方文案
 * 「N 人がリスニング/リプレイ」），`durationMs` 为已结束场次的 `ended_at - started_at`。
 *
 * `availability === 'unavailable'` 时为**上游无元数据**的墓碑态：标题/主播/人数全部为空，
 * 仅 `id` / `url` 可用（见 {@link SpaceAvailability}）。
 */
export interface SpaceDetails {
  id: string
  /** Space 页面地址（卡片跳转目标；本期站内不播放录音） */
  url: string
  /** 标题；`unavailable` 时为空串 */
  title: string
  state: SpaceState
  availability: SpaceAvailability
  /** 场次创建时间（ms），官方卡片用于显示「9月17日」 */
  createdAt: number
  startedAt: number | null
  endedAt: number | null
  /** 已结束场次时长（ms）；进行中/未开始/缺 `ended_at` 时为 null */
  durationMs: number | null
  listenersCount: number
  liveListenersCount: number
  replayCount: number
  isReplayAvailable: boolean
  host: SpaceHost
}
