import type { TranslationEntity } from '~/types'
import { and, eq } from 'drizzle-orm'
import { getDbClient } from '~/lib/database/db.server'
import { tweetEntities } from '~/lib/database/schema'

export async function updateEntities({ entities, tweetId}: {
  tweetId: string
  entities: TranslationEntity[]
}) {
  const db = getDbClient()

  await db
    .insert(tweetEntities)
    .values({
      entities,
      tweetId,
    })
    .onConflictDoUpdate({
      target: tweetEntities.tweetId,
      targetWhere: and(
        eq(tweetEntities.tweetId, tweetId),
      ),
      set: { entities },
    })
}
