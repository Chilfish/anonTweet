import type { TranslationEntity } from '~/lib/react-tweet'
import { and, eq } from 'drizzle-orm'
import { getDbClient } from '~/lib/database/db.server'
import { tweetEntities } from '~/lib/database/schema'

export async function updateEntities({ userId, entities, tweetId}: {
  tweetId: string
  userId: string
  entities: TranslationEntity[]
}) {
  const db = getDbClient()

  const tweetUserId = `${tweetId}-${userId}`
  await db
    .insert(tweetEntities)
    .values({
      entities,
      tweetUserId,
      translatedBy: userId,
    })
    .onConflictDoUpdate({
      target: tweetEntities.tweetUserId,
      targetWhere: and(
        eq(tweetEntities.tweetUserId, tweetUserId),
        eq(tweetEntities.translatedBy, userId),
      ),
      set: { entities },
    })
}
