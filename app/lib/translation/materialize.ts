import type { EnrichedTweet, Entity } from '~/types'
import { mergeEntityTranslationsByIndex } from './resolveEntities'

/**
 * Create a view-model tweet whose entities include manual translations (overlay-style),
 * without mutating the original tweet object.
 *
 * Notes:
 * - Manual translations are expected to be index-aligned with the original entity structure.
 * - If a translation entry is missing for an entity index, the original entity is kept unchanged.
 */
export function materializeTweetWithManualTranslations(
  tweet: EnrichedTweet,
  manual: Entity[] | null | undefined,
): EnrichedTweet {
  if (!manual || manual.length === 0)
    return tweet

  return {
    ...tweet,
    entities: mergeEntityTranslationsByIndex(tweet.entities || [], manual),
  }
}

/**
 * Materialize a tweet list (including quoted tweets) with manual translations.
 *
 * This is used for:
 * - Markdown export
 * - Screenshot translation sync (persist to DB)
 *
 * It keeps backward compatibility with persisted formats, because it only overlays `.translation`
 * and does not change entity ordering/shape.
 */
export function materializeTweetsWithManualTranslations(
  tweets: EnrichedTweet[],
  translations: Record<string, Entity[] | null> | undefined,
): EnrichedTweet[] {
  if (!translations)
    return tweets

  return tweets.map((tweet) => {
    const manual = translations[tweet.id_str]
    const materialized = materializeTweetWithManualTranslations(tweet, manual)

    if (!tweet.quotedTweet)
      return materialized

    const quotedManual = translations[tweet.quotedTweet.id_str]
    return {
      ...materialized,
      quotedTweet: materializeTweetWithManualTranslations(tweet.quotedTweet, quotedManual),
    }
  })
}
