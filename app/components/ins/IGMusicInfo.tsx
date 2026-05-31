import type { IGMedia } from '~/types'
import { Disc3, Sparkles } from 'lucide-react'
import { cn } from '~/lib/utils'

interface IGMusicInfoProps {
  media: IGMedia[]
  className?: string
}

/**
 * 帖子附带的音乐信息组件。
 *
 * 从 media 列表中找出第一项有音频数据的媒体，展示歌曲名 + 艺人 + 专辑封面。
 * 只有当帖子包含 Reel 音乐时渲染。
 *
 * 布局：音乐 icon（旋转唱片） + 歌曲名 · 艺人 | 若显式标记则小火花图标
 */
export function IGMusicInfo({ media, className }: IGMusicInfoProps) {
  const audioItem = media.find(m => m.audio_title)
  if (!audioItem)
    return null

  const { audio_title, audio_artist, audio_subtitle, audio_is_explicit, audio_cover_artwork_thumbnail_uri } = audioItem

  return (
    <div className={cn('flex items-center gap-2.5 px-4 py-1.5', className)}>
      {/* 专辑封面 / 唱片 icon */}
      {audio_cover_artwork_thumbnail_uri
        ? (
            <img
              src={audio_cover_artwork_thumbnail_uri}
              alt=""
              className="size-7 rounded object-cover shrink-0"
            />
          )
        : (
            <Disc3 className="size-5 text-muted-foreground/50 shrink-0 animate-spin [animation-duration:4s]" />
          )}

      {/* 歌曲信息 */}
      <div className="flex-1 min-w-0 leading-tight">
        <p className="text-xs font-medium truncate text-foreground/80">
          {audio_title}
          {audio_is_explicit && (
            <Sparkles className="size-3 inline ml-1 text-amber-500/70 -mt-0.5" />
          )}
        </p>
        {audio_artist && (
          <p className="text-[11px] text-muted-foreground/60 truncate">
            {audio_artist}
            {audio_subtitle && (
              <>
                {' '}
                ·
                {audio_subtitle}
              </>
            )}
          </p>
        )}
      </div>
    </div>
  )
}
