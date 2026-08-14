/**
 * test/helpers/pixel-server.ts
 *
 * 本地 1×1 PNG 服务器（自 verify/modules/media.verifier.ts 的 startPixelServer 提取共享）：
 * 让媒体代理的两种白名单分支（后缀 *.png / IG 域名 cdninstagram.com）离线确定性可达。
 *
 * 注意：vitest 运行在 node 环境（无 Bun 全局），用 node:http 而非 Bun.serve。
 */
import { Buffer } from 'node:buffer'
import { createServer } from 'node:http'

// 1×1 PNG (base64)
const PIXEL_PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

/** Start a local HTTP server that answers every path with a 1×1 PNG. */
export async function startPixelServer(): Promise<{ url: string, stop: () => Promise<void> }> {
  const png = Buffer.from(PIXEL_PNG_B64, 'base64')
  const server = createServer((_req, res) => {
    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': String(png.byteLength),
    })
    res.end(png)
  })

  await new Promise<void>((resolve) => {
    server.listen(0, 'localhost', resolve)
  })

  const address = server.address()
  const port = typeof address === 'object' && address ? address.port : 0

  return {
    url: `http://localhost:${port}`,
    stop: () => new Promise<void>(resolve => server.close(() => resolve())),
  }
}
