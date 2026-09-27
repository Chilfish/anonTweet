import { mkdir, writeFile } from 'node:fs/promises'
import { twitterPool } from '~/lib/react-tweet/utils/get-tweet'
import { ResourceType } from '~/lib/rettiwt-api'

const ids = process.argv.slice(2)

await mkdir('test/fixtures/articles', { recursive: true })

for (const id of ids) {
  const response = await twitterPool.run(async fetcher =>
    fetcher.request<any>(ResourceType.TWEET_DETAILS, { id }),
  )
  const result = response.data.tweetResult.result
  const article = result.article

  await writeFile(`test/fixtures/articles/${id}.json`, JSON.stringify(article, null, 2), 'utf8')

  console.log('=====', id)
  console.log('article keys:', article ? Object.keys(article) : article)
  const r = article?.article_results?.result
  console.log('result keys:', r ? Object.keys(r) : r)
  console.log('content_state keys:', r?.content_state ? Object.keys(r.content_state) : r?.content_state)
  console.log('blocks:', r?.content_state?.blocks?.length, '| media_entities:', r?.media_entities ? Object.keys(r.media_entities).length : r?.media_entities)
  console.log('block types:', [...new Set((r?.content_state?.blocks ?? []).map((b: any) => b.type))].join(','))
  console.log('entity types:', JSON.stringify(
    (r?.content_state?.entityMap ?? r?.content_state?.entities ?? []).map((e: any) => e?.value?.type ?? e?.type),
  ))
  console.log('cover_media:', JSON.stringify(r?.cover_media ?? article?.cover_media)?.slice(0, 400))
}
