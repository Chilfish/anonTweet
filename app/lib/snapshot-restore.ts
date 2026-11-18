import type { IgSnapshot, TweetSnapshot } from '~/lib/storage/db'
import type { VisitedType } from '~/lib/visited'
import type { IGPostData } from '~/types'
import { snapshotKey } from '~/lib/snapshot'
import { getSnapshot } from '~/lib/storage/snapshots'
import { useTranslationStore } from '~/lib/stores/translation'

/**
 * 本地优先读取：命中即返回完整快照，不再按 24h TTL 拦截。
 * 快照在详情页每次访问、截图、保存翻译时都会刷新 `savedAt`。
 */
export async function loadTweetSnapshot(
  id: string,
  type: Extract<VisitedType, 'tweet' | 'article'> = 'tweet',
): Promise<TweetSnapshot | null> {
  const snapshot = await getSnapshot<TweetSnapshot>(snapshotKey(type, id))
  if (!snapshot || !snapshot.tweets?.length)
    return null
  return snapshot
}

export async function loadIgSnapshot(id: string): Promise<IGPostData | null> {
  const snapshot = await getSnapshot<IgSnapshot>(snapshotKey('ig', id))
  if (!snapshot || !snapshot.posts?.length)
    return null
  return snapshot.posts
}

/**
 * 把快照灌回全局 store。
 *
 * 先 `setAllTweets`（同时按 entities 重建译文），再用快照里的 `translations`
 * 覆盖——后者保存的是手动编辑 / AI 翻译后的 store 版本，比 entities 更新。
 * 评论 id 也一并恢复，避免快照里有评论但 UI 不知道它们是评论。
 */
export function restoreTweetSnapshot(snapshot: TweetSnapshot): void {
  if (!snapshot.tweets?.length)
    return

  const store = useTranslationStore.getState()
  store.setAllTweets(snapshot.tweets, snapshot.id)

  for (const [tweetId, entities] of Object.entries(snapshot.translations ?? {}))
    store.setTranslation(tweetId, entities)

  if (snapshot.articleTranslation)
    store.setArticleTranslation(snapshot.id, snapshot.articleTranslation)

  if (snapshot.commentIds)
    store.setCommentIds(snapshot.commentIds)
}
