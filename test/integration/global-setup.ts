/**
 * test/integration/global-setup.ts
 *
 * 集成层 TestServer 生命周期（vitest globalSetup，setup/teardown 契约）：
 * - 启动隔离 dev server（默认 9081，隔离外部 API key → 确定性）
 * - 服务器 URL 写入 process.env.TEST_BASE_URL（worker 继承），spec 经 test-context 读取
 * - teardown 停止服务器
 *
 * 注意：globalSetup 运行在隔离进程，globalThis 不与测试共享——必须用 env 传参。
 */
import { TestServer } from '../support/test-server'

let server: TestServer | null = null

export async function setup() {
  // 默认隔离外部 key（确定性）；有真实 key 的开发者可 VERIFY_ISOLATE=false 关闭
  const isolateExternal = process.env.VERIFY_ISOLATE !== 'false'
  server = new TestServer({ port: 9081, isolateExternal })
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
