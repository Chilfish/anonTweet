import { Camera, ClipboardCopy, Sparkles } from 'lucide-react'

const CAPABILITIES = [
  { icon: Sparkles, label: 'AI 翻译' },
  { icon: Camera, label: '截图导出' },
  { icon: ClipboardCopy, label: 'Markdown' },
] as const

/** 产品能力提示：只列真实存在的三项，无链接、无描述 */
export function CapabilityStrip() {
  return (
    <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-muted-foreground/70">
      {CAPABILITIES.map(({ icon: Icon, label }) => (
        <li key={label} className="inline-flex items-center gap-1.5">
          <Icon className="size-3.5" aria-hidden />
          {label}
        </li>
      ))}
    </ul>
  )
}
