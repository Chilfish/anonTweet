import { QuoteIcon } from 'lucide-react'

/** 文章内嵌帖子：紧凑链接卡（不额外打上游取原文） */
export function ArticleEmbedTweet({ tweetId }: { tweetId: string }) {
  const url = `https://x.com/i/status/${tweetId}`

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="my-3 flex items-center gap-2 rounded-xl border border-border/60 px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted/40"
    >
      <QuoteIcon className="size-4 shrink-0 text-primary" />
      <span className="truncate">嵌入的帖子</span>
      <span className="ml-auto shrink-0 text-xs text-primary">在 X 查看 →</span>
    </a>
  )
}
