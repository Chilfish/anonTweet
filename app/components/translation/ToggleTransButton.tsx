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
import {
  useGlobalTranslationMode,
  useTranslationActions,
  useTranslationUIActions,
} from '~/lib/stores/hooks'
import { cn } from '~/lib/utils'

interface ToggleTransButtonProps extends ComponentProps<typeof Button> {
  tweetId?: string
}

export function ToggleTransButton({ className, tweetId, ...props }: ToggleTransButtonProps) {
  const { translationMode, tweetTranslationModes } = useGlobalTranslationMode()
  const { setTranslationMode, setTweetTranslationMode } = useTranslationActions()
  const { setShowTranslationButton } = useTranslationUIActions()

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

  // 如果提供了 tweetId，优先使用该推文的独立设置，否则回退到全局设置
  const effectiveMode = tweetId
    ? (tweetTranslationModes[tweetId] || translationMode)
    : translationMode

  const currentMode = modes.find(m => m.value === effectiveMode) || modes[1]

  const handleModeChange = (mode: typeof modes[number]['value']) => {
    if (tweetId) {
      setTweetTranslationMode(tweetId, mode)
    }
    else {
      setTranslationMode(mode)
      // 只有在非 original 模式下才显示推文下方的翻译按钮
      setShowTranslationButton(mode !== 'original')
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={(
        <Button
          variant="outline"
          {...props}
          className={cn(className)}
        />
      )}
      >
        <currentMode.icon className="sise-4" />
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
              effectiveMode === mode.value && 'bg-muted font-bold',
            )}
          >
            <mode.icon className="size-4" />
            <span>{mode.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
