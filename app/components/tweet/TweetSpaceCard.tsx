import type { EnrichedTweet, SpaceAvailability } from '~/types'
import { MicOff, Play } from 'lucide-react'
import { useMemo } from 'react'
import { MediaImage } from '~/components/ui/media'
import { normalizeMediaUrl } from '~/lib/media-url'
import { VerifiedBadge } from '~/lib/react-tweet/twitter-theme/verified-badge'
import {
  formatSpaceDate,
  formatSpaceDuration,
  formatSpaceListeners,
  resolveSpacePlaybackState,
} from '~/lib/react-tweet/utils/space'
import { useProxyMedia } from '~/lib/stores/appConfig'
import { cn } from '~/lib/utils'

interface TweetSpaceCardProps {
  tweet: EnrichedTweet
  className?: string
}

/**
 * 各可播放状态的行动区与无障碍名称。
 *
 * 关键：**只有 `replayable` 才给播放入口**——已结束但未开启回放的 Space 没有录音可放，
 * 给「播放录音」会把人送进一个播不了的页面（本期站内不播放，整卡跳转 X，按钮即承诺）。
 */
const ACTION_BY_AVAILABILITY: Record<
  Exclude<SpaceAvailability, 'unavailable'>,
  { label: string, aria: string, primary: boolean, icon: 'play' | 'mic-off' | null }
> = {
  'replayable': { label: '播放录音', aria: '播放录音', primary: true, icon: 'play' },
  'live': { label: '直播中', aria: '正在直播', primary: true, icon: null },
  'upcoming': { label: '尚未开始', aria: '尚未开始', primary: false, icon: null },
  'no-replay': { label: '录音不可回放', aria: '录音不可回放', primary: false, icon: 'mic-off' },
}

/**
 * X Space 卡片（语音直播 / 录音回放）。
 *
 * 对标官方渲染（`tmp/録音を再生….html` 实测 DOM）：紫色底 + 白字，主播行（头像 + 名称 +
 * 认证徽标）、标题、`收听/回放 · 日期 · 时长` 元信息行、行动按钮。
 *
 * 边界态（本卡片存在的主要理由）：
 * - **Space 已删除 / 不可访问**（上游无 metadata）→ 中性墓碑条「Space 已删除或不可访问」，
 *   不再只剩正文里一个裸链接
 * - **已结束但未开启回放** → 标题照常展示，行动区降级为「录音不可回放」（不给播放入口）
 * - 进行中 / 未开始 → 行动区分别为「直播中」/「尚未开始」
 *
 * 范围裁定（owner 2026-09-16）：**卡片 + 跳转 X 播放**。整卡是指向 Space 页面的链接——
 * 站内播放需要 hls.js + 服务端媒体代理（pscp.tv 的 m3u8 只给 `x.com` 放行 CORS），本期不做，
 * 故行动区是视觉元素而非嵌套的可交互元素（避免交互元素嵌套）。
 */
export function TweetSpaceCard({ tweet, className }: TweetSpaceCardProps) {
  const proxyMedia = useProxyMedia()
  const space = tweet.space

  const data = useMemo(() => {
    if (!space)
      return null

    const avatarUrl = space.host.profile_image_url_https

    return {
      duration: formatSpaceDuration(space.durationMs),
      listeners: `${formatSpaceListeners(space.listenersCount)} 人收听/回放`,
      date: formatSpaceDate(space.createdAt),
      avatarSrc: avatarUrl ? proxyMedia(normalizeMediaUrl(avatarUrl)) : '',
    }
  }, [space, proxyMedia])

  if (!space || !data)
    return null

  // 墓碑态：上游已明确「没有这个 Space」，没有任何可展示的元数据
  if (space.availability === 'unavailable') {
    return (
      <div
        className={cn(
          'mt-2 flex items-center gap-2 rounded-md border border-border/60 bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground',
          className,
        )}
      >
        <MicOff className="size-3.5 shrink-0" aria-hidden="true" />
        <span>Space 已删除或不可访问</span>
        <a
          href={space.url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto shrink-0 underline underline-offset-2 hover:text-foreground"
        >
          在 X 查看
        </a>
      </div>
    )
  }

  const { duration, listeners, date, avatarSrc } = data
  // 经 resolveSpacePlaybackState 兜底：旧缓存里的 space 没有 availability 字段
  const action = ACTION_BY_AVAILABILITY[resolveSpacePlaybackState(space)]

  return (
    <a
      href={space.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${action.aria}: ${space.title}`}
      className={cn(
        'mt-2 block overflow-hidden rounded-md bg-[#9c63fa] text-white transition-colors hover:bg-[#8b4ff2]',
        className,
      )}
    >
      <div className="flex flex-col gap-3 p-3">
        <div className="flex items-center gap-2">
          <div className="size-6 shrink-0 overflow-hidden rounded-full bg-white/25">
            {avatarSrc
              ? (
                  <MediaImage
                    src={avatarSrc}
                    alt=""
                    className="size-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                )
              : null}
          </div>

          <div className="flex min-w-0 items-center gap-1">
            <span className="truncate text-sm font-bold" title={space.host.name}>
              {space.host.name}
            </span>
            <VerifiedBadge user={space.host} className="shrink-0" />
          </div>
        </div>

        {space.title
          ? (
              <div className="text-[1.0625rem] font-bold leading-snug line-clamp-2">
                {space.title}
              </div>
            )
          : null}

        <div className="flex flex-wrap items-center gap-1.5 text-[13px] text-white/80">
          <span>{listeners}</span>
          <span aria-hidden="true" className="text-white/40">·</span>
          <span>{date}</span>
          {duration
            ? (
                <>
                  <span aria-hidden="true" className="text-white/40">·</span>
                  <span aria-label={`时长 ${duration}`}>{duration}</span>
                </>
              )
            : null}
        </div>

        <span
          className={cn(
            'inline-flex w-fit items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold',
            action.primary ? 'bg-white text-[#0f1419]' : 'bg-white/15 text-white/85',
          )}
        >
          {action.icon === 'play'
            ? <Play className="size-4 fill-current" aria-hidden="true" />
            : null}
          {action.icon === 'mic-off'
            ? <MicOff className="size-4" aria-hidden="true" />
            : null}
          {action.label}
        </span>
      </div>
    </a>
  )
}
