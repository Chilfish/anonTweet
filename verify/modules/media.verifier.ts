/**
 * verify/modules/media.verifier.ts
 *
 * Covers: AC-MEDIA-001 ~ AC-MEDIA-006
 * Postmortem: 005 (Media Handling) — scattered/unified media proxy
 *
 * - AC-MEDIA-001/002/003: integration — proxy endpoint behavior (needs running server)
 * - AC-MEDIA-004/005/006: static scans — idempotent guard, unified proxy, video_url
 *
 * Determinism: the "proxy reachable" ACs do NOT hit real CDNs. A local pixel-image
 * server (Bun.serve, random port) serves a 1×1 PNG so the proxy's two allowlist
 * branches are exercised offline — suffix allowlist (AC-001) and IG-domain
 * allowlist (AC-002).
 */

import type { StepResult, Verifier, VerifyContext } from '../framework/types.js'
import fs from 'node:fs'
import path from 'node:path'

// 1×1 PNG (base64). Served by the local pixel server as the upstream image.
const PIXEL_PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

const APPCONFIG_REL = path.join('app', 'lib', 'stores', 'appConfig.ts')
const TWEET_CARD_REL = path.join('app', 'components', 'tweet', 'TweetCard.tsx')
const REACT_TWEET_UTILS_REL = path.join('app', 'lib', 'react-tweet', 'utils', 'index.ts')
const TWEET_MEDIA_RELS = [
  path.join('app', 'lib', 'react-tweet', 'twitter-theme', 'tweet-media.tsx'),
  path.join('app', 'lib', 'react-tweet', 'twitter-theme', 'tweet-media-video.tsx'),
]
const IG_MEDIA_GRID_REL = path.join('app', 'components', 'ins', 'IGMediaGrid.tsx')
const IG_TYPES_REL = path.join('app', 'types', 'ins.ts')

/** Restricted Tweet CDNs — screenshot/media components must not hardcode these. */
const RESTRICTED_CDNS = ['pbs.twimg.com', 'video.twimg.com']

/** Matches source files (.ts / .tsx). Non-capturing group — regex is static. */
const TS_FILE_RE = /\.(?:ts|tsx)$/

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

/** Recursively list .ts/.tsx files under a dir (skipping node_modules). */
function walkTsFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkTsFiles(full, out)
    }
    else if (TS_FILE_RE.test(entry.name)) {
      out.push(full)
    }
  }
  return out
}

/** Start a local HTTP server that answers every path with a 1×1 PNG. */
async function startPixelServer(): Promise<{ url: string, stop: () => Promise<void> }> {
  const png = Buffer.from(PIXEL_PNG_B64, 'base64')
  const server = Bun.serve({
    port: 0, // random free port
    fetch() {
      return new Response(png, {
        headers: {
          'Content-Type': 'image/png',
          'Content-Length': String(png.byteLength),
        },
      })
    },
  })
  return {
    url: `http://localhost:${server.port}`,
    stop: async () => {
      await server.stop(true)
    },
  }
}

export class MediaVerifier implements Verifier {
  readonly id = 'media-proxy'
  readonly module = 'media'
  readonly label = 'Media Proxy'
  readonly acIds = [
    'AC-MEDIA-001',
    'AC-MEDIA-002',
    'AC-MEDIA-003',
    'AC-MEDIA-004',
    'AC-MEDIA-005',
    'AC-MEDIA-006',
  ]

  canRun(_ctx: VerifyContext): string | null {
    return null
  }

  async run(ctx: VerifyContext): Promise<StepResult[]> {
    const results: StepResult[] = []

    // AC-MEDIA-001/002/003 require a running server
    if (ctx.client) {
      const pixel = await startPixelServer()
      try {
        results.push(await this.verifyTweetProxy(ctx, pixel.url))
        results.push(await this.verifyIGProxy(ctx, pixel.url))
        results.push(await this.verifyProxyErrors(ctx))
      }
      finally {
        await pixel.stop().catch(() => {})
      }
    }
    else {
      for (const ac of ['AC-MEDIA-001', 'AC-MEDIA-002', 'AC-MEDIA-003']) {
        results.push({
          id: ac,
          name: `${ac}: proxy endpoint`,
          verdict: 'SKIP',
          durationMs: 0,
          detail: 'Server not running; use --server to start',
        })
      }
    }

    results.push(this.verifyNoDoubleProxy(ctx))
    results.push(this.verifyUnifiedProxy(ctx))
    results.push(this.verifyVideoUrl(ctx))

    return results
  }

