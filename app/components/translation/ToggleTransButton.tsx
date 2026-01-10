import type { ComponentProps } from 'react'
import { Button } from '~/components/ui/button'
import { useTranslationStore } from '~/lib/stores/translation'
import { cn } from '~/lib/utils'

export function ToggleTransButton({ className, ...props }: ComponentProps<typeof Button>) {
  const { setShowTranslations, showTranslations, setShowTranslationButton } = useTranslationStore()
  function toggleTranslations() {
    const target = !showTranslations
    setShowTranslationButton(target)
    setShowTranslations(target)
  }

  return (
    <Button
      variant="secondary"
      {...props}
      onClick={(e) => {
        toggleTranslations()
        props.onClick?.(e)
      }}
      className={cn('h-8 px-3 text-sm font-medium transition-all duration-200', className)}
    >
      {props.children ?? (showTranslations ? '隐藏翻译' : '开始翻译')}
    </Button>
  )
}
