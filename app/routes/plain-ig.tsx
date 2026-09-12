import type { Message } from '@chilfish/gallery-dl-instagram'
import type { Route } from './+types/ins'
import type { IGPostData } from '~/types'
import { createSDK } from '@chilfish/gallery-dl-instagram/node'
import { Await, useLoaderData } from 'react-router'
import { PlainIGPost } from '~/components/ins/PlainIGPost'
import { env } from '~/lib/env.server'
import { normalizeIGPosts } from '~/lib/ig/normalizeIGPost'
import { extractIGId, igIdToSourceUrl } from '~/lib/url-detect'

export async function loader({ params }: Route.LoaderArgs): Promise<{
  post: IGPostData | null
  igId: string | null
}> {
  const { id } = params
  const igId = extractIGId(id ?? '') ?? id ?? null

  if (!igId || !env.INS_COOKIES) {
    return { post: null, igId }
  }

  try {
    const ig = await createSDK({ cookies: env.INS_COOKIES })
    const messages: Message[] = []
    for await (const msg of ig.extract(igIdToSourceUrl(igId))) {
      messages.push(msg)
    }

    const posts = normalizeIGPosts(messages)
    return { post: posts.length ? posts : null, igId }
  }
  catch (error) {
    console.error(`[plain-ig] Failed:`, error)
    return { post: null, igId }
  }
}

function IGNotFound({ id }: { id?: string }) {
  return (
    <div className="flex items-center justify-center min-h-32 text-muted-foreground">
      <p>
        未找到 Instagram 帖子:
        {id || '—'}
      </p>
    </div>
  )
}

export default function PlainIGPage() {
  const loaderData = useLoaderData<typeof loader>()

  return (
    <div id="main-container" className="max-w-fit max-h-fit min-w-125 bg-background">
      <Await resolve={loaderData} errorElement={<IGNotFound />}>
        {resolved => (resolved.post?.length
          ? (
              <div className="flex flex-col gap-4">
                {resolved.post.map(post => (
                  <PlainIGPost key={post.id} post={post} />
                ))}
              </div>
            )
          : <IGNotFound id={resolved.igId ?? undefined} />)}
      </Await>
    </div>
  )
}
