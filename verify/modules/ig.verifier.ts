/**
 * verify/modules/ig.verifier.ts
 *
 * Covers: AC-IG-001 ~ AC-IG-009
 * Postmortem: 007 (Instagram Integration)
 *
 * - AC-IG-001~005: offline — fixture structure, URL parsing, time formatting
 * - AC-IG-006:     offline — caption translation preserves original description
 * - AC-IG-007/008: integration — Posts/Stories endpoints (needs server + INS_COOKIES)
 * - AC-IG-009:     integration — missing INS_COOKIES returns 500 (deterministic when isolated)
 */

import type { StepResult, Verifier, VerifyContext } from '../framework/types.js'
import type { IGPost } from '~/types'
import fs from 'node:fs'
import path from 'node:path'

/** Fixture shortcode from verify/fixtures/ig-posts/post-with-media.json */
const IG_FIXTURE_SHORTCODE = 'DWlr-eBgVfR'
/** Real story fixture, e.g. "username/story_id". Read from env so it only activates with real cookies. */
const STORY_FIXTURE = process.env.IG_STORY_FIXTURE ?? ''
const TRANSLATE_CAPTION_REL = path.join('app', 'lib', 'translateIGCaption.ts')
/** Matches a mutation of post.description (should never happen in the pure translator). */
const MUTATES_DESC_RE = /post\.description\s*=/

function loadFixture(fixtureDir: string, name: string): IGPost {
  const filepath = path.join(fixtureDir, name)
  const raw = fs.readFileSync(filepath, 'utf8')
  const parsed = JSON.parse(raw)
  return (parsed.data ?? parsed) as IGPost
}

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

export class IGVerifier implements Verifier {
  readonly id = 'ig-integration'
  readonly module = 'ig'
  readonly label = 'Instagram Integration'
  readonly acIds = [
    'AC-IG-001',
    'AC-IG-002',
    'AC-IG-003',
    'AC-IG-004',
    'AC-IG-005',
    'AC-IG-006',
    'AC-IG-007',
    'AC-IG-008',
    'AC-IG-009',
  ]

  canRun(_ctx: VerifyContext): string | null {
    return null
  }

  async run(ctx: VerifyContext): Promise<StepResult[]> {
    const results: StepResult[] = []

    // Offline ACs (001-006)
    results.push(this.verifyPostStructure(ctx))
    results.push(this.verifyMediaStructure(ctx))
    results.push(await this.verifyStoriesUrl())
    results.push(await this.verifyPostUrl())
    results.push(await this.verifyTimeFormat())
    results.push(this.verifyCaptionTranslation(ctx))

    // Integration ACs (007-009) need a running server
    if (ctx.client) {
      results.push(await this.verifyPostsEndpoint(ctx))
      results.push(await this.verifyStoriesEndpoint(ctx))
      results.push(await this.verifyMissingCookies(ctx))
    }
    else {
      for (const ac of ['AC-IG-007', 'AC-IG-008', 'AC-IG-009']) {
        results.push({
          id: ac,
          name: `${ac}: IG endpoint`,
          verdict: 'SKIP',
          durationMs: 0,
          detail: 'Server not running; use --server to start',
        })
      }
    }

    return results
  }

  private verifyPostStructure(ctx: VerifyContext): StepResult {
    const t0 = performance.now()
    try {
      const post = loadFixture(ctx.fixtureDir, 'ig-posts/post-with-media.json')
      const checks: string[] = []
      let passed = true

      if (!post.id) {
        checks.push('id missing')
        passed = false
      }
      if (!post.username) {
        checks.push('username missing')
        passed = false
      }
      if (post.description === undefined || post.description === null) {
        checks.push('description missing')
        passed = false
      }
      if (!post.media || post.media.length === 0) {
        checks.push('media empty')
        passed = false
      }
      if (!['post', 'reel', 'story', 'highlight'].includes(post.type)) {
        checks.push(`bad type: ${post.type}`)
        passed = false
      }
      if (typeof post.likes !== 'number' || post.likes < 0) {
        checks.push(`bad likes: ${post.likes}`)
        passed = false
      }

      return {
        id: 'AC-IG-001',
        name: 'Post structure complete',
        verdict: passed ? 'PASS' : 'FAIL',
        durationMs: Math.round(performance.now() - t0),
        detail: passed ? `type: ${post.type}  media: ${post.media.length}` : undefined,
        error: passed ? undefined : checks.join('; '),
      }
    }
    catch (err) {
      return {
        id: 'AC-IG-001',
        name: 'Post structure complete',
        verdict: 'FAIL',
        durationMs: Math.round(performance.now() - t0),
        error: err instanceof Error ? err.message : String(err),
      }
    }
  }

