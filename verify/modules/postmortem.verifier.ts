/**
 * verify/modules/postmortem.verifier.ts
 *
 * Covers: AC-PM-001 ~ AC-PM-007
 * S10 — Postmortem pre-release check automation
 *
 * Static integrity checks over docs/postmortem/ plus the S10 script
 * (scripts/postmortem-check.ts). The git-overlap behavior lives in the script;
 * AC-PM-007 smoke-runs it.
 */

import type { StepResult, Verifier, VerifyContext } from '../framework/types.js'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const POSTMORTEM_DIR_REL = path.join('docs', 'postmortem')
const SCRIPT_REL = path.join('scripts', 'postmortem-check.ts')
const REPORT_IDS = ['001', '002', '003', '004', '005', '006', '007', '008']
const REPORT_FILE_RE = /^\d{3}-.+\.md$/
const STATUS_RE = /\*\*状态\*\*:\s*(?:Active|Mitigated)/
const HOT_FILE_REF_RE = /#\d{3}/g
const SCRIPT_RESULT_RE = /RESULT: (?:PASS|FAIL)/
const RESULT_LINE_RE = /^RESULT: .*$/m

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

function listReports(ctx: VerifyContext): string[] {
  const dir = projectPath(ctx, POSTMORTEM_DIR_REL)
  if (!fs.existsSync(dir))
    return []
  return fs.readdirSync(dir).filter(f => REPORT_FILE_RE.test(f)).sort()
}

/**
 * Parse the fenced `## Changed Files` block into a list of paths. Line-based
 * parsing (instead of a single backreference regex) avoids super-linear
 * backtracking between `\s*` and `[\s\S]*?` on report files.
 */
function parseChangedFiles(content: string): string[] {
  const lines = content.split(/\r?\n/)
  const header = lines.findIndex(l => l.trim() === '## Changed Files')
  if (header === -1)
    return []
  const files: string[] = []
  let inFence = false
  for (const raw of lines.slice(header + 1)) {
    const line = raw.trim()
    if (line.startsWith('```')) {
      if (inFence)
        break
      inFence = true
      continue
    }
    if (inFence && line)
      files.push(line)
  }
  return files
}

export class PostmortemVerifier implements Verifier {
  readonly id = 'postmortem-check'
  readonly module = 'postmortem'
  readonly label = 'Postmortem Pre-Release Check'
  readonly acIds = [
    'AC-PM-001',
    'AC-PM-002',
    'AC-PM-003',
    'AC-PM-004',
    'AC-PM-005',
    'AC-PM-006',
    'AC-PM-007',
  ]

  canRun(_ctx: VerifyContext): string | null {
    return null
  }

  async run(ctx: VerifyContext): Promise<StepResult[]> {
    return [
      this.verifyReportDir(ctx),
      this.verifyStatusFields(ctx),
      this.verifyChangedFiles(ctx),
      this.verifyReadmeIndex(ctx),
      this.verifyHotFiles(ctx),
      this.verifyScriptExists(ctx),
      this.verifyScriptRuns(ctx),
    ]
  }

  // ── AC-PM-001: report directory complete ────────────────

  private verifyReportDir(ctx: VerifyContext): StepResult {
    const t0 = performance.now()
    const dir = projectPath(ctx, POSTMORTEM_DIR_REL)
    const reports = listReports(ctx)
    const ids = reports.map(f => f.slice(0, 3))
    const missing = REPORT_IDS.filter(id => !ids.includes(id))
    const hasReadme = fs.existsSync(path.join(dir, 'README.md'))
    const hasTemplate = fs.existsSync(path.join(dir, 'TEMPLATE.md'))
    const ok = missing.length === 0 && hasReadme && hasTemplate
    return {
      id: 'AC-PM-001',
      name: 'Postmortem report directory complete',
      verdict: ok ? 'PASS' : 'FAIL',
      durationMs: Math.round(performance.now() - t0),
      detail: ok ? `${reports.length} reports + README + TEMPLATE` : undefined,
      error: ok ? undefined : `missing reports: ${missing.join(', ') || 'none'} · README:${hasReadme} TEMPLATE:${hasTemplate}`,
    }
  }

  // ── AC-PM-002: every report has a status field ──────────

  private verifyStatusFields(ctx: VerifyContext): StepResult {
    const t0 = performance.now()
    const bad = listReports(ctx).filter((f) => {
      const content = readProjectFile(ctx, path.join(POSTMORTEM_DIR_REL, f))
      return content ? !STATUS_RE.test(content) : true
    })
    return {
      id: 'AC-PM-002',
      name: 'Every report has a status field',
      verdict: bad.length === 0 ? 'PASS' : 'FAIL',
      durationMs: Math.round(performance.now() - t0),
      detail: bad.length === 0 ? 'Active | Mitigated in all 8 reports' : undefined,
      error: bad.length > 0 ? `missing status: ${bad.join(', ')}` : undefined,
    }
  }

