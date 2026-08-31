import type { Route } from './+types/timeline'
import { data } from 'react-router'
import { env } from '~/lib/env.server'
import { getEnrichedUserTweet } from '~/lib/react-tweet/utils/get-tweet'
import { getDBUser } from '~/lib/service/getUser.server'

/**
 * 用户时间线接口：功能开关 `ENABLE_TIMELINE` 控制（默认关闭）。
 *
 * - 关闭（默认）：固定返回 429，防止对上游接口的滥用；建议使用自部署实例 + 自己的 Key。
 * - 开启（`ENABLE_TIMELINE=true`）：查询用户资料（DB 缓存 → API）后拉取该用户的时间线推文，
 *   经 `enrichTweet` 清洗返回 EnrichedTweet 数组。
 */
export async function loader({
  params,
}: Route.LoaderArgs) {
  if (!env.ENABLE_TIMELINE) {
    return data({
      error: 'Not enabled',
      message: '用户时间线接口默认关闭（ENABLE_TIMELINE）。建议在使用 RSS 轮询的时候，使用自己部署的实例，并在 .env 设置 ENABLE_TIMELINE=true 与自己的 Key。请参考项目文档：https://github.com/Chilfish/anonTweet/',
    }, {
      status: 429,
    })
  }

  const { username } = params

  try {
    const user = await getDBUser(username)

    if (!user?.id) {
      return []
    }

    return await getEnrichedUserTweet(user.id)
  }
  catch (error: unknown) {
    console.error(`Error fetching user timeline for ${username}:`, error)
    return data({
      error: 'Failed to fetch user timeline',
      message: error instanceof Error ? error.message : String(error),
    }, {
      status: 500,
    })
  }
}
