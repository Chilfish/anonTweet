/**
 * verify/modules/screenshot.verifier.ts
 *
 * Covers: AC-SHOT-001 ~ AC-SHOT-004
 * Postmortem: 008 (Fonts & Rendering)
 *
 * - AC-SHOT-001/002: integration — plain endpoints return HTML (needs running server)
 * - AC-SHOT-003:     static scan — screenshot hooks wait for render-ready
 * - AC-SHOT-004:     static scan — fonts use font-display: swap
 */

import type { StepResult, Verifier, VerifyContext } from '../framework/types.js'
import fs from 'node:fs'
import path from 'node:path'

const UTILS_REL = path.join('app', 'lib', 'utils.ts')
const TWEET_HOOK_REL = path.join('app', 'hooks', 'use-screenshot-action.ts')
const IG_HOOK_REL = path.join('app', 'hooks', 'use-ig-screenshot-action.ts')
const FONTS_CSS_REL = path.join('app', 'fonts.css')

const WAIT_RENDER_READY = 'waitForRenderReady'
const IG_FIXTURE_SHORTCODE = 'DWlr-eBgVfR'
const IG_FIXTURE_USERNAME = 'meeeei.gt'
const HTML_RE = /<!DOCTYPE html>|<html/i

/** Absolute path to a project file, derived from the fixture dir. */
function projectPath(ctx: VerifyContext, rel: string): string {
  // fixtureDir = <root>/verify/fixtures  →  root = ../..
  return path.resolve(ctx.fixtureDir, '..', '..', rel)
}

function readProjectFile(ctx: VerifyContext, rel: string): string | null {
  const filepath = projectPath(ctx, rel)
  if (!fs.existsSync(filepath))
    return null
  return fs.readFileSync(filepath, 'utf8')
}

export class ScreenshotVerifier implements Verifier {
  readonly id = 'screenshot-export'
  readonly module = 'screenshot'
  readonly label = 'Screenshot Export'
  readonly acIds = [
    'AC-SHOT-001',
    'AC-SHOT-002',
    'AC-SHOT-003',
    'AC-SHOT-004',
  ]

  canRun(_ctx: VerifyContext): string | null {
    return null
  }

  async run(ctx: VerifyContext): Promise<StepResult[]> {
    const results: StepResult[] = []

    // AC-SHOT-001/002 require a running server
    if (ctx.client) {
      results.push(await this.verifyTweetEndpoint(ctx))
      results.push(await this.verifyIGEndpoint(ctx))
    }
    else {
      for (const ac of ['AC-SHOT-001', 'AC-SHOT-002']) {
        results.push({
          id: ac,
          name: `${ac}: plain endpoint`,
          verdict: 'SKIP',
          durationMs: 0,
          detail: 'Server not running; use --server to start',
        })
      }
    }

    results.push(this.verifyRenderReady(ctx))
    results.push(this.verifyFontDisplay(ctx))

    return results
  }

  // ── Integration: plain endpoints ─────────────────────────

  private async verifyTweetEndpoint(ctx: VerifyContext): Promise<StepResult> {
    if (!ctx.client)
      throw new Error('Client required')
    const t0 = performance.now()
    try {
      // Invalid ID renders <TweetNotFound>, still a 200 HTML page
      const html = await ctx.client.plain.tweet('__screenshot_verify__')
      if (HTML_RE.test(html)) {
        return {
          id: 'AC-SHOT-001',
          name: 'Plain tweet endpoint returns HTML',
          verdict: 'PASS',
          durationMs: Math.round(performance.now() - t0),
          detail: 'GET /plain-tweet/:id → 200 HTML',
        }
      }
      return {
        id: 'AC-SHOT-001',
        name: 'Plain tweet endpoint returns HTML',
        verdict: 'FAIL',
        durationMs: Math.round(performance.now() - t0),
        error: 'response missing <!DOCTYPE html> / <html>',
      }
    }
    catch (err) {
      return {
        id: 'AC-SHOT-001',
        name: 'Plain tweet endpoint returns HTML',
        verdict: 'FAIL',
        durationMs: Math.round(performance.now() - t0),
        error: err instanceof Error ? err.message : String(err),
      }
    }
  }

