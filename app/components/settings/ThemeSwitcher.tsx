import type { LucideIcon } from 'lucide-react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { useThemeStore } from '~/lib/stores/theme'

const THEME_OPTIONS: {
  value: 'light' | 'dark' | 'system'
  label: string
  Icon: LucideIcon
}[] = [
  { value: 'light', label: '浅色', Icon: Sun },
  { value: 'dark', label: '深色', Icon: Moon },
  { value: 'system', label: '系统', Icon: Monitor },
]

function ThemeSelector() {
  const { theme, setTheme } = useThemeStore()

  return (
    <div className="flex gap-2">
      {THEME_OPTIONS.map(({ value, label, Icon }) => (
        <Button
          key={value}
          variant={theme === value ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTheme(value)}
          className="flex items-center gap-2"
          aria-pressed={theme === value}
        >
          <Icon className="size-4" />
          {label}
        </Button>
      ))}
    </div>
  )
}

export function ThemeSwitcher() {
  return (
    <Card>
      <CardContent className="space-y-3">
        <h3 className="font-bold">主题</h3>
        <ThemeSelector />
      </CardContent>
    </Card>
  )
}
