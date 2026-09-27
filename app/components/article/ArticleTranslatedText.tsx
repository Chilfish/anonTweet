import type { ArticleRun } from '~/types'
import { Fragment } from 'react'
import { TweetLink } from '~/lib/react-tweet/twitter-theme/tweet-link'

/**
 * 译文还原。
 *
 * 翻译管线会把块内的 link / @mention / #hashtag 换成 `<<__LINK_n__>>`
 * （n 为该块内第 n 个非文本 run，从 0 起），这里按原 run 顺序还原为可点击元素。
 * 文本片段原样输出，空格与标点不做处理。
 */
const PLACEHOLDER_SPLIT_RE = /(<<__LINK_\d+__>>)/g
const PLACEHOLDER_KEY_RE = /^<<__LINK_(\d+)__>>$/

function hrefOf(run: ArticleRun): string {
  if (run.type === 'link')
    return run.url
  if (run.type === 'mention' || run.type === 'hashtag')
    return run.href
  return ''
}

export function ArticleTranslatedText({ translation, runs }: {
  translation: string
  runs: ArticleRun[]
}) {
  const anchors = runs.filter(run => run.type !== 'text')

  return (
    <>
      {translation.split(PLACEHOLDER_SPLIT_RE).map((part, index) => {
        const match = PLACEHOLDER_KEY_RE.exec(part)
        if (!match)
          return <Fragment key={index}>{part}</Fragment>

        const run = anchors[Number(match[1])]
        if (!run)
          return null
        return <TweetLink key={index} href={hrefOf(run)}>{run.text}</TweetLink>
      })}
    </>
  )
}
