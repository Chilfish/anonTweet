import type { EnrichedTweet } from '~/types'
import { useTweetTranslation } from '~/hooks/use-tweet-translation'
import { useTranslationStore } from '~/lib/stores/translation'

export function TweetMediaAlt({ tweet }: { tweet: EnrichedTweet }) {
  const { entities } = useTweetTranslation(tweet)
  const { settings } = useTranslationStore()

  if (!tweet.mediaDetails?.length)
    return null

  // Filter media that has alt text
  const mediaWithAlt = tweet.mediaDetails.filter(
    m => m.type === 'photo' && m.ext_alt_text,
  )

  if (mediaWithAlt.length === 0)
    return null

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-border/20 bg-muted/30">
      <div className="border-b border-border/10 bg-muted/40 px-3 py-1.5">
        <span className="text-[11px] font-medium text-muted-foreground">
          图片描述
        </span>
      </div>
      <div className="space-y-4 p-3.5">
        {tweet.mediaDetails.map((media, i) => {
          if (media.type !== 'photo' || !media.ext_alt_text)
            return null

          // 使用与 TranslationEditor 一致的索引逻辑来查找对应的翻译实体
          const altIndex = 20000 + i
          const translationEntity = entities?.find(
            e => e.index === altIndex && e.type === 'media_alt',
          )
          const translation = translationEntity?.translation

          return (
            <div key={i} className="flex gap-3 text-sm">
              <span className="mt-0.5 flex h-fit shrink-0 items-center justify-center rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium shadow-sm ring-1 ring-inset ring-border/50">
                图
                {' '}
                {i + 1}
              </span>

              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <p className="wrap-break-word text-[13px] leading-relaxed">
                  {media.ext_alt_text}
                </p>
                {translation && (
                  <div>
                    <div
                      className="mb-1"
                      dangerouslySetInnerHTML={{ __html: settings.customSeparator }}
                    >
                    </div>
                    <p className="text-[13px] font-bold leading-relaxed text-foreground">
                      {translation}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
