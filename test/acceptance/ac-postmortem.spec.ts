import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
/**
 * test/acceptance/ac-postmortem.spec.ts
 *
 * L3 AC 语义层 — Postmortem 预发布检查（自 verify/modules/postmortem.verifier.ts 迁移，Phase D）：
 * AC-PM-001~007（docs/postmortem/ 静态完整性 + scripts/postmortem-check.ts 冒烟）。
 */
import { describe, expect, it } from 'vitest'
import { projectPath, readProjectFile } from '../helpers/read-project-file'

const POSTMORTEM_DIR_REL = path.join('docs', 'postmortem')
const SCRIPT_REL = path.join('scripts', 'postmortem-check.ts')
const REPORT_IDS = ['001', '002', '003', '004', '005', '006', '007', '008', '009']
const REPORT_FILE_RE = /^\d{3}-.+\.md$/
const STATUS_RE = /\*\*状态\*\*:\s*(?:Active|Mitigated)/
const HOT_FILE_REF_RE = /#\d{3}/g
const SCRIPT_RESULT_RE = /RESULT: (?:PASS|FAIL)/

function listReports(): string[] {
  const dir = projectPath(POSTMORTEM_DIR_REL)
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

describe('AC-PM postmortem pre-release integrity', () => {
  it('AC-PM-001: report directory complete (001~008 + README + TEMPLATE)', () => {
    const dir = projectPath(POSTMORTEM_DIR_REL)
    const reports = listReports()
    const ids = reports.map(f => f.slice(0, 3))
    const missing = REPORT_IDS.filter(id => !ids.includes(id))
    const hasReadme = fs.existsSync(path.join(dir, 'README.md'))
    const hasTemplate = fs.existsSync(path.join(dir, 'TEMPLATE.md'))

    expect(missing).toEqual([])
    expect(hasReadme).toBe(true)
    expect(hasTemplate).toBe(true)
  })

  it('AC-PM-002: every report has a status field (Active | Mitigated)', () => {
    const bad = listReports().filter((f) => {
      const content = readProjectFile(path.join(POSTMORTEM_DIR_REL, f))
      return content ? !STATUS_RE.test(content) : true
    })
    expect(bad).toEqual([])
  })

  it('AC-PM-003: every report has a parseable Changed Files block', () => {
    const bad = listReports().filter((f) => {
      const content = readProjectFile(path.join(POSTMORTEM_DIR_REL, f))
      return content ? parseChangedFiles(content).length === 0 : true
    })
    expect(bad).toEqual([])
  })

  it('AC-PM-004: README index covers all reports', () => {
    const readme = readProjectFile(path.join(POSTMORTEM_DIR_REL, 'README.md')) ?? ''
    const missing = REPORT_IDS.filter(id => !readme.includes(`[${id}](`))
    expect(missing).toEqual([])
  })

  it('AC-PM-005: hot-fix table references valid report ids', () => {
    const readme = readProjectFile(path.join(POSTMORTEM_DIR_REL, 'README.md')) ?? ''
    const refs = [...new Set((readme.match(HOT_FILE_REF_RE) ?? []).map(m => m.slice(1)))]
    const bad = refs.filter(id => !REPORT_IDS.includes(id))
    expect(bad).toEqual([])
  })

  it('AC-PM-006: postmortem check script exists with Changed Files parsing', () => {
    const script = readProjectFile(SCRIPT_REL)
    expect(script).not.toBeNull()
    expect(script!).toContain('Changed Files')
  })

  it('AC-PM-007: postmortem check script smoke-runs', () => {
    const out = execSync('bun run scripts/postmortem-check.ts', {
      cwd: projectPath(''),
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
      timeout: 30_000,
    })
    expect(out).toMatch(SCRIPT_RESULT_RE)
  })
})
