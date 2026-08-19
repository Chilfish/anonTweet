/**
 * test/integration/global-setup.ts
 *
 * 集成层 TestServer 生命周期（vitest globalSetup，setup/teardown 契约）：
 * - 启动隔离 dev server（默认 9081，隔离外部 API key → 确定性）
 * - 服务器 URL 写入 process.env.TEST_BASE_URL（worker 继承），spec 经 test-context 读取
 * - teardown 停止服务器
 *
 * 端口可用 TEST_SERVER_PORT 覆盖：本机 dev server（默认也在 9081）占用探针端口时，
 * 复用路径会拿真实 key 服务器跑 AC-IG-009（404≠500）——换一个空闲端口即可保持
 * 隔离确定性（见 docs/development-log/2026-08-19.md）。
 *
 * 注意：globalSetup 运行在隔离进程，globalThis 不与测试共享——必须用 env 传参。
 */
import { TestServer } from '../support/test-server'

let server: TestServer | null = null

export async function setup() {
  // 默认隔离外部 key（确定性）；有真实 key 的开发者可 VERIFY_ISOLATE=false 关闭
  const isolateExternal = process.env.VERIFY_ISOLATE !== 'false'
  const port = Number(process.env.TEST_SERVER_PORT) || 9081
  server = new TestServer({ port, isolateExternal })
  await server.start()

  process.env.TEST_BASE_URL = server.url
  if (isolateExternal) {
    // 与隔离服务器同步：删除外部 key 使 SKIP 语义（skipIf）与服务器行为一致
    for (const key of ['INS_COOKIES', 'TWEET_KEYS'] as const)
      delete process.env[key]
  }
}

export async function teardown() {
  if (server) {
    await server.stop().catch(() => {})
    server = null
  }
}
