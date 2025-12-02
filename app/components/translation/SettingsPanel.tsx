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
import { Label } from '~/components/ui/label'
import {
  useColorScheme,
  useSetColorScheme,
} from '~/lib/color-scheme/components'
import { SeparatorTemplateManager } from './SeparatorTemplateManager'

export function SettingsPanel() {
  // const { theme, setTheme } = useTheme()
  const setColorScheme = useSetColorScheme()
  const colorScheme = useColorScheme()

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

        <DialogPanel>
          {/* 主题设置 */}
          <Card className="gap-0 mb-4">
            <CardContent className="space-y-4">
              <Label>
                <h3 className="font-bold">主题</h3>
              </Label>
              <div className="flex gap-2">
                <Button
                  variant={colorScheme === 'light' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setColorScheme('light')}
                  className="flex items-center gap-2"
                >
                  <Sun className="size-4" />
                  浅色
                </Button>
                <Button
                  variant={colorScheme === 'dark' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setColorScheme('dark')}
                  className="flex items-center gap-2"
                >
                  <Moon className="size-4" />
                  深色
                </Button>
                <Button
                  variant={colorScheme === 'system' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setColorScheme('system')}
                  className="flex items-center gap-2"
                >
                  <Monitor className="size-4" />
                  系统
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 分隔符设置 */}
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
