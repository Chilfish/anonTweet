import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const ALLOWLIST_EXPORT_RE = /export const ALLOWED_AI_BASE_URL_HOSTS/
const VALIDATOR_EXPORT_RE = /export function isAllowedAIBaseUrl/
const TOGGLE_EXPORT_RE = /export function isAIBaseUrlWhitelistEnabled/
const HOSTS_EXPORT_RE = /export function getAIBaseUrlWhitelistHosts/
const ENABLE_VAR_DEFAULT_FALSE_RE = /ENABLE_AI_BASE_URL_WHITELIST:\s*z\.stringbool\(\)\.default\(false\)/
const ALLOWED_HOSTS_VAR_RE = /ALLOWED_AI_BASE_URL_HOSTS:\s*z\.string\(\)\.optional\(\)/
const VALIDATOR_CALL_RE = /isAllowedAIBaseUrl\(/
const SDK_PROVIDER_RE = /createSDKProvider/
const RELAY_TEXT_RE = /Key 经服务器中继/
const WHITELIST_TEXT_RE = /白名单/
const ARBITRARY_ENDPOINT_TEXT_RE = /默认可指向任意端点/

/**
 * test/acceptance/ac-sec.spec.ts
 *
 * AC-SEC-001 仓库级静态检查（阶段二任务 4，review P1-3）：
 * 接受客户端 baseUrl 的服务端边界必须经 app/lib/ai-base-url.ts 校验。
 * 白名单为**可选加固（默认关闭）**——自定义 baseUrl（第三方中转/自建端点）默认可用，
 * 公开部署可设 ENABLE_AI_BASE_URL_WHITELIST=true 开启后按白名单拒绝（SSRF/滥用面收敛）；
 * 设置页须披露 Key 中继与开关语义。
 */

const read = (rel: string) => fs.readFileSync(path.resolve(import.meta.dirname, '..', '..', rel), 'utf8')

const HELPER = 'app/lib/ai-base-url.ts'
const ENV_SCHEMA = 'app/lib/env.server.ts'
const BOUNDARIES = [
  'app/routes/api/ai/ai-translation.ts',
  'app/routes/api/ai/vision.ts',
  'app/routes/api/ai/ai-test.ts',
] as const
const SETTINGS = 'app/components/settings/AITranslationSettings.tsx'

describe('AC-SEC-001: optional baseUrl allowlist helper exists and is wired on every boundary', () => {
  it('ai-base-url.ts exports the allowlist, validator and toggle', () => {
    const src = read(HELPER)
    expect(src).toMatch(ALLOWLIST_EXPORT_RE)
    expect(src).toMatch(VALIDATOR_EXPORT_RE)
    expect(src).toMatch(TOGGLE_EXPORT_RE)
    expect(src).toMatch(HOSTS_EXPORT_RE)
  })

  it('whitelist defaults OFF in env schema (arbitrary baseUrl allowed, zero-config deploy)', () => {
    const src = read(ENV_SCHEMA)
    // 开关存在且默认 false
    expect(src).toMatch(ENABLE_VAR_DEFAULT_FALSE_RE)
    // 扩展域名字段存在
    expect(src).toMatch(ALLOWED_HOSTS_VAR_RE)
  })

  for (const rel of BOUNDARIES) {
    it(`${path.basename(rel)} imports and calls isAllowedAIBaseUrl before provider creation`, () => {
      const src = read(rel)
      expect(src).toContain('from \'~/lib/ai-base-url\'')
      expect(src).toMatch(VALIDATOR_CALL_RE)
      // provider 工厂同一个文件里被使用（说明校验与 provider 创建共存，未被删掉）
      expect(src).toMatch(SDK_PROVIDER_RE)
    })
  }

  it('no bypass: boundaries do not accept baseUrl without validation in any branch', () => {
    const aiSrc = read(BOUNDARIES[0])
    // twitter + ins 两个分支都必须校验（至少出现 2 次调用）
    const aiCalls = aiSrc.match(/isAllowedAIBaseUrl\(baseUrl\)/g)?.length ?? 0
    expect(aiCalls).toBeGreaterThanOrEqual(2)

    const visionSrc = read(BOUNDARIES[1])
    // generate + translate 两个分支都必须校验
    const visionCalls = visionSrc.match(/isAllowedAIBaseUrl\(baseUrl\)/g)?.length ?? 0
    expect(visionCalls).toBeGreaterThanOrEqual(2)
  })

  it('settings page discloses key relay, allowlist and default-off semantics', () => {
    const src = read(SETTINGS)
    expect(src).toMatch(RELAY_TEXT_RE)
    expect(src).toMatch(WHITELIST_TEXT_RE)
    // 声明自定义 Base URL 默认可指向任意端点（第三方中转/自建）
    expect(src).toMatch(ARBITRARY_ENDPOINT_TEXT_RE)
  })
})
