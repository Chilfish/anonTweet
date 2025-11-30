import type { Route } from './+types/set'
import type { EnrichedTweet } from '~/lib/react-tweet'
import { parseWithZod } from '@conform-to/zod'
import { eq } from 'drizzle-orm'
import { data } from 'react-router'
import { db } from '~/lib/database/db.server'
import { tweet } from '~/lib/database/schema'
import { tweetSchema } from '~/lib/validations/tweet'

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData()
  const submission = parseWithZod(formData, { schema: tweetSchema })

  if (submission.status !== 'success') {
    return data(submission.reply(), { status: 400 })
  }
  const enrichedTweet = JSON.parse(submission.value.tweet)

  switch (submission.value.intent) {
    case 'create':
      await db.insert(tweet).values({
        tweetId: enrichedTweet.id_str,
        tweetOwnerId: enrichedTweet.user.screen_name,
        jsonContent: enrichedTweet,
      })
      break
    case 'update':
      await Promise.all((enrichedTweet as EnrichedTweet[]).map(async _tweet =>
        await db
          .update(tweet)
          .set({
            jsonContent: _tweet,
          })
          .where(
            eq(tweet.tweetId, _tweet.id_str),
          ),
      ))
      break
  }

  return data(submission.reply({ resetForm: true }))
}