  // ── AC-PM-003: every report has a parseable Changed Files block ──

  private verifyChangedFiles(ctx: VerifyContext): StepResult {
    const t0 = performance.now()
    const bad = listReports(ctx).filter((f) => {
      const content = readProjectFile(ctx, path.join(POSTMORTEM_DIR_REL, f))
      return content ? parseChangedFiles(content).length === 0 : true
    })
    return {
      id: 'AC-PM-003',
      name: 'Every report has Changed Files block',
      verdict: bad.length === 0 ? 'PASS' : 'FAIL',
      durationMs: Math.round(performance.now() - t0),
      detail: bad.length === 0 ? 'all reports expose ≥1 changed file' : undefined,
      error: bad.length > 0 ? `unparseable: ${bad.join(', ')}` : undefined,
    }
  }

  // ── AC-PM-004: README index covers all reports ──────────

  private verifyReadmeIndex(ctx: VerifyContext): StepResult {
    const t0 = performance.now()
    const readme = readProjectFile(ctx, path.join(POSTMORTEM_DIR_REL, 'README.md')) ?? ''
    const missing = REPORT_IDS.filter(id => !readme.includes(`[${id}](`))
    return {
      id: 'AC-PM-004',
      name: 'README index covers all reports',
      verdict: missing.length === 0 ? 'PASS' : 'FAIL',
      durationMs: Math.round(performance.now() - t0),
      detail: missing.length === 0 ? 'index links 001~008' : undefined,
      error: missing.length > 0 ? `not indexed: ${missing.join(', ')}` : undefined,
    }
  }

  // ── AC-PM-005: hot-fix table references valid report ids ──

  private verifyHotFiles(ctx: VerifyContext): StepResult {
    const t0 = performance.now()
    const readme = readProjectFile(ctx, path.join(POSTMORTEM_DIR_REL, 'README.md')) ?? ''
    const refs = [...new Set((readme.match(HOT_FILE_REF_RE) ?? []).map(m => m.slice(1)))]
    const bad = refs.filter(id => !REPORT_IDS.includes(id))
    return {
      id: 'AC-PM-005',
      name: 'Hot-fix table references valid reports',
      verdict: bad.length === 0 ? 'PASS' : 'FAIL',
      durationMs: Math.round(performance.now() - t0),
      detail: refs.length > 0 ? `${refs.length} report refs from hot-fix table all valid` : undefined,
      error: bad.length > 0 ? `unknown refs: ${bad.join(', ')}` : undefined,
    }
  }

  // ── AC-PM-006: S10 script exists ────────────────────────

  private verifyScriptExists(ctx: VerifyContext): StepResult {
    const t0 = performance.now()
    const script = readProjectFile(ctx, SCRIPT_REL)
    const ok = script !== null && script.includes('Changed Files')
    return {
      id: 'AC-PM-006',
      name: 'Postmortem check script exists',
      verdict: ok ? 'PASS' : 'FAIL',
      durationMs: Math.round(performance.now() - t0),
      detail: ok ? 'scripts/postmortem-check.ts present' : undefined,
      error: ok ? undefined : 'scripts/postmortem-check.ts missing or lacks Changed Files parsing',
    }
  }

  // ── AC-PM-007: S10 script smoke-run ─────────────────────

  private verifyScriptRuns(ctx: VerifyContext): StepResult {
    const t0 = performance.now()
    try {
      const out = execSync('bun run scripts/postmortem-check.ts', {
        cwd: projectPath(ctx, ''),
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024,
        timeout: 30_000,
      })
      const ok = SCRIPT_RESULT_RE.test(out)
      return {
        id: 'AC-PM-007',
        name: 'Postmortem check script runs',
        verdict: ok ? 'PASS' : 'FAIL',
        durationMs: Math.round(performance.now() - t0),
        detail: ok ? out.match(RESULT_LINE_RE)?.[0] : undefined,
        error: ok ? undefined : 'script output missing RESULT line',
      }
    }
    catch (err) {
      return {
        id: 'AC-PM-007',
        name: 'Postmortem check script runs',
        verdict: 'FAIL',
        durationMs: Math.round(performance.now() - t0),
        error: err instanceof Error ? err.message : String(err),
      }
    }
  }
}