  // ── Integration: proxy endpoint ────────────────────────

  private async verifyTweetProxy(ctx: VerifyContext, pixelUrl: string): Promise<StepResult> {
    if (!ctx.client)
      throw new Error('Client required')
    const t0 = performance.now()
    try {
      // Suffix allowlist: *.png URL passes IMAGE_EXT_RE, upstream is the local pixel server.
      const res = await ctx.client.proxy.image(`${pixelUrl}/tweet-sample.png`)
      const ok = res.status === 200 && (res.contentType ?? '').includes('image/png')
      return {
        id: 'AC-MEDIA-001',
        name: 'Tweet image proxy reachable',
        verdict: ok ? 'PASS' : 'FAIL',
        durationMs: Math.round(performance.now() - t0),
        detail: ok ? `GET /api/proxy/image?url=*.png → 200 ${res.contentType}` : undefined,
        error: ok ? undefined : `status:${res.status} contentType:${res.contentType}`,
      }
    }
    catch (err) {
      return {
        id: 'AC-MEDIA-001',
        name: 'Tweet image proxy reachable',
        verdict: 'FAIL',
        durationMs: Math.round(performance.now() - t0),
        error: err instanceof Error ? err.message : String(err),
      }
    }
  }

  private async verifyIGProxy(ctx: VerifyContext, pixelUrl: string): Promise<StepResult> {
    if (!ctx.client)
      throw new Error('Client required')
    const t0 = performance.now()
    try {
      // Domain allowlist: URL contains cdninstagram.com (path points at the local pixel server).
      const res = await ctx.client.proxy.image(`${pixelUrl}/scontent.cdninstagram.com/pixel`)
      const ok = res.status === 200 && (res.contentType ?? '').includes('image/png')
      return {
        id: 'AC-MEDIA-002',
        name: 'IG image proxy reachable',
        verdict: ok ? 'PASS' : 'FAIL',
        durationMs: Math.round(performance.now() - t0),
        detail: ok ? `GET /api/proxy/image?url=…cdninstagram.com… → 200 ${res.contentType}` : undefined,
        error: ok ? undefined : `status:${res.status} contentType:${res.contentType}`,
      }
    }
    catch (err) {
      return {
        id: 'AC-MEDIA-002',
        name: 'IG image proxy reachable',
        verdict: 'FAIL',
        durationMs: Math.round(performance.now() - t0),
        error: err instanceof Error ? err.message : String(err),
      }
    }
  }

  private async verifyProxyErrors(ctx: VerifyContext): Promise<StepResult> {
    if (!ctx.client)
      throw new Error('Client required')
    const t0 = performance.now()
    try {
      const missing = await ctx.client.proxy.image('')
      const disallowed = await ctx.client.proxy.image('https://example.com/evil.txt')
      const missingOk = missing.status === 400
      const disallowedOk = disallowed.status === 403
      if (missingOk && disallowedOk) {
        return {
          id: 'AC-MEDIA-003',
          name: 'Invalid URL returns error',
          verdict: 'PASS',
          durationMs: Math.round(performance.now() - t0),
          detail: 'missing url → 400 · non-allowlist → 403',
        }
      }
      return {
        id: 'AC-MEDIA-003',
        name: 'Invalid URL returns error',
        verdict: 'FAIL',
        durationMs: Math.round(performance.now() - t0),
        error: `missing:${missing.status} (want 400)  disallowed:${disallowed.status} (want 403)`,
      }
    }
    catch (err) {
      return {
        id: 'AC-MEDIA-003',
        name: 'Invalid URL returns error',
        verdict: 'FAIL',
        durationMs: Math.round(performance.now() - t0),
        error: err instanceof Error ? err.message : String(err),
      }
    }
  }

  // ── Static scans ───────────────────────────────────────

