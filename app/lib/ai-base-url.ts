/**
 * 服务端 AI baseUrl 白名单（review P1-3 / AC-SEC-001）——**可选加固，默认关闭**。
 *
 * 客户端自带 Key 经服务端中继出网，若 `baseUrl` 可任意指定，服务端会变成任意 LLM
 * 端点的代理（SSRF/滥用面）。但自定义 baseUrl 同时是「第三方中转站 / 自建端点」场景的
 * 核心功能，强制白名单会堵死该路径。因此本模块默认**不启用**校验：任意 baseUrl 放行
 * （行为与引入白名单前一致，部署零配置）。
 *
 * 公开部署的部署方可设 `ENABLE_AI_BASE_URL_WHITELIST=true` 开启加固：此时仅放行
 * 内置官方域名 + `ALLOWED_AI_BASE_URL_HOSTS`（逗号分隔）扩展域名，其他一律拒绝。
 * 所有接受客户端 `baseUrl` 的服务端边界（ai-translation / vision / ai-test）在
 * provider 创建前统一调用 `isAllowedAIBaseUrl`，无绕过。
 *
 * 校验语义：无 `baseUrl`（undefined / 空白）放行——各 provider 策略回落官方默认端点
 * （app/lib/constants.ts）；hostname 精确匹配（大小写不敏感，防后缀伪装绕过）。
 */

import { env } from '~/lib/env.server'

/** 内置官方白名单（仅当白名单开启时生效） */
export const ALLOWED_AI_BASE_URL_HOSTS: ReadonlySet<string> = new Set([
  'generativelanguage.googleapis.com', // Google Gemini（默认 /v1beta）
  'api.deepseek.com', // DeepSeek 官方
  'openrouter.ai', // OpenRouter 网关
])

/** 白名单开关：默认关闭（第三方中转/自建端点直接可用） */
export function isAIBaseUrlWhitelistEnabled(): boolean {
  return env.ENABLE_AI_BASE_URL_WHITELIST
}

/**
 * 生效白名单 = 内置官方域名 + env `ALLOWED_AI_BASE_URL_HOSTS`（逗号分隔）扩展，
 * 均可注入覆盖以便测试（extra 参数优先于 env）。
 */
export function getAIBaseUrlWhitelistHosts(extra = env.ALLOWED_AI_BASE_URL_HOSTS): Set<string> {
  const extraHosts = (extra ?? '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
  return new Set([...ALLOWED_AI_BASE_URL_HOSTS, ...extraHosts])
}

/**
 * 校验客户端 baseUrl 是否被允许。
 *
 * - 默认（白名单关闭）：任意 baseUrl 放行，保持自定义端点（第三方中转/自建）可用；
 * - 开启后：仅放行白名单内 hostname（含路径/端口变体按 hostname 匹配），
 *   未提供 baseUrl 时放行（回落官方默认端点）。
 * - 测试可注入 `enabled` / `hosts` 覆盖环境配置。
 */
export function isAllowedAIBaseUrl(
  baseUrl: string | undefined | null,
  options: { enabled?: boolean, hosts?: ReadonlySet<string> } = {},
): boolean {
  const enabled = options.enabled ?? isAIBaseUrlWhitelistEnabled()
  if (!enabled)
    return true

  const hosts = options.hosts ?? getAIBaseUrlWhitelistHosts()

  if (!baseUrl || !baseUrl.trim())
    return true
  try {
    const url = new URL(baseUrl.trim())
    if (url.protocol !== 'https:' && url.protocol !== 'http:')
      return false
    // hostname 精确匹配（大小写不敏感），防 openrouter.ai.evil.com 之类后缀绕过
    return hosts.has(url.hostname.toLowerCase())
  }
  catch {
    // 非法 URL（非 URL 字符串 / 无法解析）一律拒绝
    return false
  }
}
