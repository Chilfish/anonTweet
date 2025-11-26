import type { EnrichedTweet } from '~/lib/react-tweet'
import { cn } from '~/lib/utils'
import s from './tweet-body.module.css'
import { TweetLink } from './tweet-link'

interface TweetBodyProps {
  tweet: EnrichedTweet
  lang?: string
  className?: string
}

export function TweetBody({ tweet, lang, className }: TweetBodyProps) {
  return (
    <p
      className={cn(s.root, className)}
      lang={lang ?? tweet.lang}
      dir="auto"
    >
      {tweet.entities.map((item, i) => {
        switch (item.type) {
          case 'hashtag':
          case 'mention':
          case 'url':
          case 'symbol':
            return (
              <TweetLink key={i} href={item.href}>
                {item.text}
              </TweetLink>
            )
          case 'media':
          // Media text is currently never displayed, some tweets however might have indices
          // that do match `display_text_range` so for those cases we ignore the content.
            return null
          default:
          // We use `dangerouslySetInnerHTML` to preserve the text encoding.
          // https://github.com/vercel-labs/react-tweet/issues/29
            return (
              <span key={i} dangerouslySetInnerHTML={{ __html: item.text }} />
            )
        }
      })}
    </p>
  )
}