  private async verifyIGEndpoint(ctx: VerifyContext): Promise<StepResult> {
    if (!ctx.client)
      throw new Error('Client required')
    const t0 = performance.now()
    try {
      // With cookies hit a real shortcode and assert post content;
      // otherwise a bogus id still renders <IGNotFound> as 200 HTML.
      const id = ctx.env.hasInsCookies ? IG_FIXTURE_SHORTCODE : '__screenshot_verify__'
      const html = await ctx.client.plain.ig(id)
      const isHtml = HTML_RE.test(html)
      const hasContent = !ctx.env.hasInsCookies || html.includes(IG_FIXTURE_USERNAME)
      if (isHtml && hasContent) {
        return {
          id: 'AC-SHOT-002',
          name: 'Plain IG endpoint returns HTML',
          verdict: 'PASS',
          durationMs: Math.round(performance.now() - t0),
          detail: ctx.env.hasInsCookies
            ? `GET /plain-ins/:id → 200 HTML (post content ✓)`
            : 'GET /plain-ins/:id → 200 HTML',
        }
      }
      return {
        id: 'AC-SHOT-002',
        name: 'Plain IG endpoint returns HTML',
        verdict: 'FAIL',
        durationMs: Math.round(performance.now() - t0),
        error: `html:${isHtml} content:${hasContent}`,
      }
    }
    catch (err) {
      return {
        id: 'AC-SHOT-002',
        name: 'Plain IG endpoint returns HTML',
        verdict: 'FAIL',
        durationMs: Math.round(performance.now() - t0),
        error: err instanceof Error ? err.message : String(err),
      }
    }
  }

  // ── Static scans ─────────────────────────────────────────

  private verifyRenderReady(ctx: VerifyContext): StepResult {
    const t0 = performance.now()
    const checks: Array<[string, boolean]> = [
      ['waitForRenderReady defined', readProjectFile(ctx, UTILS_REL)?.includes('export async function waitForRenderReady') ?? false],
      ['tweet hook waits for it', readProjectFile(ctx, TWEET_HOOK_REL)?.includes(WAIT_RENDER_READY) ?? false],
      ['ig hook waits for it', readProjectFile(ctx, IG_HOOK_REL)?.includes(WAIT_RENDER_READY) ?? false],
    ]
    const passed = checks.every(([, ok]) => ok)
    if (passed) {
      return {
        id: 'AC-SHOT-003',
        name: 'Screenshot hooks use waitForRenderReady',
        verdict: 'PASS',
        durationMs: Math.round(performance.now() - t0),
        detail: 'source scan: utils + tweet/ig hooks',
      }
    }
    const failed = checks.filter(([, ok]) => !ok).map(([label]) => label).join(', ')
    return {
      id: 'AC-SHOT-003',
      name: 'Screenshot hooks use waitForRenderReady',
      verdict: 'FAIL',
      durationMs: Math.round(performance.now() - t0),
      error: failed,
    }
  }

  private verifyFontDisplay(ctx: VerifyContext): StepResult {
    const t0 = performance.now()
    const css = readProjectFile(ctx, FONTS_CSS_REL)
    const hasSwap = css?.includes('font-display: swap') ?? false
    if (css && hasSwap) {
      return {
        id: 'AC-SHOT-004',
        name: 'Font rendering non-blocking',
        verdict: 'PASS',
        durationMs: Math.round(performance.now() - t0),
        detail: 'app/fonts.css font-display: swap',
      }
    }
    return {
      id: 'AC-SHOT-004',
      name: 'Font rendering non-blocking',
      verdict: 'FAIL',
      durationMs: Math.round(performance.now() - t0),
      error: css ? 'missing font-display: swap' : 'missing app/fonts.css',
    }
  }
}
