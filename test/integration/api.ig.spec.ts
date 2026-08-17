import type { IGPost } from '~/types'
/**
 * test/integration/api.ig.spec.ts
 *
 * L2 集成层 — Instagram API（自 verify/modules/ig.verifier.ts 集成 AC 迁移，Phase C）：
 * AC-IG-007（posts 端点，需 INS_COOKIES）/ 008（stories 端点，需 INS_COOKIES + IG_STORY_FIXTURE）/
 * 009（无 cookies → 500，隔离环境确定性 PASS）。
 */
import { describe, expect, it } from 'vitest'
import { testEnv } from '../helpers/env'
import { getClient } from '../helpers/test-context'

const IG_FIXTURE_SHORTCODE = 'DWlr-eBgVfR'
const STORY_FIXTURE = process.env.IG_STORY_FIXTURE

describe.skipIf(!testEnv.hasServer)('AC-IG-009 missing cookies', () => {
  it('AC-IG-009: missing INS_COOKIES returns 500', async () => {
    // 隔离服务器（无 INS_COOKIES）下确定性断言；有 key 时前置条件不满足 → 跳过
    const res = await getClient().ig.postRaw('__no_cookies_verify__')
    expect(res.status).toBe(500)
    expect(res.bodyText).toContain('INS_COOKIES')
  })
})

describe.skipIf(!testEnv.hasServer || !testEnv.hasInsCookies)('AC-IG-007/008 IG endpoints (needs INS_COOKIES + server)', () => {
  it('AC-IG-007: posts endpoint returns IGPost', async () => {
    const posts = await getClient().ig.get({ igId: IG_FIXTURE_SHORTCODE })
    const post = posts[0] as IGPost | undefined

    expect(post?.id).toBeTruthy()
    expect(post?.username).toBeTruthy()
    expect(post?.media?.length).toBeGreaterThanOrEqual(1)
  })

  it.skipIf(!STORY_FIXTURE)('AC-IG-008: stories endpoint returns story post', async () => {
    const posts = await getClient().ig.get({ igId: STORY_FIXTURE! })
    const post = posts[0] as IGPost | undefined

    expect(post?.type).toBe('story')
  })
})
