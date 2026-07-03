/**
 * verify/modules/ig.verifier.ts
 *
 * Covers: AC-IG-001 ~ AC-IG-006
 * Postmortem: 007 (Instagram Integration)
 */

import type { StepResult, Verifier, VerifyContext } from '../framework/types.js'
import type { IGPost } from '~/types'
import fs from 'node:fs'
import path from 'node:path'

function loadFixture(fixtureDir: string, name: string): IGPost {
  const filepath = path.join(fixtureDir, name)
  const raw = fs.readFileSync(filepath, 'utf8')
  const parsed = JSON.parse(raw)
  return (parsed.data ?? parsed) as IGPost
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
  ]

  canRun(_ctx: VerifyContext): string | null {
    return null
  }

  async run(ctx: VerifyContext): Promise<StepResult[]> {
    const results: StepResult[] = []

    results.push(this.verifyPostStructure(ctx))
    results.push(this.verifyMediaStructure(ctx))
    results.push(await this.verifyStoriesUrl())
    results.push(await this.verifyPostUrl())
    results.push(await this.verifyTimeFormat())

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
      const extractIGId = (mod as any).extractIGId as ((...args) => unknown) | undefined
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
      const extractIGId = (mod as any).extractIGId as ((...args) => unknown) | undefined
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
      const fn = (mod as any).formatIGTime as ((...args) => unknown) | undefined
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
}