  private verifyNoDoubleProxy(ctx: VerifyContext): StepResult {
    const t0 = performance.now()
    const appConfig = readProjectFile(ctx, APPCONFIG_REL)
    const hasIdempotentGuard = appConfig?.includes('url.startsWith(mediaProxyUrl)') ?? false

    const appRoot = projectPath(ctx, 'app')
    const appFiles = walkTsFiles(appRoot).filter(f => !f.includes(`${path.sep}rettiwt-api${path.sep}`))
    const doubleProtocol = appFiles.filter(f => fs.readFileSync(f, 'utf8').includes('https://https://'))

    if (hasIdempotentGuard && doubleProtocol.length === 0) {
      return {
        id: 'AC-MEDIA-004',
        name: 'No double-proxy URL',
        verdict: 'PASS',
        durationMs: Math.round(performance.now() - t0),
        detail: `useProxyMedia idempotent guard ✓ · no https://https:// in ${appFiles.length} files`,
      }
    }
    const problems: string[] = []
    if (!hasIdempotentGuard)
      problems.push('useProxyMedia missing startsWith(mediaProxyUrl) guard')
    if (doubleProtocol.length > 0)
      problems.push(`found https://https:// in ${doubleProtocol.join(', ')}`)
    return {
      id: 'AC-MEDIA-004',
      name: 'No double-proxy URL',
      verdict: 'FAIL',
      durationMs: Math.round(performance.now() - t0),
      error: problems.join('; '),
    }
  }

  private verifyUnifiedProxy(ctx: VerifyContext): StepResult {
    const t0 = performance.now()
    const appConfig = readProjectFile(ctx, APPCONFIG_REL)
    const tweetCard = readProjectFile(ctx, TWEET_CARD_REL)
    const utils = readProjectFile(ctx, REACT_TWEET_UTILS_REL)

    const hasEntry = appConfig?.includes('export function useProxyMedia') ?? false
    const cardUsesProxy = tweetCard?.includes('proxyMedia') ?? false
    const utilsUsesProxy = utils?.includes('proxyMedia') ?? false
    const hardcoded = [...TWEET_MEDIA_RELS, TWEET_CARD_REL, REACT_TWEET_UTILS_REL].filter((rel) => {
      const content = readProjectFile(ctx, rel)
      return content ? RESTRICTED_CDNS.some(cdn => content.includes(cdn)) : false
    })

    if (hasEntry && cardUsesProxy && utilsUsesProxy && hardcoded.length === 0) {
      return {
        id: 'AC-MEDIA-005',
        name: 'Tweet media uses unified proxy',
        verdict: 'PASS',
        durationMs: Math.round(performance.now() - t0),
        detail: 'useProxyMedia entry ✓ · TweetCard + utils call proxyMedia ✓ · no hardcoded twimg',
      }
    }
    const problems: string[] = []
    if (!hasEntry)
      problems.push('useProxyMedia not exported')
    if (!cardUsesProxy)
      problems.push('TweetCard does not use proxyMedia')
    if (!utilsUsesProxy)
      problems.push('react-tweet utils does not use proxyMedia')
    if (hardcoded.length > 0)
      problems.push(`hardcoded CDN in ${hardcoded.join(', ')}`)
    return {
      id: 'AC-MEDIA-005',
      name: 'Tweet media uses unified proxy',
      verdict: 'FAIL',
      durationMs: Math.round(performance.now() - t0),
      error: problems.join('; '),
    }
  }

  private verifyVideoUrl(ctx: VerifyContext): StepResult {
    const t0 = performance.now()
    const igTypes = readProjectFile(ctx, IG_TYPES_REL)
    const grid = readProjectFile(ctx, IG_MEDIA_GRID_REL)

    const hasField = igTypes?.includes('video_url') ?? false
    const hasVideoBranch = grid?.includes('type === \'video\'') ?? false
    const branchUsesVideoUrl = grid?.includes('media.video_url') ?? false

    if (hasField && hasVideoBranch && branchUsesVideoUrl) {
      return {
        id: 'AC-MEDIA-006',
        name: 'Video media URL handled',
        verdict: 'PASS',
        durationMs: Math.round(performance.now() - t0),
        detail: 'IGMedia type has video_url · IGMediaGrid video branch reads media.video_url',
      }
    }
    const problems: string[] = []
    if (!hasField)
      problems.push('IGMedia type missing video_url')
    if (!hasVideoBranch)
      problems.push('IGMediaGrid missing type === "video" branch')
    if (!branchUsesVideoUrl)
      problems.push('video branch does not read media.video_url')
    return {
      id: 'AC-MEDIA-006',
      name: 'Video media URL handled',
      verdict: 'FAIL',
      durationMs: Math.round(performance.now() - t0),
      error: problems.join('; '),
    }
  }
}
