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
    <div className="mt-2 rounded-lg border border-border/40 bg-muted/20 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          图片描述
        </span>
      </div>
      <div className="space-y-3">
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
            <div key={i} className="flex flex-col gap-1 text-sm">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 rounded bg-black/10 px-1 py-0.5 text-[10px] font-bold text-muted-foreground dark:bg-white/10">
                  图
                  {i + 1}
                </span>
                <p className="">
                  {media.ext_alt_text}
                </p>
              </div>
              {translation && (
                <>
                  <div
                    className="ml-9 translation-separator"
                    dangerouslySetInnerHTML={{ __html: settings.customSeparator }}
                  >
                  </div>
                  <p className="ml-9 border-border/40 pt-1 font-semibold">
                    {translation}
                  </p>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
