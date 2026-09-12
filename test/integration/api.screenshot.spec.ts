import type { EnrichedTweet } from '~/types'
/**
 * test/integration/api.screenshot.spec.ts
 *
 * L2 集成层 — 截图 plain 端点：
 * AC-SHOT-001（/plain-tweet/:id）/ AC-SHOT-002（/plain-ins/:id）。
 *
 * F7 修复（review-2026-09-11 P1-4）：原实现用无效 id 且只断言「含 HTML」——
 * NotFound 页同样满足，等于负例冒充正例；有 key 时还写成 `if (hasKeys) expect(...)`
 * 条件断言（F10 也拦）。现拆为：无凭据时断言确定性 HTML 外壳；有凭据时用**真实
 * fixture id + 内容特征**单独断言（`it.skipIf` 显式跳过，而非条件断言）。
 */
import { describe, expect, it } from 'vitest'
import { testEnv } from '../helpers/env'
import { loadFixture } from '../helpers/load-fixture'
import { getClient } from '../helpers/test-context'

const HTML_RE = /<!DOCTYPE html>|<html/i
const IG_FIXTURE_SHORTCODE = 'DWlr-eBgVfR'
const IG_FIXTURE_USERNAME = 'meeeei.gt'

describe.skipIf(!testEnv.hasServer)('AC-SHOT plain screenshot endpoints', () => {
  it('AC-SHOT-001: plain tweet endpoint returns an HTML shell', async () => {
    const html = await getClient().plain.tweet('__screenshot_verify__')
    expect(html).toMatch(HTML_RE)
  })

  it.skipIf(!testEnv.hasTweetKeys)('AC-SHOT-001: plain tweet endpoint renders real tweet content (needs TWEET_KEYS)', async () => {
    const tweet = loadFixture<EnrichedTweet>('tweets/normal-ja.json')
    const html = await getClient().plain.tweet(tweet.id_str)

    expect(html).toMatch(HTML_RE)
    expect(html).toContain(tweet.user.screen_name)
  })

  it('AC-SHOT-002: plain IG endpoint returns an HTML shell', async () => {
    const html = await getClient().plain.ig('__screenshot_verify__')
    expect(html).toMatch(HTML_RE)
  })

  it.skipIf(!testEnv.hasInsCookies)('AC-SHOT-002: plain IG endpoint renders real post content (needs INS_COOKIES)', async () => {
    const html = await getClient().plain.ig(IG_FIXTURE_SHORTCODE)

    expect(html).toMatch(HTML_RE)
    expect(html).toContain(IG_FIXTURE_USERNAME)
  })
})
