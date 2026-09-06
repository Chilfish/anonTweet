import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * test/acceptance/ac-pwa.spec.ts
 *
 * AC-PWA-001/002 仓库级静态检查：
 * - manifest 声明 Web Share Target（GET action="/"，params url/text/title）且安装用图标齐备；
 * - service worker 为「极简网络透传」——同源 GET 一律回源、绝不写 Cache，异源/非 GET 交给默认，
 *   且仅在生产构建经 root 注册；manifest 已在 root <head> 通过 <link rel="manifest"> 引入。
 *
 * AC-PWA-003 的语义（可识别自动跳 / 不可识别留框报错）由 test/unit/share.spec.ts 承担。
 */

const read = (rel: string) => fs.readFileSync(path.resolve(import.meta.dirname, '..', '..', rel), 'utf8')
const exists = (rel: string) => fs.existsSync(path.resolve(import.meta.dirname, '..', '..', rel))

const MANIFEST = 'public/manifest.webmanifest'
const SW = 'public/sw.js'
const ROOT = 'app/root.tsx'
const REGISTER = 'app/lib/pwa/register.ts'
const ICONS = ['public/icons/pwa-192x192.png', 'public/icons/pwa-512x512.png']

// 模块级正则（满足 e18e/prefer-static-regex，避免在 it() 内反复编译）
const MANIFEST_LINK_RE = /rel: 'manifest'/
const INSTALL_RE = /addEventListener\('install'/
const ACTIVATE_RE = /addEventListener\('activate'/
const FETCH_RE = /addEventListener\('fetch'/
const SKIP_WAITING_RE = /skipWaiting\(\)/
const CLAIM_RE = /clients\.claim\(\)/
const CACHES_OPEN_RE = /caches\.open/
const CACHE_ADD_RE = /cache\.add/
const CACHE_PUT_RE = /cache\.put/
const NOT_GET_RE = /method !== 'GET'/
const ORIGIN_RE = /origin !== globalThis\.location\.origin/
const RESPOND_FETCH_RE = /respondWith\(fetch\(request\)\)/
const REGISTER_SW_RE = /register\('\/sw\.js'/
const SECURE_CTX_RE = /window\.isSecureContext/
const SW_FEATURE_RE = /'serviceWorker' in navigator/
const CALL_REGISTER_RE = /registerServiceWorker\(\)/

describe('AC-PWA-001: manifest 声明可安装 PWA + Web Share Target（首页 GET 接收）', () => {
  it('manifest 是合法 JSON 且含 display/start_url/scope', () => {
    const m = JSON.parse(read(MANIFEST))
    expect(m.display).toBe('standalone')
    expect(m.start_url).toBe('/')
    expect(m.scope).toBe('/')
  })

  it('share_target 指向首页 "/" GET，携带 url/text/title 参数', () => {
    const m = JSON.parse(read(MANIFEST))
    const st = m.share_target
    expect(st).toBeTruthy()
    expect(st.method).toBe('GET')
    expect(st.action).toBe('/')
    expect(st.params.url).toBe('url')
    expect(st.params.text).toBe('text')
    expect(st.params.title).toBe('title')
  })

  it('安装用 192/512 图标存在且 manifest 引用', () => {
    const m = JSON.parse(read(MANIFEST))
    const sizes = m.icons.map((i: { sizes: string }) => i.sizes)
    expect(sizes).toContain('192x192')
    expect(sizes).toContain('512x512')
    for (const icon of ICONS) {
      expect(exists(icon), `${icon} 应存在`).toBe(true)
    }
  })

  it('root <head> 已 <link rel="manifest"> 引入', () => {
    const src = read(ROOT)
    expect(src).toMatch(MANIFEST_LINK_RE)
    expect(src).toContain('/manifest.webmanifest')
  })
})

describe('AC-PWA-002: service worker 为网络透传、不缓存，且仅生产注册', () => {
  const sw = read(SW)

  it('sw.js 注册了 install/activate/fetch，满足 Chrome 可安装判定', () => {
    expect(sw).toMatch(INSTALL_RE)
    expect(sw).toMatch(ACTIVATE_RE)
    expect(sw).toMatch(FETCH_RE)
    expect(sw).toMatch(SKIP_WAITING_RE)
    expect(sw).toMatch(CLAIM_RE)
  })

  it('不引入任何 CacheStorage 写缓存（绝无 caches.open/add/put）', () => {
    expect(sw).not.toMatch(CACHES_OPEN_RE)
    expect(sw).not.toMatch(CACHE_ADD_RE)
    expect(sw).not.toMatch(CACHE_PUT_RE)
  })

  it('fetch 仅透传同源 GET（respondWith(fetch(request))），异源/非 GET 交给浏览器', () => {
    expect(sw).toMatch(NOT_GET_RE)
    expect(sw).toMatch(ORIGIN_RE)
    expect(sw).toMatch(RESPOND_FETCH_RE)
  })

  it('根组件在安全上下文下注册 /sw.js（register.ts 有 isSecureContext 守卫）', () => {
    const register = read(REGISTER)
    expect(register).toMatch(REGISTER_SW_RE)
    expect(register).toMatch(SECURE_CTX_RE)
    expect(register).toMatch(SW_FEATURE_RE)

    const root = read(ROOT)
    expect(root).toMatch(CALL_REGISTER_RE)
  })
})
