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
    <div className="mt-3 overflow-hidden rounded-xl border border-border bg-muted/30">
      <div className="flex items-center justify-between border-b border-border/10 px-3 py-1.5">
        <span className="text-xs font-bold text-muted-foreground">
          图片描述
        </span>
        <AltTranslationEditor originalTweet={tweet} />
      </div>
      <div className="space-y-1">
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
            <div
              key={media.media_url_https || i}
              className="flex flex-col py-2.5 px-2 border border-border/50 rounded bg-muted/70"
            >
              <div className="tweet-body text-[13px] leading-relaxed break-words">
                <span
                  className="mr-1.5 inline-flex min-w-fit h-4 items-center justify-center rounded bg-card/30 border border-border/50 px-1.5 text-[10px] font-bold text-muted-foreground align-middle"
                >
                  图
                  {i + 1}
                </span>
                {media.ext_alt_text}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                {translation && (
                  <div>
                    <div
                      className="mb-1"
                      dangerouslySetInnerHTML={{ __html: settings.customSeparator }}
                    >
                    </div>
                    <p className="tweet-body text-[13px] font-bold">
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