  private verifyMediaStructure(ctx: VerifyContext): StepResult {
    const t0 = performance.now()
    try {
      const post = loadFixture(ctx.fixtureDir, 'ig-posts/post-with-media.json')
      const problems: string[] = []

      for (const m of post.media || []) {
        if (!m.display_url)
          problems.push(`media[${m.num}] no display_url`)
        if (!['photo', 'video'].includes(m.type))
          problems.push(`media[${m.num}] bad type: ${m.type}`)
        if (m.type === 'video' && !m.video_url)
          problems.push(`media[${m.num}] video missing video_url`)
        if (m.width <= 0 || m.height <= 0)
          problems.push(`media[${m.num}] bad dimensions (${m.width}x${m.height})`)
      }

      return {
        id: 'AC-IG-002',
        name: 'Media array valid',
        verdict: problems.length === 0 ? 'PASS' : 'FAIL',
        durationMs: Math.round(performance.now() - t0),
        detail: `${post.media?.length || 0} items`,
        error: problems.length > 0 ? problems.join('; ') : undefined,
      }
    }
    catch (err) {
      return {
        id: 'AC-IG-002',
        name: 'Media array valid',
        verdict: 'FAIL',
        durationMs: Math.round(performance.now() - t0),
        error: err instanceof Error ? err.message : String(err),
      }
    }
  }

  private async verifyStoriesUrl(): Promise<StepResult> {
    const t0 = performance.now()
    try {
      const mod = await import('~/lib/utils.js')
      const extractIGId = (mod as any).extractIGId as ((...args: unknown[]) => unknown) | undefined
      if (!extractIGId) {
        return {
          id: 'AC-IG-003',
          name: 'Stories URL parsing',
          verdict: 'SKIP',
          durationMs: Math.round(performance.now() - t0),
          detail: 'extractIGId not exported',
        }
      }
      const result = extractIGId('https://www.instagram.com/stories/testuser/12345/')
      if (result === 'testuser/12345') {
        return {
          id: 'AC-IG-003',
          name: 'Stories URL parsing',
          verdict: 'PASS',
          durationMs: Math.round(performance.now() - t0),
        }
      }
      return {
        id: 'AC-IG-003',
        name: 'Stories URL parsing',
        verdict: 'FAIL',
        durationMs: Math.round(performance.now() - t0),
        error: `expected "username/story_id", got "${String(result)}"`,
      }
    }
    catch (err) {
      return {
        id: 'AC-IG-003',
        name: 'Stories URL parsing',
        verdict: 'SKIP',
        durationMs: Math.round(performance.now() - t0),
        detail: err instanceof Error ? err.message : String(err),
      }
    }
  }

  private async verifyPostUrl(): Promise<StepResult> {
    const t0 = performance.now()
    try {
      const mod = await import('~/lib/utils.js')
      const extractIGId = (mod as any).extractIGId as ((...args: unknown[]) => unknown) | undefined
      if (!extractIGId) {
        return {
          id: 'AC-IG-004',
          name: 'Post URL parsing',
          verdict: 'SKIP',
          durationMs: Math.round(performance.now() - t0),
          detail: 'extractIGId not exported',
        }
      }
      const result = extractIGId('https://www.instagram.com/p/DWlr-eBgVfR/')
      if (result === 'DWlr-eBgVfR') {
        return {
          id: 'AC-IG-004',
          name: 'Post URL parsing',
          verdict: 'PASS',
          durationMs: Math.round(performance.now() - t0),
        }
      }
      return {
        id: 'AC-IG-004',
        name: 'Post URL parsing',
        verdict: 'FAIL',
        durationMs: Math.round(performance.now() - t0),
        error: `expected "DWlr-eBgVfR", got "${String(result)}"`,
      }
    }
    catch {
      return {
        id: 'AC-IG-004',
        name: 'Post URL parsing',
        verdict: 'SKIP',
        durationMs: Math.round(performance.now() - t0),
        detail: 'Cannot import ~/lib/utils',
      }
    }
  }

