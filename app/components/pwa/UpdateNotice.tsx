import { RefreshCw, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '~/components/ui/button'
import { startUpdateWatcher } from '~/lib/pwa/update'

/**
 * SW 版本更新提示横幅（AC-PWA-008）。
 *
 * 探测到新版本后在页面底部提示「立即刷新」，由用户显式触发 reload——
 * 不自动打断正在进行的翻译编辑/阅读/滚动。
 */
export function UpdateNotice() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined')
      return

    // 单页面会话探测一次；横幅「稍后」仅隐藏本次，关闭去重由 watcher once 承担
    const stop = startUpdateWatcher({ onUpdateReady: () => setShow(true) })
    return stop
  }, [])

  if (!show)
    return null

  /** 应用新版本：若存在 waiting worker 先让其接管，随后刷新页面。 */
  const refresh = async () => {
    try {
      const registration = await navigator.serviceWorker?.getRegistration()
      if (registration?.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      }
    }
    catch {
      // 拿不到 registration 不阻塞刷新
    }
    window.location.reload()
  }

  return (
    <div className="fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4">
      <div className="flex items-center gap-2 rounded-full border bg-card/95 py-1.5 pl-4 pr-1.5 shadow-lg backdrop-blur">
        <p className="text-sm text-foreground">
          发现新版本，点击刷新以应用更新
        </p>
        <Button size="sm" onClick={refresh}>
          <RefreshCw className="size-3.5" />
          立即刷新
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 rounded-full"
          onClick={() => setShow(false)}
          aria-label="稍后"
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  )
}
