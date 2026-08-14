/**
 * test/helpers/test-context.ts
 *
 * 集成层上下文：globalSetup 启动的 TestServer URL 经 process.env.TEST_BASE_URL 传递，
 * client 惰性创建（globalSetup 与测试不同进程，globalThis 不共享）。
 * 仅 integration 项目可用（见 test/integration/global-setup.ts）。
 */
import { AnonTweetClient } from '../support/api-client'

let client: AnonTweetClient | null = null

export function getClient(): AnonTweetClient {
  if (!client) {
    const baseUrl = process.env.TEST_BASE_URL
    if (!baseUrl) {
      throw new Error(
        'Test server URL not available — run integration tests via `bun run test:integration`',
      )
    }
    client = new AnonTweetClient({ baseUrl })
  }
  return client
}