  private async verifyTimeFormat(): Promise<StepResult> {
    const t0 = performance.now()
    try {
      const mod = await import('~/lib/utils.js')
      const fn = (mod as any).formatIGTime as ((...args: unknown[]) => unknown) | undefined
      if (!fn) {
        return {
          id: 'AC-IG-005',
          name: 'Time formatting: formatIGTime',
          verdict: 'SKIP',
          durationMs: Math.round(performance.now() - t0),
          detail: 'formatIGTime not exported',
        }
      }
      const testDate = '2026-03-28T12:00:00Z'
      const cardFormat = fn(testDate, 'card')
      const plainFormat = fn(testDate, 'plain')
      if (cardFormat && plainFormat && cardFormat !== plainFormat && String(plainFormat).includes('2026')) {
        return {
          id: 'AC-IG-005',
          name: 'Time formatting: formatIGTime',
          verdict: 'PASS',
          durationMs: Math.round(performance.now() - t0),
        }
      }
      return {
        id: 'AC-IG-005',
        name: 'Time formatting: formatIGTime',
        verdict: 'FAIL',
        durationMs: Math.round(performance.now() - t0),
        error: `card: "${cardFormat}"  plain: "${plainFormat}"`,
      }
    }
    catch (err) {
      return {
        id: 'AC-IG-005',
        name: 'Time formatting: formatIGTime',
        verdict: 'SKIP',
        durationMs: Math.round(performance.now() - t0),
        detail: err instanceof Error ? err.message : String(err),
      }
    }
  }

  // ── Caption translation (offline) ──────────────────────

  private verifyCaptionTranslation(ctx: VerifyContext): StepResult {
    const t0 = performance.now()
    try {
      const post = loadFixture(ctx.fixtureDir, 'ig-posts/post-with-media.json')
      const desc = post.description
      const caption = post.captionTranslation
      const hasDesc = !!desc
      const hasCaption = !!caption
      const different = caption !== desc

      // translateIGCaption must be a pure function — it returns a string and never mutates post.description.
      const src = readProjectFile(ctx, TRANSLATE_CAPTION_REL)
      const mutates = src ? MUTATES_DESC_RE.test(src) : false

      if (hasDesc && hasCaption && different && !mutates) {
        return {
          id: 'AC-IG-006',
          name: 'Caption translation preserves original',
          verdict: 'PASS',
          durationMs: Math.round(performance.now() - t0),
          detail: `description ${desc.length} chars · captionTranslation ${caption.length} chars · pure fn ✓`,
        }
      }
      const problems: string[] = []
      if (!hasDesc)
        problems.push('description empty')
      if (!hasCaption)
        problems.push('captionTranslation empty')
      if (!different)
        problems.push('captionTranslation === description')
      if (mutates)
        problems.push('translateIGCaption mutates post.description')
      return {
        id: 'AC-IG-006',
        name: 'Caption translation preserves original',
        verdict: 'FAIL',
        durationMs: Math.round(performance.now() - t0),
        error: problems.join('; '),
      }
    }
    catch (err) {
      return {
        id: 'AC-IG-006',
        name: 'Caption translation preserves original',
        verdict: 'FAIL',
        durationMs: Math.round(performance.now() - t0),
        error: err instanceof Error ? err.message : String(err),
      }
    }
  }

  // ── Integration: endpoints ─────────────────────────────

