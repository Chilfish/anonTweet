import { Settings } from 'lucide-react'
import { useState } from 'react'
import { cn } from '~/lib/utils'
import { SettingsPanel } from './SettingsPanel'

/** 设置入口：与「搜索推文」同行的轻量文字按钮，打开现有 SettingsPanel */
export function SettingsButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        aria-label="设置"
        onClick={() => setOpen(true)}
        className={cn(
          'inline-flex items-center gap-1 transition-colors hover:text-foreground',
          className,
        )}
      >
        <Settings className="size-3.5" aria-hidden />
        设置
      </button>
      <SettingsPanel open={open} onOpenChange={setOpen} />
    </>
  )
}
