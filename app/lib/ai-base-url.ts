/**
 * 服务端 AI baseUrl 白名单（review P1-3 / AC-SEC-001）。
 *
 * 客户端自带 Key 经服务端中继出网，若 `baseUrl` 可任意指定，服务端会变成任意 LLM
 * 端点的代理（SSRF/滥用面）。所有接受客户端 `baseUrl` 的服务端边界（ai-translation /
 * vision / ai-test）必须先经 `isAllowedAIBaseUrl` 校验：仅放行已知提供商官方域名
 * （含路径/端口变体按 hostname 精确匹配），其他一律拒绝。
 *
 * 无 `baseUrl`（undefined / 空白）放行——各 provider 策略回落官方默认端点
 * （app/lib/constants.ts）。
 */
export const ALLOWED_AI_BASE_URL_HOSTS: ReadonlySet<string> = new Set([
  'generativelanguage.googleapis.com', // Google Gemini（默认 /v1beta）
  'api.deepseek.com', // DeepSeek 官方
  'openrouter.ai', // OpenRouter 网关
])

export function isAllowedAIBaseUrl(baseUrl: string | undefined | null): boolean {
  if (!baseUrl || !baseUrl.trim())
    return true
  try {
    const url = new URL(baseUrl.trim())
    if (url.protocol !== 'https:' && url.protocol !== 'http:')
      return false
    // hostname 精确匹配（大小写不敏感），防 openrouter.ai.evil.com 之类后缀绕过
    return ALLOWED_AI_BASE_URL_HOSTS.has(url.hostname.toLowerCase())
  }
  catch {
    // 非法 URL（非 URL 字符串 / 无法解析）一律拒绝
    return false
  }
}
