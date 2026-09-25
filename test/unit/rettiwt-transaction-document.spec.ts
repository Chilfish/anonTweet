import { parseHTML } from 'linkedom'
import { describe, expect, it } from 'vitest'
import { isUsableXDocument, X_LEGACY_HOME_URLS } from '~/lib/rettiwt-api/services/public/FetcherService'

/**
 * test/unit/rettiwt-transaction-document.spec.ts
 *
 * X 迁移到 Rolldown/Vite 后，`/` ` /home` 不再内嵌 `ondemand.s` webpack chunk map，
 * 导致 x-client-transaction-id 抛 OnDemandFileUrlResolutionError。FetcherService
 * 改为在 X_LEGACY_HOME_URLS 中探测仍提供旧版外壳的页面。这里固化「可用文档」判定：
 * 必须同时具备 site verification meta 与 ondemand.s chunk 引用。
 */

function doc(body: string): Document {
  return parseHTML(`<!DOCTYPE html><html><head>${body}</head><body></body></html>`).document as unknown as Document
}

const VERIFICATION_META = '<meta name="twitter-site-verification" content="abc123"/>'

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

  it('keeps a non-empty probe list with /home as the last-resort fallback', () => {
    expect(X_LEGACY_HOME_URLS.length).toBeGreaterThan(1)
    expect(X_LEGACY_HOME_URLS.at(-1)).toBe('https://x.com/home')
  })
})
