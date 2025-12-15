import { SettingsIcon } from 'lucide-react'
import React, { useState } from 'react'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { Tabs, TabsList, TabsPanel, TabsTab } from '~/components/ui/tabs'
import { SeparatorTemplateManager } from './SeparatorTemplateManager'
import { ThemeSwitcher } from './ThemeSwitcher'
import { TranslationDictionaryManager } from './TranslationDictionaryManager'

export function SettingsBody() {
  return (
    <DialogPanel className="space-y-6">
      <Tabs defaultValue="separator">
        <TabsList>
          <TabsTab value="separator">分隔符样式</TabsTab>
          <TabsTab value="translation">翻译对照表</TabsTab>
          <TabsTab value="theme">主题</TabsTab>
        </TabsList>
        <TabsPanel value="theme">
          <ThemeSwitcher />
        </TabsPanel>
        <TabsPanel value="separator">
          <SeparatorTemplateManager />
        </TabsPanel>
        <TabsPanel value="translation">
          <TranslationDictionaryManager />
        </TabsPanel>
      </Tabs>

    </DialogPanel>
  )
}

export function SettingsPanel() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  return (
    <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon" />}>
        <SettingsIcon className="size-5" />
      </DialogTrigger>

      <DialogPopup className="md:max-w-[50%]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">设置</DialogTitle>
        </DialogHeader>

        <SettingsBody />

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
