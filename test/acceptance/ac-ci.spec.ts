import path from 'node:path'
/**
 * test/acceptance/ac-ci.spec.ts
 *
 * L3 AC 语义层 — CI/CD workflow 完整性（自 verify/modules/ci.verifier.ts 迁移，Phase D）：
 * AC-CI-001~004（.github/workflows/verify.yml 静态检查）。
 */
import { describe, expect, it } from 'vitest'
import { readProjectFile } from '../helpers/read-project-file'

const ON_PUSH_RE = /\bon:\s*push/

const WORKFLOW_REL = path.join('.github', 'workflows', 'verify.yml')

describe('AC-CI ci workflow integrity', () => {
  const workflow = readProjectFile(WORKFLOW_REL) ?? ''

  it('AC-CI-001: CI workflow exists and is readable', () => {
    expect(workflow.trim().length).toBeGreaterThan(0)
  })

  it('AC-CI-002: typecheck runs in CI on push', () => {
    expect(workflow).toMatch(ON_PUSH_RE)
    expect(workflow).toContain('bun run typecheck')
  })

  it('AC-CI-003: unit tests run in CI', () => {
    expect(workflow).toContain('oven-sh/setup-bun')
    expect(workflow).toContain('bun run test')
  })

  it('AC-CI-004: CLI verify runs in CI', () => {
    expect(workflow).toContain('bun run verify/index.ts --exit-on-fail')
  })
})
