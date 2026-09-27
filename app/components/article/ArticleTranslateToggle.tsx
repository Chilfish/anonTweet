import type { ComponentProps } from 'react'
import type { ArticleViewMode } from './ArticleBody'
import { EyeOff, Languages, Type } from 'lucide-react'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { cn } from '~/lib/utils'

const MODES = [
  { value: 'original', label: '原文', icon: EyeOff },
  { value: 'bilingual', label: '双语', icon: Languages },
  { value: 'translation', label: '仅译文', icon: Type },
] as const

interface ArticleTranslateToggleProps extends Omit<ComponentProps<typeof Button>, 'onChange'> {
  mode: ArticleViewMode
  onModeChange: (mode: ArticleViewMode) => void
}

/** 阅读页的原文 / 双语 / 仅译文三态开关（受控组件，状态由调用方持有） */
export function ArticleTranslateToggle({ mode, onModeChange, className, ...props }: ArticleTranslateToggleProps) {
  const current = MODES.find(m => m.value === mode) ?? MODES[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={(
          <Button variant="outline" size="sm" className={cn(className)} {...props}>
            <current.icon className="size-4" />
            <span className="hidden sm:inline">{current.label}</span>
          </Button>
        )}
      />
      <DropdownMenuContent align="end" className="space-y-1 p-1.5">
        {MODES.map(item => (
          <DropdownMenuItem
            key={item.value}
            onClick={() => onModeChange(item.value)}
            className={cn(
              'flex cursor-pointer items-center gap-2',
              mode === item.value && 'bg-muted font-bold',
            )}
          >
            <item.icon className="size-4" />
            <span>{item.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
