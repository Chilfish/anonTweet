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
              className="flex flex-col gap-1 py-3 px-2 border border-border/50 rounded bg-muted/70"
            >
              <span
                className="w-fit h-fit items-center justify-center rounded bg-muted/20 border border-border/50 px-1.5 py-0.5 text-[10px] font-medium"
              >
                图
                {' '}
                {i + 1}
              </span>

              <div className="flex min-w-0 flex-1 flex-col">
                <p className="tweet-body text-[13px]">
                  {media.ext_alt_text}
                </p>
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
