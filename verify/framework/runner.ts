/**
 * verify/framework/runner.ts
 *
 * Executes verifiers and formats results for CLI output.
 */

import type {
  CliOptions,
  StepResult,
  SuiteResult,
  Verifier,
  VerifyContext,
} from './types.js'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..', '..')

// ─── Helpers ──────────────────────────────────────────────

function buildContext(options: CliOptions): VerifyContext {
  return {
    client: undefined, // populated later if server is available
    fixtureDir: path.join(PROJECT_ROOT, 'verify', 'fixtures'),
    verbose: options.verbose ?? false,
    env: {
      hasTweetKeys: !!process.env.TWEET_KEYS,
      hasInsCookies: !!process.env.INS_COOKIES,
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      hasDeepSeekKey: !!process.env.DEEPSEEK_API_KEY,
    },
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000)
    return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function verdictIcon(v: StepResult['verdict']): string {
  switch (v) {
    case 'PASS': return '✓'
    case 'FAIL': return '✗'
    case 'SKIP': return '○'
    case 'WARN': return '⚠'
  }
}

// ─── Runner ────────────────────────────────────────────────

export class VerifyRunner {
  private verifiers: Verifier[] = []
  private options: CliOptions

  constructor(options: CliOptions = {}) {
    this.options = options
  }

  /** Register one or more verifiers */
  register(...verifiers: Verifier[]): void {
    this.verifiers.push(...verifiers)
  }

  /** Run all registered verifiers (or filtered subset) */
  async run(): Promise<SuiteResult[]> {
    const ctx = buildContext(this.options)
    let candidates = this.verifiers

    // Filter by module
    if (this.options.module) {
      candidates = candidates.filter(v => v.module === this.options.module)
    }

    // Filter by AC
    const acFilter = this.options.ac
    if (acFilter) {
      candidates = candidates.filter(v => v.acIds.includes(acFilter))
    }

    if (candidates.length === 0) {
      console.log('No verifiers matched the filter.')
      return []
    }

    // Group by module for output
    const moduleMap = new Map<string, Verifier[]>()
    for (const v of candidates) {
      const list = moduleMap.get(v.module) || []
      list.push(v)
      moduleMap.set(v.module, list)
    }

    const suites: SuiteResult[] = []
    let totalPassed = 0
    let totalFailed = 0
    let totalSkipped = 0
    let totalWarned = 0
    const startTime = Date.now()

    for (const [module, verifiers] of moduleMap) {
      console.log(`\n  ${module.toUpperCase()}`)
      const allSteps: StepResult[] = []

      for (const verifier of verifiers) {
        // Check if this verifier can run
        const skipReason = verifier.canRun(ctx)
        if (skipReason) {
          const skipResult: StepResult = {
            id: verifier.acIds.join(', '),
            name: `${verifier.label} (${verifier.id})`,
            verdict: 'SKIP',
            durationMs: 0,
            detail: skipReason,
          }
          allSteps.push(skipResult)
          totalSkipped++
          this.printStep(skipResult)
          continue
        }

        // Run
        const t0 = performance.now()
        try {
          let steps = await verifier.run(ctx)
          const duration = Math.round(performance.now() - t0)

          // Filter by AC if needed
          if (this.options.ac) {
            steps = steps.filter(s => s.id === this.options.ac)
          }

          for (const step of steps) {
            step.durationMs = duration
            allSteps.push(step)

            if (step.verdict === 'PASS')
              totalPassed++
            else if (step.verdict === 'FAIL')
              totalFailed++
            else if (step.verdict === 'SKIP')
              totalSkipped++
            else if (step.verdict === 'WARN')
              totalWarned++

            this.printStep(step)
          }
        }
        catch (err) {
          const errStep: StepResult = {
            id: verifier.acIds.join(', '),
            name: `${verifier.label} (${verifier.id})`,
            verdict: 'FAIL',
            durationMs: Math.round(performance.now() - t0),
            error: err instanceof Error ? err.message : String(err),
          }
          allSteps.push(errStep)
          totalFailed++
          this.printStep(errStep)
        }
      }

      const moduleDuration = allSteps.reduce((s, st) => s + st.durationMs, 0)
      suites.push({
        module,
        steps: allSteps,
        passed: allSteps.filter(s => s.verdict === 'PASS').length,
        failed: allSteps.filter(s => s.verdict === 'FAIL').length,
        skipped: allSteps.filter(s => s.verdict === 'SKIP').length,
        warned: allSteps.filter(s => s.verdict === 'WARN').length,
        totalDurationMs: moduleDuration,
      })
    }

    // Summary
    const totalDuration = Date.now() - startTime
    console.log('')
    console.log('─'.repeat(60))
    console.log(`  PASS: ${totalPassed}  FAIL: ${totalFailed}  SKIP: ${totalSkipped}  WARN: ${totalWarned}`)
    console.log(`  Duration: ${formatDuration(totalDuration)}`)
    console.log('')

    return suites
  }

  private printStep(step: StepResult): void {
    const icon = verdictIcon(step.verdict)
    const pad = ' '.repeat(Math.max(0, 40 - step.name.length))
    const detail = step.error
      ? `  → ${step.error}`
      : step.detail
        ? `  · ${step.detail}`
        : ''
    console.log(`    ${icon} ${step.name}${pad} ${icon}${detail}`)
  }
}
