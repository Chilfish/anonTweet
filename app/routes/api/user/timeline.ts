import type { Route } from './+types/get'
import { data } from 'react-router'

export async function loader({
  params,
}: Route.LoaderArgs) {
  return data({
    error: 'Rate limit exceeded',
    message: '建议在使用RSS轮询的时候，使用自己部署的实例，并用自己的key。请参考项目文档：https://github.com/Chilfish/anonTweet/',
  }, {
    status: 429,
  })

  // const { username } = params

  // const user = await getDBUser(username)

  // if (!user?.id) {
  //   return []
  // }

  // return await getEnrichedUserTweet(user.id)
}
