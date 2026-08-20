import type { TrendingCardInfo } from '~/types'
import { MediaImage } from '~/components/ui/media'
import { useProxyMedia } from '~/lib/stores/appConfig'
import { cn } from '~/lib/utils'

/**
 * Trending 卡片变体 —— 还原官方 X Trending 卡片渲染结构
 * （参考 cache/trending.html：aspect 18:10 大图 + 右下覆盖层：
 *   meta 行 → 标题(line-clamp-3) → 头像组+posts → 描述(line-clamp-2)）。
 *
 * 2026-08-19 评审拆分（P2-1）：自 TweetCard.tsx 拆出，独立组件可单独出 story；
 * 主图 `alt=""`（装饰图，标题 h3 已承载可访问名称，避免读屏重复朗读，P1-2）；
 * 头像/主图统一走 MediaImage（加载/错误占位三态，P2-2），取消原生 `<img>`。
 */
export function TrendingCardView({
  trending,
  className,
}: {
  trending: TrendingCardInfo
  className?: string
}) {
  const proxyMedia = useProxyMedia()

  return (
    <a
      href={trending.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'block overflow-hidden rounded-md mt-2 border border-border/60',
        className,
      )}
    >
      <div className="relative aspect-[18/10] bg-muted/50">
        <MediaImage
          src={proxyMedia(trending.imageUrl)}
          alt=""
          className="absolute inset-0 size-full object-cover"
          loading="lazy"
        />
        {/* 底部渐变遮罩，保证文字可读 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-3 text-white">
          {/* meta 行：分类（+ 可选日期），官方以 • 分隔 */}
          {(trending.categories.length > 0 || trending.postsCount) && (
            <div className="flex items-center gap-1 text-xs font-medium text-white/80">
              {trending.categories.map((cat, i) => (
                <span key={`${i}-${cat}`} className="inline-flex items-center gap-1">
                  {i > 0 && <span>•</span>}
                  <span>{cat}</span>
                </span>
              ))}
            </div>
          )}

          {/* 标题（可访问名称的唯一来源，主图 alt 已置空） */}
          <h3 className="line-clamp-3 font-semibold text-sm leading-tight text-white drop-shadow-sm">
            {trending.title}
          </h3>

          {/* 头像组 + posts 计数 */}
          {(trending.avatars.length > 0 || trending.postsCount) && (
            <div className="flex items-center gap-1.5 text-xs text-white/85">
              {trending.avatars.length > 0 && (
                <span className="flex -space-x-1.5">
                  {trending.avatars.slice(0, 3).map(avatar => (
                    <MediaImage
                      key={avatar}
                      src={proxyMedia(avatar)}
                      alt=""
                      containerClassName="size-5! rounded-full border border-white/50 bg-white/20 overflow-hidden"
                      loading="lazy"
                    />
                  ))}
                </span>
              )}
              {trending.postsCount && (
                <span>
                  {' '}
                  •
                  {' '}
                  {trending.postsCount}
                </span>
              )}
            </div>
          )}

          {/* 描述 */}
          {trending.description && (
            <p className="line-clamp-2 text-xs leading-relaxed text-white/90">
              {trending.description}
            </p>
          )}
        </div>
      </div>
    </a>
  )
}
