/**
 * PWA service worker 注册（客户端专用）。
 *
 * 为何手动注册而非框架/插件注入：本应用为 React Router SSR + Vercel serverless，
 * HTML 由运行时服务器产出，构建期的 HTML 注入不适用；故在 root 组件 client effect
 * 里注册极简 sw.js（见 public/sw.js，网络透传、不缓存）。
 *
 * 注册条件 = 安全上下文（`isSecureContext`）：
 *   - https（生产 anon-tweet.chilfish.top / 本地 Caddy 反代的 https LAN）→ 注册
 *   - http://localhost（浏览器视为安全上下文）→ 注册
 *   - 明文 http 局域网（如 http://10.192.250.137:9080）→ 非安全上下文，SW 根本不运行，
 *     Chrome 只给「添加到主屏幕」快捷方式、不给 PWA 安装——此守卫让这种场景不注册（行为一致）。
 * SW 网络透传、不缓存，dev / HMR 下注册无副作用。
 */
export function registerServiceWorker(): void {
  if (typeof window === 'undefined')
    return
  if (!('serviceWorker' in navigator))
    return
  if (!window.isSecureContext)
    return

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .catch((err: unknown) => {
        console.error('[PWA] service worker 注册失败：', err)
      })
  })
}
