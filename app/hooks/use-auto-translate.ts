import type { EnrichedTweet } from '~/types'
import { useEffect, useRef } from 'react'
import { fetcher } from '~/lib/fetcher'
import { useAIConfig, useResolvedAIConfig, useTranslationActions } from '~/lib/stores/hooks'
import { useTranslationDictionaryStore } from '~/lib/stores/TranslationDictionary'

/**
 * GET 解耦后的客户端自动翻译（阶段二任务 1 / AC-DECOUPLE-001）：
 *
 * GET `/api/tweet/get` 只返回缓存/原文，不再内联 AI 翻译（review P1-2 首屏阻塞）。
 * 本 hook 在推文数据就绪后，若开启 AI 翻译且存在未翻译推文，逐个调用
 * `/api/ai-translation`（服务端有 `AbortSignal.timeout` 兜底，AC-DECOUPLE-002），
 * 结果经 `updateTweet` 合并回 store——首屏先渲染原文，翻译就绪再注入，不阻塞。
 *
 * 语义对齐旧 GET 内联逻辑：
 * - 已翻译（entities[].aiTranslation / autoTranslationEntities）与中文推文跳过；
 * - 每个推文与其嵌套 quoted tweet 都会尝试翻译（按 id 去重，避免重复调用）。
 */
export function useAutoTranslateTweets(tweets: EnrichedTweet[] | undefined) {
  const { enableAITranslation, translationGlossary } = useAIConfig()
  const aiConfig = useResolvedAIConfig()
  const dictEntries = useTranslationDictionaryStore(state => state.getFormattedEntries)
  const { updateTweet } = useTranslationActions()
  const firedForRef = useRef<string | null>(null)

  useEffect(() => {
    if (!enableAITranslation || !tweets || tweets.length === 0)
      return

    const { apiKey, model } = aiConfig
    if (!apiKey || !model)
      return

    // 以首条推文 id 为锚点，同一数据只触发一轮（SWR 重验证等场景不重复翻译）
    const anchor = tweets[0]!.id_str
    if (firedForRef.current === anchor)
      return
    firedForRef.current = anchor

    const combinedGlossary = [dictEntries(), translationGlossary].filter(Boolean).join('\n')

    void (async () => {
      const chain = new Set<string>()
      for (const tweet of tweets) {
        await translateIfNeeded(tweet)
        const quoted = tweet.quotedTweet
        if (quoted && quoted.id_str && !chain.has(quoted.id_str)) {
          await translateIfNeeded(quoted)
        }
      }

      async function translateIfNeeded(tweet: EnrichedTweet) {
        if (chain.has(tweet.id_str))
          return
        chain.add(tweet.id_str)

        const isZhTweet = tweet.lang === 'zh'
        const hasTranslation = tweet.entities?.some(e => !!e.aiTranslation)
          || !!tweet.autoTranslationEntities?.length
        if (hasTranslation || isZhTweet)
          return

        try {
          const { data } = await fetcher.post('/api/ai-translation', {
            tweet,
            enableAITranslation: true,
            apiKey,
            model,
            provider: aiConfig.provider,
            baseUrl: aiConfig.baseUrl,
            thinkingLevel: aiConfig.thinkingLevel,
            translationGlossary: combinedGlossary,
          })

          if (data.success && data.data?.entities) {
            updateTweet(tweet.id_str, {
              entities: data.data.entities,
              autoTranslationEntities: undefined,
            })
          }
        }
        catch (error: unknown) {
          console.error(`[AutoTranslate] tweet ${tweet.id_str} failed`, error)
        }
      }
    })()
  }, [tweets, enableAITranslation, aiConfig, translationGlossary, dictEntries, updateTweet])
}
