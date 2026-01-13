import type { ComponentProps } from 'react'
import {
  EyeOff,
  Languages,
  Type,
} from 'lucide-react'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { useTranslationStore } from '~/lib/stores/translation'
import { cn } from '~/lib/utils'

export function ToggleTransButton({ className, ...props }: ComponentProps<typeof Button>) {
  const { translationMode, setTranslationMode, setShowTranslationButton } = useTranslationStore()

  const modes = [
    {
      value: 'original',
      label: '隐藏翻译',
      icon: EyeOff,
    },
    {
      value: 'bilingual',
      label: '显示双语',
      icon: Languages,
    },
    {
      value: 'translation',
      label: '仅显译文',
      icon: Type,
    },
  ] as const

  const currentMode = modes.find(m => m.value === translationMode) || modes[1]

  const handleModeChange = (mode: typeof modes[number]['value']) => {
    setTranslationMode(mode)
    // 只有在非 original 模式下才显示推文下方的翻译按钮
    setShowTranslationButton(mode !== 'original')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={(
        <Button
          variant="secondary"
          {...props}
          className={cn('h-8 px-3 text-sm font-medium transition-all duration-200 gap-2', className)}
        />
      )}
      >
        <currentMode.icon className="h-4 w-4" />
        <span className="hidden sm:inline">
          {currentMode.label}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="p-1.5 space-y-1">
        {modes.map(mode => (
          <DropdownMenuItem
            key={mode.value}
            onClick={() => handleModeChange(mode.value)}
            className={cn(
              'flex items-center gap-2 cursor-pointer',
              translationMode === mode.value && 'bg-muted font-bold',
            )}
          >
            <mode.icon className="h-4 w-4" />
            <span>{mode.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
