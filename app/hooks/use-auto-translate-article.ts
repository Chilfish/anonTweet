import type { ArticleTranslation } from '~/lib/article/translate'
import type { TweetArticle } from '~/types'
import { useCallback, useEffect, useRef } from 'react'
import { fetcher } from '~/lib/fetcher'
import { syncArticleTranslation } from '~/lib/service/articleTranslationSync'
import { useAppConfigStore } from '~/lib/stores/appConfig'
import {
  useArticleTranslation,
  useArticleTranslationStatus,
  useResolvedAIConfig,
  useTranslationActions,
} from '~/lib/stores/hooks'

interface ArticleTranslationResponse {
  success: boolean
  data?: {
    articleId: string
    translation: ArticleTranslation
  }
}

/**
 * 文章页按块翻译。
 *
 * - 自动触发：AI 翻译开启且当前文章尚无译文时，进入页面翻译一次（每篇一次）。
 * - 手动触发：返回的 `translate(true)` 供「重试翻译」按钮强制重翻。
 *
 * `existing` 为 loader 回填的已持久化译文：有它即跳过翻译（不重复写库），
 * 同时种入 store 供三态开关与后续会话复用。
 */
export function useAutoTranslateArticle(
  article: TweetArticle | undefined,
  tweetId: string | undefined,
  existing?: ArticleTranslation | null,
) {
  const enableAITranslation = useAppConfigStore(s => s.enableAITranslation)
  const translationGlossary = useAppConfigStore(s => s.translationGlossary)
  const ai = useResolvedAIConfig()
  const translation = useArticleTranslation(tweetId ?? '')
  const status = useArticleTranslationStatus(tweetId ?? '')
  const { setArticleTranslation, setArticleTranslationStatus } = useTranslationActions()
  const firedForRef = useRef<string | null>(null)

  // loader 已带回持久化译文时种入 store，避免首屏后再次请求上游
  useEffect(() => {
    if (existing && tweetId && !translation)
      setArticleTranslation(tweetId, existing)
  }, [existing, tweetId, translation, setArticleTranslation])

  const translate = useCallback(async (force = false) => {
    if (!article || !tweetId)
      return
    if (!ai.apiKey || !ai.model)
      return
    if (!force && (translation || existing || status === 'loading' || status === 'done'))
      return

    setArticleTranslationStatus(tweetId, 'loading')
    try {
      const res = await fetcher.post<ArticleTranslationResponse>('/api/ai-translation', {
        type: 'article',
        article,
        apiKey: ai.apiKey,
        model: ai.model,
        provider: ai.provider,
        baseUrl: ai.baseUrl,
        thinkingLevel: ai.thinkingLevel,
        translationGlossary,
      })
      const next = res.data?.data?.translation
      if (next && (next.title || Object.keys(next.blocks ?? {}).length > 0)) {
        setArticleTranslation(tweetId, next)
        setArticleTranslationStatus(tweetId, 'done')
        void syncArticleTranslation(tweetId, next)
      }
      else {
        setArticleTranslationStatus(tweetId, 'error')
      }
    }
    catch (error) {
      console.warn('[ArticleTrans] translate failed:', error)
      setArticleTranslationStatus(tweetId, 'error')
    }
  }, [
    article,
    tweetId,
    ai.apiKey,
    ai.model,
    ai.provider,
    ai.baseUrl,
    ai.thinkingLevel,
    translation,
    existing,
    status,
    translationGlossary,
    setArticleTranslation,
    setArticleTranslationStatus,
  ])

  useEffect(() => {
    if (!enableAITranslation || !ai.apiKey || !ai.model)
      return
    if (!article?.blocks?.length && !article?.title)
      return
    if (translation || existing || status === 'loading' || status === 'done')
      return
    if (!tweetId || firedForRef.current === tweetId)
      return

    firedForRef.current = tweetId
    void translate()
  }, [article, tweetId, enableAITranslation, ai.apiKey, ai.model, translation, existing, status, translate])

  return { status, translate }
}
