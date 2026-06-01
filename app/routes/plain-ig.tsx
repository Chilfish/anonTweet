import type { DirectoryMsg, Message, ParsedMedia, ParsedPost, UrlMsg } from '@chilfish/gallery-dl-instagram'
import type { Route } from './+types/ins'
import type { IGMedia, IGPostData } from '~/types'
import { createSDK } from '@chilfish/gallery-dl-instagram/node'
import { Await, useLoaderData } from 'react-router'
import { PlainIGPost } from '~/components/ins/PlainIGPost'
import { env } from '~/lib/env.server'
import { extractIGId } from '~/lib/utils'

export async function loader({ params }: Route.LoaderArgs): Promise<{
  post: IGPostData | null
  igId: string | null
}> {
  const { id } = params
  const igId = extractIGId(id ?? '') ?? id ?? null

  if (!igId || !env.INS_COOKIES) {
    return { post: null, igId }
  }

  const postUrl = igId.includes('/')
    ? `https://www.instagram.com/stories/${igId.split('/')[0]}/${igId.split('/')[1]}/`
    : `https://www.instagram.com/p/${igId}/`

  try {
    const ig = await createSDK({ cookies: env.INS_COOKIES })
    const messages: Message[] = []
    for await (const msg of ig.extract(postUrl)) {
      messages.push(msg)
    }

    const dir = messages.find(m => m.type === 'directory') as DirectoryMsg | undefined
    if (!dir)
      return { post: null, igId }

    const meta = dir.metadata as unknown as ParsedPost
    const urlMsgs = messages.filter(m => m.type === 'url') as unknown as UrlMsg[]

    const post: IGPostData = [{
      id: meta.post_shortcode,
      post_id: meta.post_id,
      url: meta.post_url,
      username: meta.username,
      fullname: meta.fullname,
      description: meta.description,
      tags: meta.tags,
      likes: meta.likes,
      type: meta.type,
      media: urlMsgs.map((msg, i) => {
        const m = msg.metadata as unknown as ParsedMedia
        return {
          num: m.num ?? i,
          media_id: m.media_id,
          display_url: m.display_url,
          video_url: m.video_url,
          width: m.width,
          height: m.height,
          width_original: m.width_original,
          height_original: m.height_original,
          type: (m.video_url ? 'video' : 'photo') as IGMedia['type'],
        }
      }),
    }]

    return { post, igId }
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
        {resolved => (resolved.post?.[0]
          ? <PlainIGPost post={resolved.post[0]} />
          : <IGNotFound id={resolved.igId ?? undefined} />)}
      </Await>
    </div>
  )
}
