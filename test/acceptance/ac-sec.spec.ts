import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * test/acceptance/ac-sec.spec.ts
 *
 * AC-SEC-001 仓库级静态检查（阶段二任务 4，review P1-3）：
 * 接受客户端 baseUrl 的服务端边界必须经 app/lib/ai-base-url.ts 白名单校验，
 * 防止 BFF 成为任意 LLM 端点的代理（SSRF/滥用面）；设置页须披露 Key 中继。
 */

const read = (rel: string) => fs.readFileSync(path.resolve(import.meta.dirname, '..', '..', rel), 'utf8')

const HELPER = 'app/lib/ai-base-url.ts'
const BOUNDARIES = [
  'app/routes/api/ai/ai-translation.ts',
  'app/routes/api/ai/vision.ts',
  'app/routes/api/ai/ai-test.ts',
] as const
const SETTINGS = 'app/components/settings/AITranslationSettings.tsx'

describe('AC-SEC-001: allowlist helper exists and is used on every baseUrl boundary', () => {
  it('ai-base-url.ts exports the allowlist and validator', () => {
    const src = read(HELPER)
    expect(src).toMatch(/export const ALLOWED_AI_BASE_URL_HOSTS/)
    expect(src).toMatch(/export function isAllowedAIBaseUrl/)
  })

  for (const rel of BOUNDARIES) {
    it(`${path.basename(rel)} imports and calls isAllowedAIBaseUrl before provider creation`, () => {
      const src = read(rel)
      expect(src).toContain('from \'~/lib/ai-base-url\'')
      expect(src).toMatch(/isAllowedAIBaseUrl\(/)
      // provider 工厂同一个文件里被使用（说明校验与 provider 创建共存，未被删掉）
      expect(src).toMatch(/createSDKProvider/)
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

  it('settings page discloses key relay and baseUrl allowlist', () => {
    const src = read(SETTINGS)
    expect(src).toMatch(/Key 经服务器中继/)
    expect(src).toMatch(/白名单/)
  })
})
