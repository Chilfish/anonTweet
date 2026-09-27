import type { ReactNode, Ref } from 'react'
import type { ArticleViewMode } from './ArticleBody'
import type { EnrichedTweet, TweetArticle } from '~/types'
import { Separator } from '~/components/ui/separator'
import { isArticleUrl } from '~/lib/react-tweet/utils/article'
import { formatDate } from '~/lib/react-tweet/utils/date-utils'
import { cn } from '~/lib/utils'
import { ArticleBody } from './ArticleBody'
import { ArticleImage } from './ArticleImage'

/** 推文正文是否只有一条文章链接（这类推文不重复展示正文） */
function isArticleOnlyText(tweet: EnrichedTweet): boolean {
  const entities = tweet.entities ?? []
  return entities.length > 0 && entities.every(entity => entity.type === 'url' && isArticleUrl(entity.href))
}

interface ArticleReaderProps {
  tweet: EnrichedTweet
  article: TweetArticle
  mode?: ArticleViewMode
  /** 按块 key 索引的译文（供正文三态） */
  translations?: Record<string, string>
  /** 标题译文（与正文译文分开存储） */
  translatedTitle?: string
  /** 内嵌推文渲染注入（见 `ArticleBody.renderEmbed`） */
  renderEmbed?: (tweetId: string) => ReactNode
  /** 截图捕获节点 */
  captureRef?: Ref<HTMLDivElement>
  className?: string
}

/**
 * 文章全文卡片：标题 + 作者行 + 推文附言 + 封面 + 块文档正文。
 *
 * 纯展示（无状态、无 store），从 `/article/:id` 阅读页抽出以便在 Storybook 覆盖
 * 「各种形态」：rich / markdown / plain 兜底 / 内嵌推文（真实/回退）/ 三态译文 /
 * 封面有无 / 附言有无。工具栏与数据取数仍由路由负责。
 */
export function ArticleReader({
  tweet,
  article,
  mode = 'original',
  translations,
  translatedTitle,
  renderEmbed,
  captureRef,
  className,
}: ArticleReaderProps) {
  const showTranslatedTitle = Boolean(translatedTitle) && mode !== 'original'
  const publishTime = article.publishedAt ?? tweet.created_at
  const showCommentary = Boolean(tweet.text?.trim()) && !isArticleOnlyText(tweet)

  return (
    <article
      ref={captureRef}
      className={cn('rounded-2xl border border-border/60 bg-card p-4 sm:p-6', className)}
    >
      <header className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold leading-tight text-foreground">
            {mode === 'translation' && translatedTitle ? translatedTitle : article.title || 'X 长文'}
          </h1>
          {mode === 'bilingual' && showTranslatedTitle && (
            <p className="mt-2 border-l-2 border-border/70 pl-2.5 text-lg font-semibold text-muted-foreground">
              {translatedTitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {tweet.user?.profile_image_url_https && (
            <img
              src={tweet.user.profile_image_url_https}
              alt={tweet.user.name}
              className="size-10 shrink-0 rounded-full object-cover"
              loading="lazy"
            />
          )}
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-foreground">{tweet.user?.name}</div>
            <div className="truncate text-xs text-muted-foreground">
              @
              {tweet.user?.screen_name}
              {' · '}
              {formatDate(publishTime, 'yyyy年MM月dd日')}
            </div>
          </div>
          <a
            href={`https://x.com/i/article/${article.id}`}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="ml-auto shrink-0 text-xs font-medium text-primary hover:underline"
          >
            在 X 查看 →
          </a>
        </div>

        {showCommentary && (
          <p className="text-[15px] leading-7 whitespace-pre-wrap text-foreground/80">{tweet.text}</p>
        )}

        {article.coverImage && <ArticleImage media={article.coverImage} />}
      </header>

      <Separator className="my-6" />

      {article.blocks?.length
        ? (
            <ArticleBody
              blocks={article.blocks}
              translations={translations}
              mode={mode}
              renderEmbed={renderEmbed}
            />
          )
        : (
            <p className="text-[15px] leading-7 whitespace-pre-wrap text-foreground/90">
              {article.plainText ?? article.previewText ?? ''}
            </p>
          )}
    </article>
  )
}
