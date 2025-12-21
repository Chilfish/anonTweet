import type { Route } from './+types/set'
import { data } from 'react-router'
import { updateEntities } from '~/lib/service/setTweet'
import { tweetSchema } from '~/lib/validations/tweet'

export async function action({ request }: Route.ActionArgs) {
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
    case 'updateEntities':
      const entities = submission.data.data
      await Promise.all((entities).map(async data => updateEntities({
        tweetId: data.tweetId,
        entities: data.entities,
      })))
      break
  }

  return data({
    success: true,
    message: 'Entities updated successfully',
  })
}
