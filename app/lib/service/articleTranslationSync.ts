import type { ArticleTranslation } from '~/lib/article/translate'
import axios from 'axios'

/**
 * 持久化文章按块译文（best-effort，失败只告警）。
 *
 * 与推文实体翻译分开存储：`tweet.jsonContent` 会被整条上游结果 upsert 覆盖，
 * 翻译不能塞进 jsonContent（详见 `getTweet.server.ts` 的 article 翻译读写）。
 */
export async function syncArticleTranslation(tweetId: string, translation: ArticleTranslation) {
  try {
    await axios.post('/api/tweet/set', {
      data: [{ tweetId, translation }],
      intent: 'updateArticleTranslations',
    })
  }
  catch (error) {
    console.warn('[ArticleTrans] failed to persist translation:', error)
  }
}
