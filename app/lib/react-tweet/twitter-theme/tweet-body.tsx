import type { EnrichedTweet } from '~/types'
import { cn } from '~/lib/utils'
import { isSpaceUrl } from '../utils/space'
import { TweetLink } from './tweet-link'

interface TweetBodyProps {
  tweet: EnrichedTweet
  isTranslated: boolean
  lang?: string
  className?: string
}

export function TweetBody({ tweet, isTranslated, lang, className }: TweetBodyProps) {
  return (
    <p
      className={cn('tweet-body', className)}
      lang={lang ?? tweet.lang}
      dir="auto"
    >
      {tweet.entities.map((item) => {
        const text = isTranslated ? (item.translation || item.aiTranslation || item.text) : item.text
        if (!isTranslated && item.index < 0)
          return null

        switch (item.type) {
          case 'url':
            // Space 卡片（TweetSpaceCard）已承载同一跳转，官方前端同样不重复展示该链接。
            // 仅在卡片数据确实渲染出来时才跳过——元数据获取失败时链接照常显示（优雅降级）。
            if (tweet.space && isSpaceUrl(item.href))
              return null
            return (
              <TweetLink key={item.index} href={item.href}>
                {text.length > 36 ? item.display_url : text}
              </TweetLink>
            )

          case 'hashtag':
          case 'mention':
          case 'symbol':
            return (
              <TweetLink key={item.index} href={item.href}>
                {text}
              </TweetLink>
            )
          case 'media':
          // Media text is currently never displayed, some tweets however might have indices
          // that do match `display_text_range` so for those cases we ignore the content.
            return null
          case 'media_alt':
            return null
          case 'separator':
            return null
          default:
          // We use `dangerouslySetInnerHTML` to preserve the text encoding.
          // https://github.com/vercel-labs/react-tweet/issues/29
            return (
              <span key={item.index} dangerouslySetInnerHTML={{ __html: text }} />
            )
        }
      })}
    </p>
  )
}
