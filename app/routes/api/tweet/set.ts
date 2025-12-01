import type { Route } from './+types/set'
import { and, eq } from 'drizzle-orm'
import { data } from 'react-router'
import { isAnonUser } from '~/lib/config'
import { db } from '~/lib/database/db.server'
import { tweetEntities } from '~/lib/database/schema'
import { tweetSchema } from '~/lib/validations/tweet'
import { requireAuth, requireUser } from '~/middlewares/auth-guard'

export const middleware = [requireAuth]

export async function action({ request, context }: Route.ActionArgs) {
  const { user } = requireUser()
  if (isAnonUser(user)) {
    return data({
      success: false,
      error: 'Unauthorized',
      status: 401,
      message: 'You must be logged in to perform this action.',
    })
  }

  const jsonData = await request.json()
  const submission = tweetSchema.safeParse(jsonData)

  if (!submission.success) {
    return data({
      success: false,
      error: 'Invalid request',
      status: 400,
      message: 'Invalid request data',
    })
  }

  switch (submission.data.intent) {
    // case 'create':
    //   const enrichedTweet = JSON.parse(submission.value.tweet) as EnrichedTweet
    //   await db.insert(tweet).values({
    //     tweetId: enrichedTweet.id_str,
    //     tweetOwnerId: enrichedTweet.user.screen_name,
    //     jsonContent: enrichedTweet,
    //   })
    //   break
    // case 'update':
    //   const enrichedTweets = JSON.parse(submission.value.tweet) as EnrichedTweet[]
    //   await Promise.all((enrichedTweets).map(async _tweet =>
    //     await db
    //       .update(tweet)
    //       .set({
    //         jsonContent: _tweet,
    //       })
    //       .where(
    //         eq(tweet.tweetId, _tweet.id_str),
    //       ),
    //   ))
    //   break
    case 'updateEntities':
      const entities = submission.data.data
      await Promise.all((entities).map(async (data) => {
        const tweetUserId = `${data.tweetId}-${user.id}`
        await db
          .insert(tweetEntities)
          .values({
            entities: data.entities,
            tweetUserId,
            translatedBy: user.id,
          })
          .onConflictDoUpdate({
            target: tweetEntities.tweetUserId,
            targetWhere: and(
              eq(tweetEntities.tweetUserId, tweetUserId),
              eq(tweetEntities.translatedBy, user.id),
            ),
            set: { entities: data.entities },
          })
      }))
      break
  }

  return data({
    success: true,
    message: 'Entities updated successfully',
  })
}