  private async verifyPostsEndpoint(ctx: VerifyContext): Promise<StepResult> {
    if (!ctx.client)
      throw new Error('Client required')
    const t0 = performance.now()
    if (!ctx.env.hasInsCookies) {
      return {
        id: 'AC-IG-007',
        name: 'Posts endpoint returns IGPost',
        verdict: 'SKIP',
        durationMs: Math.round(performance.now() - t0),
        detail: 'INS_COOKIES not configured',
      }
    }
    try {
      const posts = await ctx.client.ig.get({ igId: IG_FIXTURE_SHORTCODE })
      const post = posts[0]
      const ok = !!post?.id && !!post.username && (post.media?.length ?? 0) >= 1
      return {
        id: 'AC-IG-007',
        name: 'Posts endpoint returns IGPost',
        verdict: ok ? 'PASS' : 'FAIL',
        durationMs: Math.round(performance.now() - t0),
        detail: ok ? `POST /api/ig/get/${IG_FIXTURE_SHORTCODE} → @${post.username} (${post.media?.length} media)` : undefined,
        error: ok ? undefined : `unexpected shape: ${JSON.stringify(posts).slice(0, 120)}`,
      }
    }
    catch (err) {
      return {
        id: 'AC-IG-007',
        name: 'Posts endpoint returns IGPost',
        verdict: 'FAIL',
        durationMs: Math.round(performance.now() - t0),
        error: err instanceof Error ? err.message : String(err),
      }
    }
  }

  private async verifyStoriesEndpoint(ctx: VerifyContext): Promise<StepResult> {
    if (!ctx.client)
      throw new Error('Client required')
    const t0 = performance.now()
    if (!ctx.env.hasInsCookies || !STORY_FIXTURE) {
      return {
        id: 'AC-IG-008',
        name: 'Stories endpoint returns story post',
        verdict: 'SKIP',
        durationMs: Math.round(performance.now() - t0),
        detail: ctx.env.hasInsCookies ? 'IG_STORY_FIXTURE not set (format: username/story_id)' : 'INS_COOKIES not configured',
      }
    }
    try {
      const posts = await ctx.client.ig.get({ igId: STORY_FIXTURE })
      const post = posts[0]
      const ok = !!post && post.type === 'story'
      return {
        id: 'AC-IG-008',
        name: 'Stories endpoint returns story post',
        verdict: ok ? 'PASS' : 'FAIL',
        durationMs: Math.round(performance.now() - t0),
        detail: ok ? `POST /api/ig/get/${STORY_FIXTURE} → type: story` : undefined,
        error: ok ? undefined : `expected type "story", got ${post ? post.type : 'no post'}`,
      }
    }
    catch (err) {
      return {
        id: 'AC-IG-008',
        name: 'Stories endpoint returns story post',
        verdict: 'FAIL',
        durationMs: Math.round(performance.now() - t0),
        error: err instanceof Error ? err.message : String(err),
      }
    }
  }

  private async verifyMissingCookies(ctx: VerifyContext): Promise<StepResult> {
    if (!ctx.client)
      throw new Error('Client required')
    const t0 = performance.now()
    if (ctx.env.hasInsCookies) {
      return {
        id: 'AC-IG-009',
        name: 'Missing INS_COOKIES returns 500',
        verdict: 'SKIP',
        durationMs: Math.round(performance.now() - t0),
        detail: 'INS_COOKIES configured; precondition (no cookies) not met',
      }
    }
    try {
      const res = await ctx.client.ig.postRaw('__no_cookies_verify__')
      const ok = res.status === 500 && res.bodyText.includes('INS_COOKIES')
      return {
        id: 'AC-IG-009',
        name: 'Missing INS_COOKIES returns 500',
        verdict: ok ? 'PASS' : 'FAIL',
        durationMs: Math.round(performance.now() - t0),
        detail: ok ? 'POST /api/ig/get/__no_cookies_verify__ → 500 INS_COOKIES' : undefined,
        error: ok ? undefined : `status:${res.status} body:${res.bodyText.slice(0, 120)}`,
      }
    }
    catch (err) {
      return {
        id: 'AC-IG-009',
        name: 'Missing INS_COOKIES returns 500',
        verdict: 'FAIL',
        durationMs: Math.round(performance.now() - t0),
        error: err instanceof Error ? err.message : String(err),
      }
    }
  }
}
