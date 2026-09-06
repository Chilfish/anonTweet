/**
 * SW 版本更新探测（客户端专用，AC-PWA-008）。
 *
 * 现状：sw.js 网络透传、install 即 skipWaiting + clients.claim——部署后新 SW 会尽快接管，
 * 但「已打开的旧文档」不会自动换新，唯一解是 reload。本模块只负责优雅地告诉页面「有新版本」：
 * 不自动刷新（避免打断翻译/阅读），由 UpdateNotice 横幅让用户点「立即刷新」。
 *
 * 机制：
 * - 页面可见/聚焦时（节流）调 `registration.update()`，加速浏览器本已存在的 SW 更新检查；
 * - 监听 `updatefound` → `reg.installing` 的 `statechange`：仅当页面已被 SW 控制（有 controller）
 *   且新 worker 到达 `installed/activating/activated` 才判定「可更新」——首次访问（初次安装、
 *   无 controller）不打扰。
 */

/** 可见/聚焦触发 update() 的节流间隔（毫秒）。 */
const UPDATE_CHECK_MIN_MS = 10 * 60 * 1000

export interface UpdateCheckContext {
  /** 当前页面是否已被 service worker 控制（存在 controller）。 */
  hasController: boolean
  /** 新 worker 的状态（reg.installing.state）。 */
  state: string | null
}

/**
 * 是否值得向用户提示「有新版本」：
 * 无 controller（首次访问 / 纯初次安装）不提示；受控后新 worker 进入
 * installed/activating/activated 才算一次真实的版本更新。
 */
export function shouldOfferUpdate({ hasController, state }: UpdateCheckContext): boolean {
  if (!hasController)
    return false
  return state === 'installed' || state === 'activating' || state === 'activated'
}

export interface UpdateWatcherOptions {
  /** 探测到可更新版本时回调（由 UI 弹提示）。 */
  onUpdateReady: () => void
}

/**
 * 启动更新探测并返回停止函数（组件卸载时调用）。
 * 内部：单次页面会话只提示一次（announced 去重）；注册 updatefound 监听 → 初次 +
 * 每次页面回到可见/聚焦（节流）调 registration.update()。
 */
export function startUpdateWatcher({
  onUpdateReady,
}: UpdateWatcherOptions): () => void {
  if (typeof window === 'undefined')
    return () => {}

  if (!('serviceWorker' in navigator) || !window.isSecureContext)
    return () => {}

  let stopped = false
  let announced = false
  let lastCheckAt = 0
  const cleanups: Array<() => void> = []

  const announce = (state: string | null): void => {
    if (stopped || announced)
      return
    const hasController = !!navigator.serviceWorker.controller
    if (shouldOfferUpdate({ hasController, state })) {
      announced = true
      onUpdateReady()
    }
  }

  // update() 触发的是字节级检查：变化时浏览器会同步触发 registration.updatefound
  const poll = (registration: ServiceWorkerRegistration | null | undefined): void => {
    const now = Date.now()
    if (now - lastCheckAt < UPDATE_CHECK_MIN_MS)
      return
    lastCheckAt = now
    if (!registration)
      return
    registration.update().catch(() => {
      // 更新检查失败静默：下次可见/聚焦再试
    })
  }

  navigator.serviceWorker
    .getRegistration()
    .then((registration) => {
      if (!registration || stopped)
        return

      const handleUpdateFound = () => {
        const worker = registration.installing
        if (!worker)
          return
        const onStateChange = () => announce(worker.state)
        worker.addEventListener('statechange', onStateChange)
        cleanups.push(() => worker.removeEventListener('statechange', onStateChange))
        onStateChange()
      }

      registration.addEventListener('updatefound', handleUpdateFound)
      cleanups.push(() => registration.removeEventListener('updatefound', handleUpdateFound))

      // 初次探测（注册就绪即检查一次，捕获已经存在的更新）
      poll(registration)
    })
    .catch(() => {
      // 拿不到 registration（首次安装瞬时）静默
    })

  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible')
      navigator.serviceWorker.getRegistration().then(reg => poll(reg)).catch(() => {})
  }
  const onFocus = () => {
    navigator.serviceWorker.getRegistration().then(reg => poll(reg)).catch(() => {})
  }

  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('focus', onFocus)
  cleanups.push(() => document.removeEventListener('visibilitychange', onVisibilityChange))
  cleanups.push(() => window.removeEventListener('focus', onFocus))

  return () => {
    stopped = true
    for (const cleanup of cleanups)
      cleanup()
  }
}
