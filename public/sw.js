/*
 * Anon Tweet — 极简 Service Worker
 *
 * 目标不是离线缓存，而是满足 Chrome Android「可安装 PWA」的判定（需要注册一个
 * 控制页面的 SW），并把系统分享落到首页时保持原生网络行为。
 *
 * 铁律（对应 AC-PWA-002）：
 *   - 网络透传：同源 GET 一律 respondWith(fetch(request))，绝不写任何 Cache；
 *   - 绝不缓存/接管 HTML 导航与 /api/* 与任何非 GET —— SSR / serverless 部署下
 *     导航必须每次都回源，防止部署后旧 SW 挡在中间；
 *   - 异源（googleapis / twitter CDN / IG CDN 等）与非 GET 不设 handler，交给浏览器默认。
 *
 * 变更策略：install 即 skipWaiting、activate 即 clients.claim，保证新 SW 尽快接管，
 * 且因从不缓存，无「旧版本 HTML」滞留问题。
 *
 * 注意：repo lint 禁用 `self`，故用 `globalThis`（在 SW 作用域即 Worker 全局对象）。
 */

globalThis.addEventListener('install', () => {
  globalThis.skipWaiting()
})

globalThis.addEventListener('activate', (event) => {
  event.waitUntil(globalThis.clients.claim())
})

// AC-PWA-008：页面点击「立即刷新」前可显式让 waiting worker 接管（user gesture 通道）
globalThis.addEventListener('message', (event) => {
  const data = event.data
  if (data && typeof data === 'object' && data.type === 'SKIP_WAITING') {
    globalThis.skipWaiting()
  }
})

globalThis.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET')
    return

  const url = new URL(request.url)
  if (url.origin !== globalThis.location.origin)
    return

  event.respondWith(fetch(request))
})
