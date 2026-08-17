import type { Route } from './+types/set'
import type { EnrichedTweet } from '~/types'
import { data } from 'react-router'
import { getLocalCache, setLocalCache } from '~/lib/localCache'
import { mergeTranslationEntities } from '~/lib/service/getTweet.server'
import { updateEntities } from '~/lib/service/setTweet'
import { tweetSchema } from '~/lib/validations/tweet'

export async function action({ request }: Route.ActionArgs) {
  const jsonData = await request.json()
  const submission = tweetSchema.safeParse(jsonData)

  if (!submission.success) {
    return data({
      success: false,
      error: 'Invalid request',
      status: 400,
      message: 'Invalid request data',
    })
  }

  switch (submission.data.intent) {
    case 'updateEntities':
      const entities = submission.data.data
      await Promise.all((entities).map(async data => updateEntities({
        tweetId: data.tweetId,
        entities: data.entities,
      })))
      // 同步刷新 localCache，避免同步后刷新页面仍读到旧缓存（缺失句首补充等新翻译）
      await Promise.all((entities).map(async (data) => {
        try {
          const cached = await getLocalCache<EnrichedTweet | null>({
            id: data.tweetId,
            type: 'tweet',
            getter: async () => null,
          })
          if (cached) {
            mergeTranslationEntities(cached, data.entities)
            await setLocalCache({ id: data.tweetId, type: 'tweet', value: cached })
          }
        }
        catch {
          // localCache 刷新 best-effort，不阻断保存
        }
      }))
      break
  }

  return data({
    success: true,
    message: 'Entities updated successfully',
  })
}
