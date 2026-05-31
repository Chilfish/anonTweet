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
import { cn } from '~/lib/utils'

export type IGTranslationMode = 'original' | 'bilingual' | 'translation'

interface IGTranslateToggleProps {
  mode: IGTranslationMode
  onModeChange: (mode: IGTranslationMode) => void
  disabled?: boolean
}

const modes = [
  { value: 'original' as const, label: '原文', icon: EyeOff },
  { value: 'bilingual' as const, label: '双语', icon: Languages },
  { value: 'translation' as const, label: '仅译文', icon: Type },
]

/**
 * Instagram 翻译模式切换按钮。
 *
 * 三个模式：原文 / 双语 / 仅译文。
 */
export function IGTranslateToggle({
  mode,
  onModeChange,
  disabled,
}: IGTranslateToggleProps) {
  const current = modes.find(m => m.value === mode) || modes[1]!

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={(
          <Button variant="outline" disabled={disabled}>
            <current.icon className="size-4" />
            <span className="hidden sm:inline">{current.label}</span>
          </Button>
        )}
      />

      <DropdownMenuContent align="start" className="p-1.5 space-y-1">
        {modes.map(m => (
          <DropdownMenuItem
            key={m.value}
            onClick={() => onModeChange(m.value)}
            className={cn(
              'flex items-center gap-2 cursor-pointer',
              mode === m.value && 'bg-muted font-bold',
            )}
          >
            <m.icon className="size-4" />
            <span>{m.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
