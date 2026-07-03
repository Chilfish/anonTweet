/**
 * verify/framework/types.ts
 *
 * Core types for the pluggable verification framework.
 * Each AC (Acceptance Criterion) can be implemented as a Verifier.
 */

import type { AnonTweetClient } from '../sdk/api-client.js'

// ─── Verification Result ────────────────────────────────────

export type Verdict = 'PASS' | 'FAIL' | 'SKIP' | 'WARN'

export interface StepResult {
  /** AC identifier, e.g. "AC-TWEET-001" */
  id: string
  /** Human-readable description */
  name: string
  /** PASS / FAIL / SKIP / WARN */
  verdict: Verdict
  /** Execution time in ms */
  durationMs: number
  /** Error message if FAIL */
  error?: string
  /** Optional detail output */
  detail?: string
}

export interface SuiteResult {
  /** Module name, e.g. "tweet", "translation", "ig" */
  module: string
  steps: StepResult[]
  passed: number
  failed: number
  skipped: number
  warned: number
  totalDurationMs: number
}

// ─── Context ──────────────────────────────────────────────────

/** Environment passed to every Verifier.run() */
export interface VerifyContext {
  /** SDK client if server is running; undefined for offline tests */
  client?: AnonTweetClient
  /** Fixtures directory absolute path */
  fixtureDir: string
  /** Whether CLI flag --verbose was set */
  verbose: boolean
  /** Environment variables available to tests */
  env: {
    hasTweetKeys: boolean
    hasInsCookies: boolean
    hasGeminiKey: boolean
    hasDeepSeekKey: boolean
  }
}

// ─── Verifier Interface ───────────────────────────────────────

/**
 * A Verifier maps to one or more Acceptance Criteria (ACs).
 *
 * Each verifier:
 * 1. Knows what module it belongs to
 * 2. Knows which ACs it covers
 * 3. Can check prerequisites (skip if unavailable)
 * 4. Runs tests and returns StepResults
 */
export interface Verifier {
  /** Unique identifier for this verifier */
  readonly id: string
  /** Module name for grouping */
  readonly module: string
  /** Human-readable label shown in CLI output */
  readonly label: string
  /** AC IDs covered by this verifier */
  readonly acIds: string[]

  /**
   * Check whether this verifier can run in the current context.
   * Returns a string reason if it cannot (which becomes a SKIP verdict).
   */
  canRun: (ctx: VerifyContext) => string | null

  /**
   * Execute verification steps.
   * Each step should map to one AC.
   */
  run: (ctx: VerifyContext) => Promise<StepResult[]>
}

// ─── CLI Options ──────────────────────────────────────────────

export interface CliOptions {
  /** Specific module to verify (undefined = all) */
  module?: string
  /** Specific AC to verify (undefined = all) */
  ac?: string
  /** Force run even if prerequisites missing */
  force?: boolean
  /** Verbose output */
  verbose?: boolean
  /** Exit with non-zero code on failure */
  exitOnFail?: boolean
}
