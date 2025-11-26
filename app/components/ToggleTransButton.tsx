import { useTranslationStore } from '~/lib/stores/translation'
import { Button } from './ui/button'

export function ToggleTransButton() {
  const { setShowTranslations, setShowTranslationButton, showTranslations } = useTranslationStore()
  function toggleTranslations() {
    const target = !showTranslations
    setShowTranslations(target)
    setShowTranslationButton(target)
  }

  return (
    <Button
      size="sm"
      onClick={toggleTranslations}
      className="h-8 px-3 text-sm font-medium transition-all duration-200"
    >
      {showTranslations ? '隐藏翻译' : '开始翻译'}
    </Button>
  )
}
