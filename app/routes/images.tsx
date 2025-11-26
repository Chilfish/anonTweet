import type { Route } from './+types/images'
import { s3Client } from '~/lib/s3Storage'

export async function loader({ params, context }: Route.LoaderArgs) {
  const key = params['*']
  const object = await s3Client.getStreamingBlob(key)
  if (!object.Body) {
    return new Response(null, { status: 404 })
  }

  const stream = object.Body.transformToWebStream()
  return new Response(stream, {
    headers: {
      'Content-Type': object.ContentType || 'application/png',
    },
  })
}
