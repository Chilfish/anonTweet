import type { ArticleMedia } from '~/types'
import { MediaImage } from '~/components/ui/media'
import { normalizeMediaUrl } from '~/lib/media-url'
import { useProxyMedia } from '~/lib/stores/appConfig'

/** 文章内嵌图片：代理加载、按原始比例展示，可选 caption */
export function ArticleImage({ media, caption }: { media: ArticleMedia, caption?: string }) {
  const proxyMedia = useProxyMedia()
  const ratio = media.width && media.height ? `${media.width} / ${media.height}` : '16 / 9'

  return (
    <figure className="my-4">
      <div
        className="overflow-hidden rounded-xl border border-border/60 bg-muted/20"
        style={{ aspectRatio: ratio }}
      >
        <MediaImage
          src={proxyMedia(normalizeMediaUrl(media.url))}
          alt={media.alt ?? caption ?? 'Article image'}
          containerClassName="size-full"
          className="size-full object-contain"
        />
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-xs text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
