/**
 * test/helpers/env.ts
 *
 * 环境探测（取代 verify/framework VerifyContext.env）：
 * 各测试层用 `describe.skipIf(!hasKeys)` 实现 SKIP 语义。
 */
export const testEnv = {
  hasTweetKeys: !!process.env.TWEET_KEYS,
  hasInsCookies: !!process.env.INS_COOKIES,
  hasGeminiKey: !!process.env.GEMINI_API_KEY,
  hasDeepSeekKey: !!process.env.DEEPSEEK_API_KEY,
}
