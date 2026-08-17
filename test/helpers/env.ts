/**
 * test/helpers/env.ts
 *
 * 环境探测（取代 verify/framework VerifyContext.env）：
 * 各测试层用 `describe.skipIf(!hasKeys)` 实现 SKIP 语义。
 *
 * hasServer: TestServer 是否可用（process.env.TEST_BASE_URL 由
 * test/integration/global-setup.ts 注入）。`bun test` 原生 runner 不跑
 * globalSetup，因此所有依赖 getClient() 的套件必须带上 hasServer 守卫，
 * 否则无服务器时直接红（P3-1 命令面失真）。
 */
export const testEnv = {
  hasTweetKeys: !!process.env.TWEET_KEYS,
  hasInsCookies: !!process.env.INS_COOKIES,
  hasGeminiKey: !!process.env.GEMINI_API_KEY,
  hasDeepSeekKey: !!process.env.DEEPSEEK_API_KEY,
  hasServer: !!process.env.TEST_BASE_URL,
}
