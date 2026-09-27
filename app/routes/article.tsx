import type { Route } from './+types/article'
import type { ArticleBlock, EnrichedTweet } from '~/types'
import { useRef } from 'react'
import { ArticleBody, ArticleEmbeddedTweet, ArticleImage, ArticleToolbar } from '~/components/article'
import { Separator } from '~/components/ui/separator'
import { useAutoTranslateArticle } from '~/hooks/use-auto-translate-article'
import { collectEmbeddedTweetIds } from '~/lib/article'
import { TweetNotFound } from '~/lib/react-tweet'
import { isArticleUrl } from '~/lib/react-tweet/utils/article'
import { formatDate } from '~/lib/react-tweet/utils/date-utils'
import { getTweets } from '~/lib/service/getTweet'
import { getArticleTranslation, getLocalTweet } from '~/lib/service/getTweet.server'
import {
  useArticleTranslation,
  useTranslationActions,
  useTweetMode,
} from '~/lib/stores/hooks'
import { extractTweetId } from '~/lib/utils'

/** 并行取回文章内嵌的推文（走缓存链；单条失败降级为 null → 渲染层回退链接卡） */
async function loadEmbeddedTweets(blocks: ArticleBlock[]): Promise<Record<string, EnrichedTweet | null>> {
  const ids = collectEmbeddedTweetIds(blocks)
  const entries = await Promise.all(ids.map(async (embedId) => {
    try {
      const tweets = await getTweets(embedId, getLocalTweet)
      return [embedId, tweets.find(t => t.id_str === embedId) ?? tweets[0] ?? null] as const
    }
    catch {
      return [embedId, null] as const
    }
  }))
  return Object.fromEntries(entries)
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const tweetId = extractTweetId(params.id)
  const baseUrl = new URL(request.url).origin

  if (!tweetId) {
    return { tweet: null, tweetId: null, baseUrl, translation: null, embeds: {} as Record<string, EnrichedTweet | null> }
  }

  try {
    const [tweets, translation] = await Promise.all([
      getTweets(tweetId, getLocalTweet),
      getArticleTranslation(tweetId),
    ])
    const tweet = tweets.find(t => t.id_str === tweetId) ?? tweets[0] ?? null
    const embeds = tweet?.article?.blocks ? await loadEmbeddedTweets(tweet.article.blocks) : {}
    return { tweet, tweetId, baseUrl, translation, embeds }
  }
  catch {
    return { tweet: null, tweetId, baseUrl, translation: null, embeds: {} as Record<string, EnrichedTweet | null> }
  }
}

export function meta({ loaderData }: Route.MetaArgs) {
  const tweet = loaderData?.tweet
  const article = tweet?.article
  const baseUrl = loaderData?.baseUrl || 'https://anontweet.chilfish.top'

  const title = article?.title || 'X 长文'
  const description = article?.previewText || ''
  const canonicalUrl = loaderData?.tweetId ? `${baseUrl}/article/${loaderData.tweetId}` : baseUrl

  const tags = [
    { title: `${title} | Anon Tweet` },
    { name: 'description', content: description },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:type', content: 'article' },
    { property: 'og:url', content: canonicalUrl },
    { name: 'twitter:card', content: article?.coverImage ? 'summary_large_image' : 'summary' },
    { tagName: 'link', rel: 'canonical', href: canonicalUrl },
  ]

  if (article?.coverImage?.url) {
    tags.push({ property: 'og:image', content: article.coverImage.url })
    tags.push({ name: 'twitter:image', content: article.coverImage.url })
  }

  return tags
}

/** 推文正文是否只有一条文章链接（这类推文不重复展示正文） */
function isArticleOnlyText(tweet: NonNullable<Route.ComponentProps['loaderData']['tweet']>): boolean {
  const entities = tweet.entities ?? []
  return entities.length > 0 && entities.every(entity => entity.type === 'url' && isArticleUrl(entity.href))
}

export default function ArticlePage({ loaderData }: Route.ComponentProps) {
  const { tweet, tweetId, translation: persisted, embeds } = loaderData
  const article = tweet?.article
  const id = tweetId ?? ''
  const articleRef = useRef<HTMLDivElement>(null)

  const mode = useTweetMode(id)
  const stored = useArticleTranslation(id)
  const { setTweetTranslationMode } = useTranslationActions()

  const { status, translate } = useAutoTranslateArticle(
    article ?? undefined,
    tweetId ?? undefined,
    persisted,
  )

  if (!tweet || !article || !tweetId) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <TweetNotFound tweetId={tweetId ?? undefined} />
      </div>
    )
  }

  const translation = stored ?? persisted ?? undefined
  const translatedTitle = translation?.title
  const showTranslatedTitle = Boolean(translatedTitle) && mode !== 'original'

  const publishTime = article.publishedAt ?? tweet.created_at
  const showCommentary = tweet.text?.trim() && !isArticleOnlyText(tweet)

  // 内嵌推文：取到数据即用真实推文组件渲染；未取到（删除/受限/失败）回退链接卡
  const renderEmbed = (embedId: string) => {
    const embedded = embeds?.[embedId]
    return embedded ? <ArticleEmbeddedTweet tweet={embedded} /> : undefined
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-0 py-6">
      <ArticleToolbar
        tweetId={tweetId}
        article={article}
        tweet={tweet}
        captureRef={articleRef}
        mode={mode}
        onModeChange={next => setTweetTranslationMode(tweetId, next)}
        status={status}
        hasTranslation={Boolean(translation)}
        onRetry={() => void translate(true)}
      />

      <article ref={articleRef} className="rounded-2xl border border-border/60 bg-card p-4 sm:p-6">
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
                translations={translation?.blocks}
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
    </div>
  )
}
