import type { EnrichedTweet, Entity } from '~/types'
import { useShallow } from 'zustand/react/shallow'
import { useAppConfigStore } from '~/lib/stores/appConfig'
import { useTranslationStore } from '~/lib/stores/translation'
import { resolveTranslationView } from '~/lib/translation/resolveTranslationView'

const DEFAULT_VISIBILITY = { body: true, alt: true } as const

export function useTweetTranslation(tweet: EnrichedTweet, type: 'body' | 'alt' = 'body') {
  const enableAITranslation = useAppConfigStore(state => state.enableAITranslation)
  const tweetId = tweet.id_str

  const { mode, visibility, manualTranslation } = useTranslationStore(
    useShallow(state => ({
      mode: state.tweetTranslationModes[tweetId] || state.translationMode,
      visibility: state.translationVisibility[tweetId] || DEFAULT_VISIBILITY,
      manualTranslation: state.translations[tweetId],
    })),
  )

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
