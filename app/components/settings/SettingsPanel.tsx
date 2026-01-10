import React, { useState } from 'react'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from '~/components/ui/dialog'
import { Tabs, TabsList, TabsPanel, TabsTab } from '~/components/ui/tabs'
import { AITranslationSettings } from './AITranslationSettings'
import { GeneralSettings } from './GeneralSettings'
import { SeparatorTemplateManager } from './SeparatorTemplateManager'
import { TranslationDictionaryManager } from './TranslationDictionaryManager'

export function SettingsBody() {
  return (
    <DialogPanel className="space-y-6">
      <Tabs defaultValue="separator">
        <TabsList>
          <TabsTab value="separator">分隔符样式</TabsTab>
          <TabsTab value="translation">翻译对照表</TabsTab>
          <TabsTab value="ai-translation">AI 翻译</TabsTab>
          <TabsTab value="general">通用设置</TabsTab>
        </TabsList>
        <TabsPanel value="general">
          <GeneralSettings />
        </TabsPanel>
        <TabsPanel value="separator">
          <SeparatorTemplateManager />
        </TabsPanel>
        <TabsPanel value="translation">
          <TranslationDictionaryManager />
        </TabsPanel>
        <TabsPanel value="ai-translation">
          <AITranslationSettings />
        </TabsPanel>
      </Tabs>

    </DialogPanel>
  )
}

interface SettingsPanelProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
}

export function SettingsPanel({ open, onOpenChange, trigger }: SettingsPanelProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen

  const setIsOpen = (value: boolean) => {
    if (isControlled) {
      onOpenChange?.(value)
    }
    else {
      setInternalOpen(value)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">设置</DialogTitle>
        </DialogHeader>

        <SettingsBody />

        <DialogFooter>
          <Button
            onClick={() => setIsOpen(false)}
            className="text-sm"
          >
            完成
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  )
}
