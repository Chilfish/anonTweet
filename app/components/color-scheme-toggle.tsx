import { LaptopIcon, MoonIcon, SunIcon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import {
  ColorSchemeSchema,
  useColorScheme,
  useSetColorScheme,
} from '~/lib/color-scheme/components'
import { Button } from './ui/button'

const THEME_ICONS = {
  light: {
    icon: <SunIcon className="size-4" />,
    label: '浅色',
  },
  dark: {
    icon: <MoonIcon className="size-4" />,
    label: '深色',
  },
  system: {
    icon: <LaptopIcon className="size-4" />,
    label: '系统',
  },
} as const

export function ColorSchemeToggle() {
  const setColorScheme = useSetColorScheme()
  const colorScheme = useColorScheme()

  const getIcon = () => {
    switch (colorScheme) {
      case 'dark':
        return <MoonIcon className="size-4" />
      case 'system':
        return <LaptopIcon className="size-4" />
      default:
        return <SunIcon className="size-4" />
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Toggle color scheme">
          {getIcon()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {ColorSchemeSchema.shape.colorScheme.options.map(value => (
          <DropdownMenuItem
            key={value}
            onClick={() => setColorScheme(value)}
            aria-selected={colorScheme === value}
            className="capitalize"
          >
            {THEME_ICONS[value].icon}
            {THEME_ICONS[value].label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
