import path from 'node:path'
/**
 * test/acceptance/ac-ci.spec.ts
 *
 * L3 AC 语义层 — CI/CD workflow 完整性：
 * AC-CI-001~004（.github/workflows/verify.yml）。
 *
 * F5 修复（review-2026-09-11 P1-3）：原实现用 `expect(workflow).toContain('bun run test')`
 * 断言 CI 跑单测，但该字符串实际只出现在 workflow 的一句**注释**里——注释即满足，删注释才红。
 * 现解析 YAML 的 `run:` / `uses:` 步骤后按**步骤命令**断言，注释不再能冒充步骤。
 */
import { describe, expect, it } from 'vitest'
import { readProjectFile } from '../helpers/read-project-file'

const ON_PUSH_RE = /\bon:\s*push/

const WORKFLOW_REL = path.join('.github', 'workflows', 'verify.yml')

interface WorkflowStep {
  name?: string
  uses?: string
  run?: string
}

const STEP_ITEM_RE = /^\s*-(.*)$/
const STEP_KEY_RE = /^\s*(name|uses|run):(.*)$/
const BLOCK_SCALAR_RE = /^[|>][+-]?$/
const COMMENT_LINE_RE = /^\s*#/
const LEADING_WS_RE = /^\s*/
const VERIFY_RUN_RE = /^bun run verify\/index\.ts\b/
const NODE_PROJECTS_UNIT_RE = /NODE_PROJECTS\s*=\s*\[[^\]]*'unit'/
const LINE_BREAK_RE = /\r?\n/

function stripQuotes(value: string): string {
  const trimmed = value.trim()
  if (
    (trimmed.startsWith('\'') && trimmed.endsWith('\''))
    || (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

/**
 * 极简 workflow 步骤解析器：只关心 `steps:` 下每个 `- name/uses/run` 项。
 * 跳过整行注释（`#`），因此注释里的命令不会被采集——这正是 F5 要堵的漏洞。
 */
function parseWorkflowSteps(yaml: string): WorkflowStep[] {
  const lines = yaml.split(LINE_BREAK_RE)
  const steps: WorkflowStep[] = []
  let current: WorkflowStep | null = null

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]!
    if (COMMENT_LINE_RE.test(raw))
      continue

    const item = raw.match(STEP_ITEM_RE)
    if (item) {
      current = {}
      steps.push(current)
      const inline = item[1]!.match(STEP_KEY_RE)
      if (inline)
        current[inline[1] as keyof WorkflowStep] = stripQuotes(inline[2]!)
      continue
    }

    if (!current)
      continue
    const key = raw.match(STEP_KEY_RE)
    if (!key)
      continue

    let value = key[2]!
    if (BLOCK_SCALAR_RE.test(value.trim())) {
      const indent = raw.match(LEADING_WS_RE)![0].length
      const block: string[] = []
      let j = i + 1
      while (j < lines.length) {
        const next = lines[j]!
        if (next.trim() !== '' && next.match(LEADING_WS_RE)![0].length <= indent)
          break
        block.push(next.trim())
        j++
      }
      value = block.filter(Boolean).join('\n')
      i = j - 1
    }
    current[key[1] as keyof WorkflowStep] = stripQuotes(value)
  }

  return steps
}

describe('AC-CI ci workflow integrity', () => {
  const workflow = readProjectFile(WORKFLOW_REL) ?? ''
  const steps = parseWorkflowSteps(workflow)
  const runCommands = steps.map(s => s.run).filter((v): v is string => !!v)
  const usedActions = steps.map(s => s.uses).filter((v): v is string => !!v)

  it('AC-CI-001: CI workflow exists and declares executable steps', () => {
    expect(workflow.trim().length).toBeGreaterThan(0)
    expect(steps.length).toBeGreaterThan(0)
    expect(usedActions.some(a => a.startsWith('oven-sh/setup-bun'))).toBe(true)
  })

  it('AC-CI-002: typecheck runs in CI on push (parsed run step)', () => {
    expect(workflow).toMatch(ON_PUSH_RE)
    expect(runCommands).toContain('bun run typecheck')
  })

  it('AC-CI-003: unit tests run in CI via the verification suite', () => {
    // CI 不再单独跑 `bun run test`（避免与 verify 重复，见 workflow 注释）；
    // 单测经统一 verify 门禁执行——断言：CI 真跑 verify 且该 CLI 含 unit 项目。
    // 注意：这里匹配的是解析出的 run 命令，注释里的 `bun run test` 不计数。
    expect(runCommands.some(c => VERIFY_RUN_RE.test(c))).toBe(true)

    // 反证解析器真的跳过注释：`bun run test` 只存在于 workflow 注释里，
    // 若它出现在 runCommands 中，说明解析器把注释当成了步骤。
    expect(runCommands).not.toContain('bun run test')

    const cli = readProjectFile(path.join('verify', 'index.ts')) ?? ''
    expect(cli).toMatch(NODE_PROJECTS_UNIT_RE)
  })

  it('AC-CI-004: CLI verify runs in CI in fail-fast mode', () => {
    expect(runCommands.some(c => c.includes('bun run verify/index.ts') && c.includes('--exit-on-fail'))).toBe(true)
  })
})
