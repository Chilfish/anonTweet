import { Monitor, Moon, SettingsIcon, Sun } from 'lucide-react'
import React, { useState } from 'react'
import { useTheme } from '~/lib/stores/theme'
import { useTranslationStore } from '~/lib/stores/translation'
import { SeparatorTemplateManager } from './SeparatorTemplateManager'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Label } from './ui/label'

export function SettingsPanel() {
  const { setShowTranslations, setShowTranslationButton, showTranslationButton, showTranslations } = useTranslationStore()
  const { theme, setTheme } = useTheme()

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  function toggleTranslations() {
    const target = !showTranslations
    setShowTranslations(target)
    setShowTranslationButton(target)
  }

  return (
    <>
      {/* 显示/隐藏翻译按钮 */}
      <Button
        size="sm"
        onClick={toggleTranslations}
        className="h-8 px-3 text-sm font-medium transition-all duration-200"
      >
        {showTranslations ? '隐藏翻译' : '开始翻译'}
      </Button>

      {/* 翻译设置对话框 */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
          >
            <SettingsIcon className="size-5" />
          </Button>
        </DialogTrigger>
        <DialogContent
          className="  max-h-[90vh] overflow-y-auto p-4"
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">设置</DialogTitle>
          </DialogHeader>

          {/* 主题设置 */}
          <Card className="gap-0">
            <CardContent className="space-y-4 px-4">
              <Label>
                <h3 className="font-bold">主题</h3>
              </Label>
              <div className="flex gap-2">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('light')}
                  className="flex items-center gap-2"
                >
                  <Sun className="size-4" />
                  浅色
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('dark')}
                  className="flex items-center gap-2"
                >
                  <Moon className="size-4" />
                  深色
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('system')}
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

          <DialogFooter>
            <Button
              onClick={() => setIsSettingsOpen(false)}
              className="text-sm"
            >
              完成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
