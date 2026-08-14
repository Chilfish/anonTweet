/**
 * test/integration/api.media.spec.ts
 *
 * L2 集成层 — Media Proxy（自 verify/modules/media.verifier.ts 集成 AC 迁移，Phase C）：
 * AC-MEDIA-001（Tweet 图片代理：后缀白名单 *.png）/ 002（IG 图片代理：域名白名单 cdninstagram.com）/
 * 003（缺 url → 400，白名单外 → 403）。
 * 确定性：本地像素服务器（Bun.serve 随机端口）作为上游，不依赖真实 CDN。
 */
import { describe, expect, it } from 'vitest'
import { startPixelServer } from '../helpers/pixel-server'
import { getClient } from '../helpers/test-context'

describe('AC-MEDIA proxy endpoint (local pixel server)', () => {
  it('AC-MEDIA-001: tweet image proxy reachable (*.png suffix allowlist)', async () => {
    const pixel = await startPixelServer()
    try {
      const res = await getClient().proxy.image(`${pixel.url}/tweet-sample.png`)
      expect(res.status).toBe(200)
      expect(res.contentType).toContain('image/png')
    }
    finally {
      await pixel.stop().catch(() => {})
    }
  })

  it('AC-MEDIA-002: IG image proxy reachable (cdninstagram.com domain allowlist)', async () => {
    const pixel = await startPixelServer()
    try {
      const res = await getClient().proxy.image(`${pixel.url}/scontent.cdninstagram.com/pixel`)
      expect(res.status).toBe(200)
      expect(res.contentType).toContain('image/png')
    }
    finally {
      await pixel.stop().catch(() => {})
    }
  })

  it('AC-MEDIA-003: invalid URL returns error (missing 400 / disallowed 403)', async () => {
    const client = getClient()
    const missing = await client.proxy.image('')
    const disallowed = await client.proxy.image('https://example.com/evil.txt')

    expect(missing.status).toBe(400)
    expect(disallowed.status).toBe(403)
  })
})
