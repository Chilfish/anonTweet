import type { Route } from './+types/get'
import { screenshotTweet } from '~/lib/browser'
import { extractTweetId } from '~/lib/utils'

export async function loader({
  params,
}: Route.LoaderArgs) {
  const { id } = params
  const tweetId = extractTweetId(id)
  if (!tweetId) {
    return []
  }

  const pngBuffer = await screenshotTweet(tweetId)
  const pngStream = new ReadableStream({
    start(controller) {
      controller.enqueue(pngBuffer)
      controller.close()
    },
  })

  return new Response(pngStream, {
    headers: {
      'Content-Type': 'image/png',
    },
  })
}
