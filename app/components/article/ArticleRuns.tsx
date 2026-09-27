import type { ArticleRun } from '~/types'
import { TweetLink } from '~/lib/react-tweet/twitter-theme/tweet-link'
import { cn } from '~/lib/utils'

function runStyleClass(styles?: ArticleRun['styles']): string {
  return cn(
    styles?.includes('bold') && 'font-semibold text-foreground',
    styles?.includes('italic') && 'italic',
    styles?.includes('strikethrough') && 'line-through',
  )
}

/** 文章块的行内 run → 文本 / 链接 / @mention / #hashtag（真实元素，不用 dangerouslySetInnerHTML） */
export function ArticleRuns({ runs }: { runs: ArticleRun[] }) {
  return (
    <>
      {runs.map((run, index) => {
        if (run.type === 'text')
          return <span key={index} className={runStyleClass(run.styles)}>{run.text}</span>

        const href = run.type === 'link' ? run.url : run.href
        return (
          <TweetLink key={index} href={href} className={runStyleClass(run.styles)}>
            {run.text}
          </TweetLink>
        )
      })}
    </>
  )
}
