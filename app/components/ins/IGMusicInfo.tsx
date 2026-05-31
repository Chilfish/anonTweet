import type { IGAudio } from '~/types'
import { Disc3, Sparkles } from 'lucide-react'
import { cn } from '~/lib/utils'

interface IGMusicInfoProps {
  audio?: IGAudio | null
  className?: string
}

/**
 * 帖子附带的音乐信息。
 *
 * 只在帖子包含音频（Reel 音乐等）时渲染。
 * 布局：旋转唱片 icon + 歌曲名 · 艺人 | 显式标记火花图标
 */
export function IGMusicInfo({ audio, className }: IGMusicInfoProps) {
  if (!audio?.title)
    return null

  const { title, subtitle, artist, is_explicit, cover_artwork_thumbnail_uri } = audio

  return (
    <div className={cn('flex items-center gap-2.5 px-4 py-1.5', className)}>
      {/* 专辑封面 or 旋转唱片 */}
      {cover_artwork_thumbnail_uri
        ? (
            <img
              src={cover_artwork_thumbnail_uri}
              alt=""
              className="size-7 rounded object-cover shrink-0"
            />
          )
        : (
            <Disc3 className="size-5 text-muted-foreground/50 shrink-0 animate-spin [animation-duration:4s]" />
          )}

      {/* 歌名 · 艺人 */}
      <div className="flex-1 min-w-0 leading-tight">
        <p className="text-xs font-medium truncate text-foreground/80">
          {title}
          {is_explicit && (
            <Sparkles className="size-3 inline ml-1 text-amber-500/70 -mt-0.5" />
          )}
        </p>
        {artist && (
          <p className="text-[11px] text-muted-foreground/60 truncate">
            {artist}
            {subtitle && (
              <>
                {' '}
                ·
                {subtitle}
              </>
            )}
          </p>
        )}
      </div>
    </div>
  )
}
