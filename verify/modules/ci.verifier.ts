/**
 * verify/modules/ci.verifier.ts
 *
 * Covers: AC-CI-001 ~ AC-CI-004
 * Static checks that the GitHub Actions workflow exists and runs
 * typecheck / unit tests / CLI verification on every push.
 */

import type { StepResult, Verifier, VerifyContext } from '../framework/types.js'
import fs from 'node:fs'
import path from 'node:path'

const WORKFLOW_REL = path.join('.github', 'workflows', 'verify.yml')

// Matches an "on:" block containing a push trigger
const pushTriggerRe = /\bon:\s*push/

/** Absolute path to the workflow file, derived from the fixture dir. */
function workflowPath(ctx: VerifyContext): string {
  // fixtureDir = <root>/verify/fixtures  →  root = ../..
  return path.resolve(ctx.fixtureDir, '..', '..', WORKFLOW_REL)
}

export class CIVerifier implements Verifier {
  readonly id = 'ci-pipeline'
  readonly module = 'ci'
  readonly label = 'CI/CD Pipeline'
  readonly acIds = [
    'AC-CI-001',
    'AC-CI-002',
    'AC-CI-003',
    'AC-CI-004',
  ]

  canRun(_ctx: VerifyContext): string | null {
    return null
  }

  async run(ctx: VerifyContext): Promise<StepResult[]> {
    return [
      this.verifyWorkflowExists(ctx),
      this.verifyTypecheck(ctx),
      this.verifyUnitTest(ctx),
      this.verifyCliVerify(ctx),
    ]
  }

  private readWorkflow(ctx: VerifyContext): string | null {
    const filepath = workflowPath(ctx)
    if (!fs.existsSync(filepath))
      return null
    return fs.readFileSync(filepath, 'utf8')
  }

  private fail(id: string, name: string, error: string, t0: number): StepResult {
    return { id, name, verdict: 'FAIL', durationMs: Math.round(performance.now() - t0), error }
  }

  private verifyWorkflowExists(ctx: VerifyContext): StepResult {
    const t0 = performance.now()
    try {
      const content = this.readWorkflow(ctx)
      if (content && content.trim().length > 0) {
        return {
          id: 'AC-CI-001',
          name: 'CI workflow exists',
          verdict: 'PASS',
          durationMs: Math.round(performance.now() - t0),
          detail: `${WORKFLOW_REL} readable (${content.length} bytes)`,
        }
      }
      return this.fail('AC-CI-001', 'CI workflow exists', `missing or empty: ${WORKFLOW_REL}`, t0)
    }
    catch (err) {
      return this.fail('AC-CI-001', 'CI workflow exists', err instanceof Error ? err.message : String(err), t0)
    }
  }

  private verifyTypecheck(ctx: VerifyContext): StepResult {
    const t0 = performance.now()
    try {
      const content = this.readWorkflow(ctx)
      const checks: Array<[string, boolean]> = [
        ['workflow exists', !!content],
        ['triggered on push', !!content && pushTriggerRe.test(content)],
        ['runs typecheck', !!content && content.includes('bun run typecheck')],
      ]
      const passed = checks.every(([, ok]) => ok)
      if (passed) {
        return {
          id: 'AC-CI-002',
          name: 'Typecheck runs in CI',
          verdict: 'PASS',
          durationMs: Math.round(performance.now() - t0),
          detail: 'push trigger + bun run typecheck',
        }
      }
      const failed = checks.filter(([, ok]) => !ok).map(([label]) => label).join(', ')
      return this.fail('AC-CI-002', 'Typecheck runs in CI', failed, t0)
    }
    catch (err) {
      return this.fail('AC-CI-002', 'Typecheck runs in CI', err instanceof Error ? err.message : String(err), t0)
    }
  }

  private verifyUnitTest(ctx: VerifyContext): StepResult {
    const t0 = performance.now()
    try {
      const content = this.readWorkflow(ctx)
      const checks: Array<[string, boolean]> = [
        ['workflow exists', !!content],
        ['setup-bun action', !!content && content.includes('oven-sh/setup-bun')],
        ['runs unit tests', !!content && content.includes('bun run test')],
      ]
      const passed = checks.every(([, ok]) => ok)
      if (passed) {
        return {
          id: 'AC-CI-003',
          name: 'Unit tests run in CI',
          verdict: 'PASS',
          durationMs: Math.round(performance.now() - t0),
          detail: 'setup-bun + bun run test',
        }
      }
      const failed = checks.filter(([, ok]) => !ok).map(([label]) => label).join(', ')
      return this.fail('AC-CI-003', 'Unit tests run in CI', failed, t0)
    }
    catch (err) {
      return this.fail('AC-CI-003', 'Unit tests run in CI', err instanceof Error ? err.message : String(err), t0)
    }
  }

  private verifyCliVerify(ctx: VerifyContext): StepResult {
    const t0 = performance.now()
    try {
      const content = this.readWorkflow(ctx)
      const includesVerify = !!content && content.includes('bun run verify/index.ts --exit-on-fail')
      if (includesVerify) {
        return {
          id: 'AC-CI-004',
          name: 'CLI verify runs in CI',
          verdict: 'PASS',
          durationMs: Math.round(performance.now() - t0),
          detail: 'verify/index.ts --exit-on-fail',
        }
      }
      return this.fail('AC-CI-004', 'CLI verify runs in CI', 'missing verify step', t0)
    }
    catch (err) {
      return this.fail('AC-CI-004', 'CLI verify runs in CI', err instanceof Error ? err.message : String(err), t0)
    }
  }
}
