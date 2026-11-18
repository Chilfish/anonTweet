import type { Route } from './+types/article'
import type { TweetSnapshot } from '~/lib/storage/db'
import type { ArticleBlock, EnrichedTweet } from '~/types'
import { useEffect, useMemo, useRef } from 'react'
import { ArticleEmbeddedTweet, ArticleReader, ArticleToolbar } from '~/components/article'
import { ArticlePageSkeleton } from '~/components/skeletons'
import { useAutoTranslateArticle } from '~/hooks/use-auto-translate-article'
import { usePersistSnapshot } from '~/hooks/use-persist-snapshot'
import { useRecordVisit } from '~/hooks/use-record-visit'
import { collectEmbeddedTweetIds } from '~/lib/article'
import { TweetNotFound } from '~/lib/react-tweet'
import { buildMeta, ogLocale } from '~/lib/seo'
import { getTweets } from '~/lib/service/getTweet'
import { getArticleTranslation, getLocalTweet } from '~/lib/service/getTweet.server'
import { snapshotKey } from '~/lib/snapshot'
import { loadTweetSnapshot } from '~/lib/snapshot-restore'
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
    catch (error: unknown) {
      console.warn(`[article] embedded tweet ${embedId} unavailable:`, error)
      return [embedId, null] as const
    }
  }))
  return Object.fromEntries(entries)
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const tweetId = extractTweetId(params.id)
  const baseUrl = new URL(request.url).origin

  if (!tweetId) {
    return {
      tweet: null,
      tweetId: null,
      baseUrl,
      translation: null,
      embeds: {} as Record<string, EnrichedTweet | null>,
    }
  }

  try {
    const [tweets, translation] = await Promise.all([
      getTweets(tweetId, getLocalTweet),
      getArticleTranslation(tweetId),
    ])
    const tweet = tweets.find(t => t.id_str === tweetId) ?? tweets[0] ?? null
    const embeds = tweet?.article?.blocks
      ? await loadEmbeddedTweets(tweet.article.blocks)
      : {}
    return {
      tweet,
      tweetId,
      baseUrl,
      translation,
      embeds,
    }
  }
  catch (error: unknown) {
    // 之前是裸 catch：线上文章页打不开时，日志里连 tweetId 都没有
    console.error(`[article] load ${tweetId} failed:`, error)
    return {
      tweet: null,
      tweetId,
      baseUrl,
      translation: null,
      embeds: {} as Record<string, EnrichedTweet | null>,
    }
  }
}

export async function clientLoader({
  params,
  serverLoader,
}: Route.ClientLoaderArgs) {
  const tweetId = extractTweetId(params.id)
  if (tweetId) {
    const snapshot = await loadTweetSnapshot(tweetId, 'article')
    if (snapshot) {
      return {
        tweet: snapshot.tweets[0] ?? null,
        tweetId,
        baseUrl: window.location.origin,
        translation: snapshot.articleTranslation ?? null,
        embeds: snapshot.embeds ?? {},
      }
    }
  }
  return serverLoader()
}

export function meta({ loaderData }: Route.MetaArgs) {
  const tweet = loaderData?.tweet
  const article = tweet?.article

  const title = article?.title || 'X 长文'
  const description = article?.previewText || '在 Anon Tweet 上阅读 X 长文原文与 AI 双语译文。'

  return buildMeta({
    title: `${title} | Anon Tweet`,
    description,
    type: 'article',
    locale: ogLocale(tweet?.lang),
    image: article?.coverImage?.url ?? null,
    baseUrl: loaderData?.baseUrl,
    noindex: true,
  })
}

export function HydrateFallback() {
  return <ArticlePageSkeleton />
}

export default function ArticlePage({ loaderData }: Route.ComponentProps) {
  const { tweet, tweetId, translation: persisted, embeds } = loaderData
  const article = tweet?.article
  const id = tweetId ?? ''
  const articleRef = useRef<HTMLDivElement>(null)

  const mode = useTweetMode(id)
  const stored = useArticleTranslation(id)
  const { setTweetTranslationMode, setArticleTranslation } = useTranslationActions()

  const { status, translate } = useAutoTranslateArticle(
    article ?? undefined,
    tweetId ?? undefined,
    persisted,
  )

  const translation = stored ?? persisted ?? undefined

  // loader 没带回译文时（DB 未配置 / 服务端缓存失效），用本地快照补位
  useEffect(() => {
    if (!tweetId || persisted)
      return
    let cancelled = false
    void loadTweetSnapshot(tweetId, 'article').then((snapshot) => {
      if (!cancelled && snapshot?.articleTranslation)
        setArticleTranslation(tweetId, snapshot.articleTranslation)
    })
    return () => {
      cancelled = true
    }
  }, [tweetId, persisted, setArticleTranslation])

  const snapshotRecord = useMemo<TweetSnapshot | null>(() => {
    if (!tweetId || !tweet)
      return null
    return {
      key: snapshotKey('article', tweetId),
      type: 'article',
      id: tweetId,
      tweets: [tweet],
      translations: {},
      articleTranslation: translation ?? null,
      embeds,
      savedAt: Date.now(),
    }
  }, [
    tweetId,
    tweet,
    translation,
    embeds,
  ])
  usePersistSnapshot(snapshotRecord)

  useRecordVisit(tweet && article && tweetId
    ? {
        type: 'article',
        id: tweetId,
        title: article.title || 'X 长文',
        snippet: article.previewText?.replace(/\s+/g, ' ').trim().slice(0, 90),
        image: article.coverImage?.url,
        author: tweet.user?.name,
        authorHandle: tweet.user?.screen_name,
      }
    : null)

  if (!tweet || !article || !tweetId) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <TweetNotFound tweetId={tweetId ?? undefined} />
      </div>
    )
  }

  // 内嵌推文：取到数据即用真实推文组件渲染；未取到（删除/受限/失败）回退链接卡
  const renderEmbed = (embedId: string) => {
    const embedded = embeds?.[embedId]
    return embedded
      ? <ArticleEmbeddedTweet tweet={embedded} />
      : undefined
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

      <ArticleReader
        tweet={tweet}
        article={article}
        mode={mode}
        translations={translation?.blocks}
        translatedTitle={translation?.title}
        renderEmbed={renderEmbed}
        captureRef={articleRef}
      />
    </div>
  )
}
