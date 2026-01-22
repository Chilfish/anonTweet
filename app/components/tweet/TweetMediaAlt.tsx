import type { EnrichedTweet } from '~/types'
import { AltTranslationEditor } from '~/components/translation/AltTranslationEditor'
import { useTweetTranslation } from '~/hooks/use-tweet-translation'
import { useTranslationSettings } from '~/lib/stores/hooks'

export function TweetMediaAlt({ tweet }: { tweet: EnrichedTweet }) {
  const { entities } = useTweetTranslation(tweet, 'alt')
  const settings = useTranslationSettings()
  const altEntitiesSize = entities?.filter(e => e.type === 'media_alt')?.length || 0

  if (!tweet.mediaDetails?.length)
    return null

  if (!altEntitiesSize) {
    return null
  }

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-border/20 bg-muted/30">
      <div className="flex items-center justify-between border-b border-border/10 bg-muted/40 px-3 py-1.5">
        <span className="text-[11px] font-medium text-muted-foreground">
          图片描述
        </span>
        <AltTranslationEditor originalTweet={tweet} />
      </div>
      <div className="space-y-4 py-3 px-2">
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
            <div key={i} className="flex gap-2 text-sm">
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
