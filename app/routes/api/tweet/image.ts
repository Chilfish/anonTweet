import type { Route } from './+types/get'
import { screenshotTweet } from '~/lib/browser'
import { extractTweetId } from '~/lib/utils'

export async function loader({
  params,
  request,
}: Route.LoaderArgs) {
  const { id } = params
  const tweetId = extractTweetId(id)
  if (!tweetId) {
    return []
  }

  const translation = new URL(request.url).searchParams.get('translation') === 'true'
  const pngBuffer = await screenshotTweet(tweetId, translation)
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
