#!/usr/bin/env bun
/**
 * scripts/postmortem-check.ts
 *
 * S10 — Postmortem pre-release check.
 *
 * Compares the files changed between two git refs against each postmortem's
 * "Changed Files" list and the hot-fix file table from docs/postmortem/README.md.
 * An overlap means the change touches a historically fragile area — flag it so
 * the reporter confirms the preventive actions held before release.
 *
 * Usage:
 *   bun run scripts/postmortem-check.ts <base-ref> <head-ref>
 *   bun run scripts/postmortem-check.ts            # defaults to main..HEAD
 *
 * Exit code: 0 = PASS (overlaps are WARNs), 1 = FAIL (parse error / bad refs).
 */

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..')
const POSTMORTEM_DIR = path.join(PROJECT_ROOT, 'docs', 'postmortem')

/** Hot-fix file table from docs/postmortem/README.md (pattern, fix count, reports). */
const HOT_FILES: Array<{ pattern: string, fixes: number, reports: string[] }> = [
  { pattern: 'app/lib/react-tweet/api-v2/parseTweet.ts', fixes: 10, reports: ['001', '005'] },
  { pattern: 'app/components/tweet/Tweet.tsx', fixes: 13, reports: ['001', '003', '005'] },
  { pattern: 'app/components/translation/TranslationEditor.tsx', fixes: 10, reports: ['002', '003'] },
  { pattern: 'app/lib/stores/', fixes: 6, reports: ['002', '006'] },
  { pattern: 'app/components/tweet/TweetTextBody.tsx', fixes: 5, reports: ['001'] },
]

const REPORT_FILE_RE = /^\d{3}-.+\.md$/

interface Postmortem {
  id: string
  title: string
  status: string
  files: string[]
}

function listPostmortems(): string[] {
  return fs.readdirSync(POSTMORTEM_DIR)
    .filter(f => REPORT_FILE_RE.test(f))
    .sort()
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

function parsePostmortem(file: string): Postmortem {
  const content = fs.readFileSync(path.join(POSTMORTEM_DIR, file), 'utf8')
  const id = file.slice(0, 3)

  // Line-based parsing avoids super-linear backtracking with \s* + .+
  const lines = content.split(/\r?\n/)
  let title = file.replace(/^\d{3}-/, '').replace(/\.md$/, '').replace(/-/g, ' ')
  let status = 'Unknown'
  for (const raw of lines) {
    const line = raw.trim()
    if (/^# Postmortem \d{3}:/.test(line)) {
      title = line.replace(/^# Postmortem \d{3}:\s*/, '').trim()
    }
    if (/^\*\*状态\*\*:/.test(line)) {
      status = line.replace(/^\*\*状态\*\*:\s*/, '').trim()
    }
  }
  const files = parseChangedFiles(content)
  return {
    id,
    title,
    status,
    files,
  }
}

function execGitDiff(base: string, head: string): string[] {
  const out = execSync(`git diff --name-only ${base} ${head}`, {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  })
  return out.split('\n').map(s => s.trim()).filter(Boolean)
}

/**
 * Diff base..head, with graceful degradation for refs unavailable in CI:
 *   - default "main" ref absent (shallow checkout) → fall back to HEAD~1..head
 *   - no parent ref either (fetch-depth: 1) → skip overlap check, return []
 * Explicitly-passed refs are never substituted.
 */
function getChangedFiles(base: string, head: string): string[] {
  try {
    return execGitDiff(base, head)
  }
  catch (err) {
    if (base !== 'main')
      throw err instanceof Error ? err : new Error(String(err))
    console.log('  (main ref not found — falling back to HEAD~1..HEAD)')
    try {
      return execGitDiff('HEAD~1', head)
    }
    catch {
      console.log('  (shallow checkout — no parent ref; skipping overlap check)')
      return []
    }
  }
}

// ─── Main ────────────────────────────────────────────────

const [base = 'main', head = 'HEAD'] = process.argv.slice(2)

console.log('Postmortem Pre-Release Check')
console.log(`  range: ${base}..${head}`)

let changed: string[]
try {
  changed = getChangedFiles(base, head)
}
catch (err) {
  console.error(`  FAIL: cannot diff ${base}..${head}: ${err instanceof Error ? err.message : String(err)}`)
  console.error('RESULT: FAIL (0 WARN / 1 FAIL)')
  process.exit(1)
}

console.log(`  changed files: ${changed.length}`)
console.log('')

let warns = 0
let fails = 0
let overlappedAny = false

for (const file of listPostmortems()) {
  const pm = parsePostmortem(file)
  const label = pm.title.slice(0, 34).padEnd(34)

  if (pm.files.length === 0) {
    console.log(`  [${pm.id}] ${label} · Changed files overlap? NO  ✗ (parse error)`)
    fails++
    continue
  }

  const overlap = pm.files.filter(f => changed.includes(f))
  if (overlap.length > 0) {
    console.log(`  [${pm.id}] ${label} · Changed files overlap? YES ⚠ (${overlap.length})`)
    for (const f of overlap)
      console.log(`           ↳ ${f}`)
    warns++
    overlappedAny = true
  }
  else {
    console.log(`  [${pm.id}] ${label} · Changed files overlap? NO  ✓`)
  }
}

// Hot-fix table hits
for (const hot of HOT_FILES) {
  const hits = changed.filter(f => f.startsWith(hot.pattern))
  if (hits.length > 0) {
    console.log(`  [高危] ${hot.pattern}  · hot-fix spot (${hot.fixes} fixes, pm #${hot.reports.join('/#')}) ⚠`)
    warns++
  }
}

console.log('')
console.log(`RESULT: ${fails > 0 ? 'FAIL' : 'PASS'} (${warns} WARN / ${fails} FAIL)`)
console.log(overlappedAny
  ? '  ⚠ 改动命中历史雷区 —— 请对照对应 postmortem 的「行动项」，确认预防措施已落实'
  : '  ✓ 未命中历史雷区')
process.exit(fails > 0 ? 1 : 0)
