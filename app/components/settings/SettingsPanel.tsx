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
import { SeparatorTemplateManager } from './SeparatorTemplateManager'
import { ThemeSwitcher } from './ThemeSwitcher'

import { TranslationDictionaryManager } from './TranslationDictionaryManager'

export function SettingsBody() {
  return (
    <DialogPanel className="space-y-6">
      <ThemeSwitcher />

      <SeparatorTemplateManager />

      <TranslationDictionaryManager />
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

      <DialogPopup className="sm:max-w-[50%]">
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
