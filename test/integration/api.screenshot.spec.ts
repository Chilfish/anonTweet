/**
 * test/integration/api.screenshot.spec.ts
 *
 * L2 集成层 — 截图 plain 端点（自 verify/modules/screenshot.verifier.ts 集成 AC 迁移，Phase C）：
 * AC-SHOT-001（/plain-tweet/:id 返回 HTML）/ 002（/plain-ins/:id 返回 HTML，有 INS_COOKIES 时断言内容）。
 * 无效 ID 仍渲染 NotFound 页 → 200 HTML，离线确定性。
 */
import { describe, expect, it } from 'vitest'
import { testEnv } from '../helpers/env'
import { getClient } from '../helpers/test-context'

const HTML_RE = /<!DOCTYPE html>|<html/i
const IG_FIXTURE_SHORTCODE = 'DWlr-eBgVfR'
const IG_FIXTURE_USERNAME = 'meeeei.gt'

describe('AC-SHOT plain screenshot endpoints', () => {
  it('AC-SHOT-001: plain tweet endpoint returns HTML', async () => {
    const html = await getClient().plain.tweet('__screenshot_verify__')
    expect(html).toMatch(HTML_RE)
  })

  it('AC-SHOT-002: plain IG endpoint returns HTML', async () => {
    const id = testEnv.hasInsCookies ? IG_FIXTURE_SHORTCODE : '__screenshot_verify__'
    const html = await getClient().plain.ig(id)

    expect(html).toMatch(HTML_RE)
    if (testEnv.hasInsCookies)
      expect(html).toContain(IG_FIXTURE_USERNAME)
  })
})
