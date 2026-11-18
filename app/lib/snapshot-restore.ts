import type { IgSnapshot, TweetSnapshot } from '~/lib/storage/db'
import type { VisitedType } from '~/lib/visited'
import type { IGPostData } from '~/types'
import { isSnapshotFresh, snapshotKey } from '~/lib/snapshot'
import { getSnapshot } from '~/lib/storage/snapshots'
import { useTranslationStore } from '~/lib/stores/translation'

/** 读取未过期的详情快照；过期视为未命中，由调用方重新请求 */
export async function loadFreshTweetSnapshot(
  id: string,
  type: Extract<VisitedType, 'tweet' | 'article'> = 'tweet',
): Promise<TweetSnapshot | null> {
  const snapshot = await getSnapshot<TweetSnapshot>(snapshotKey(type, id))
  if (!snapshot || !snapshot.tweets?.length || !isSnapshotFresh(snapshot))
    return null
  return snapshot
}

export async function loadFreshIgSnapshot(id: string): Promise<IGPostData | null> {
  const snapshot = await getSnapshot<IgSnapshot>(snapshotKey('ig', id))
  if (!snapshot || !snapshot.posts?.length || !isSnapshotFresh(snapshot))
    return null
  return snapshot.posts
}

/**
 * 把快照灌回全局 store。
 *
 * 先 `setAllTweets`（同时按 entities 重建译文），再用快照里的 `translations`
 * 覆盖——后者保存的是手动编辑 / AI 翻译后的 store 版本，比 entities 更新。
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
}
