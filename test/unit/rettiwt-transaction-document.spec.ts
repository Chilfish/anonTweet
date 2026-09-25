import { parseHTML } from 'linkedom'
import { describe, expect, it } from 'vitest'
import { buildXShellHeaders, isUsableXDocument, X_SHELL_URLS } from '~/lib/rettiwt-api/services/public/FetcherService'

/**
 * test/unit/rettiwt-transaction-document.spec.ts
 *
 * X 只对**登录态**返回仍内嵌 `ondemand.s` webpack chunk map 的旧版外壳，匿名请求拿到
 * 新的 Rolldown/Vite 外壳 → x-client-transaction-id 抛 OnDemandFileUrlResolutionError。
 * 这里固化两处纯逻辑：外壳请求头必须附带登录 cookie（buildXShellHeaders），以及候选
 * 外壳的可用性判定（isUsableXDocument：需同时具备 site verification meta 与 ondemand.s）。
 */

function doc(body: string): Document {
  return parseHTML(`<!DOCTYPE html><html><head>${body}</head><body></body></html>`).document as unknown as Document
}

const VERIFICATION_META = '<meta name="twitter-site-verification" content="abc123"/>'

describe('buildXShellHeaders', () => {
  it('attaches the decoded cookie when an API key is present', () => {
    const cookies = 'auth_token=abc;ct0=def;twid=u%3D1;'
    const apiKey = Buffer.from(cookies).toString('base64')

    const headers = buildXShellHeaders({ 'User-Agent': 'ua' }, apiKey)

    expect(headers.cookie).toBe(cookies)
    expect(headers['User-Agent']).toBe('ua')
  })

  it('does not attach a cookie without an API key', () => {
    expect(buildXShellHeaders({ 'User-Agent': 'ua' })).not.toHaveProperty('cookie')
  })

  it('does not mutate the given headers', () => {
    const base = { 'User-Agent': 'ua' }
    buildXShellHeaders(base, Buffer.from('auth_token=abc;').toString('base64'))

    expect(base).toEqual({ 'User-Agent': 'ua' })
  })
})

describe('isUsableXDocument', () => {
  it('accepts a legacy shell exposing both the verification key and the ondemand chunk', () => {
    const d = doc(`${VERIFICATION_META}<script>window.__chunks={"5":"ondemand.s"}</script>`)
    expect(isUsableXDocument(d)).toBe(true)
  })

  it('rejects the new x-web shell that dropped the ondemand chunk map', () => {
    const d = doc(`${VERIFICATION_META}<script type="module" src="https://abs.twimg.com/x-web/entry-client-logged-out.js"></script>`)
    expect(isUsableXDocument(d)).toBe(false)
  })

  it('rejects a document without the site verification key', () => {
    const d = doc('<script>window.__chunks={"5":"ondemand.s"}</script>')
    expect(isUsableXDocument(d)).toBe(false)
  })

  it('rejects an empty document', () => {
    expect(isUsableXDocument(doc(''))).toBe(false)
  })

  it('probes the canonical homepage first, with legacy routes as a guest fallback', () => {
    expect(X_SHELL_URLS.length).toBeGreaterThan(1)
    expect(X_SHELL_URLS[0]).toBe('https://x.com/home')
    expect(X_SHELL_URLS).toContain('https://x.com/i/topics')
  })
})
