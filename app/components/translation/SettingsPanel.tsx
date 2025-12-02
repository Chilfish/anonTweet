import type { LucideIcon } from 'lucide-react'
import { Monitor, Moon, SettingsIcon, Sun } from 'lucide-react'
import React, { useState } from 'react'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import {
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'

import { useTheme } from '~/lib/stores/theme'

import { SeparatorTemplateManager } from './SeparatorTemplateManager'

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
  const { theme, setTheme } = useTheme()

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

export function SettingsPanel() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  return (
    <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon" />}>
        <SettingsIcon className="size-5" />
      </DialogTrigger>

      <DialogPopup className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">设置</DialogTitle>
        </DialogHeader>

        <DialogPanel className="space-y-6">
          <Card>
            <CardContent className="space-y-3">
              <h3 className="font-bold">主题</h3>
              <ThemeSelector />
            </CardContent>
          </Card>

          <SeparatorTemplateManager />
        </DialogPanel>

        <DialogFooter>
          <Button
            onClick={() => setIsSettingsOpen(false)}
            className="text-sm"
          >
            完成
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  )
}
