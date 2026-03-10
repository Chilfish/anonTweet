import type { EnrichedTweet, Entity } from '~/types'
import { useShallow } from 'zustand/react/shallow'
import { useAppConfigStore } from '~/lib/stores/appConfig'
import { useTranslationStore } from '~/lib/stores/translation'
import { resolveTranslationView } from '~/lib/translation/resolveTranslationView'

export function useTweetTranslation(tweet: EnrichedTweet, type: 'body' | 'alt' = 'body') {
  const {
    translationMode,
    tweetTranslationModes,
    translations,
    translationVisibility,
  } = useTranslationStore(
    useShallow(state => ({
      translationMode: state.translationMode,
      tweetTranslationModes: state.tweetTranslationModes,
      translations: state.translations,
      translationVisibility: state.translationVisibility,
    })),
  )
  const enableAITranslation = useAppConfigStore(state => state.enableAITranslation)
  const tweetId = tweet.id_str

  const mode = tweetTranslationModes[tweetId] || translationMode
  const visibility = translationVisibility[tweetId] || { body: true, alt: true }
  const manualTranslation = translations[tweetId]

  const view = resolveTranslationView({
    tweet,
    manualTranslation,
    enableAITranslation,
    mode,
    visibility,
    part: type,
  })

  if (!view.shouldShow) {
    return { shouldShow: false, entities: null as Entity[] | null, source: view.source as const }
  }

  return { shouldShow: true, entities: view.entities, source: view.source as const }
}
