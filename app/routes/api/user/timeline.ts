// import { fetchUserDetails, getEnrichedUserTweet } from '~/lib/react-tweet/utils/get-tweet'
import type { Route } from './+types/get'
// import { writeFile, readFile, stat, mkdir } from 'node:fs/promises'
// import type { IUser } from '~/lib/rettiwt-api'
import { data } from 'react-router'

// async function getUserDetails(username: string) {
//   const cacheFile = `data/cache/${username}.json`
//   try {
//     const isDirExists = await stat(cacheFile).then(() => true).catch(() => false)
//     if (!isDirExists) {
//       await mkdir('data/cache', { recursive: true })
//     }

//     const cachedData = await readFile(cacheFile, 'utf-8')
//     return JSON.parse(cachedData) as IUser
//   } catch (error) {
//     const user = await fetchUserDetails(username)
//     await writeFile(cacheFile, JSON.stringify(user))
//     return user
//   }
// }

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

  // try {
  //   const user = await getUserDetails(username)

  //   if (!user?.id) {
  //     return []
  //   }

  //   return await getEnrichedUserTweet(user.id)
  // } catch (error: any) {
  //   console.error(`Error fetching user details for ${username}: ${error}`)
  //   return data({
  //     error: 'User not found',
  //     message: `无法获取用户信息，${error.message}`,
  //   }, {
  //     status: error.status || 500
  //   })
  // }
}
