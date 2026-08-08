#!/usr/bin/env bun
/**
 * verify/index.ts
 *
 * CLI entry point for the verification suite.
 *
 * Usage:
 *   bun run verify/index.ts                    # Run all verifiers
 *   bun run verify/index.ts --module tweet     # Run tweet verifiers only
 *   bun run verify/index.ts --module translation --verbose
 *   bun run verify/index.ts --ac AC-TWEET-001  # Run a single AC
 *   bun run verify/index.ts --server           # With live server
 */

import type { CliOptions } from './framework/types.js'
import { parseArgs } from 'node:util'
import { VerifyRunner } from './framework/runner.js'
import { CIVerifier } from './modules/ci.verifier.js'
import { IGVerifier } from './modules/ig.verifier.js'
import { ScreenshotVerifier } from './modules/screenshot.verifier.js'
import { TranslationVerifier } from './modules/translation.verifier.js'
import { TweetVerifier } from './modules/tweet.verifier.js'

// ─── Parse CLI args ─────────────────────────────────────────

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    'module': { type: 'string', short: 'm' },
    'ac': { type: 'string' },
    'server': { type: 'boolean', default: false },
    'server-port': { type: 'string' },
    'force': { type: 'boolean', default: false },
    'verbose': { type: 'boolean', short: 'v', default: false },
    'exit-on-fail': { type: 'boolean', default: false },
    'help': { type: 'boolean', short: 'h', default: false },
  },
  allowPositionals: true,
})

if (values.help) {
  console.log(`
  AnonTweet Verification Suite

  Usage:
    bun run verify/index.ts [options]

  Options:
    --module, -m <name>   Only run verifiers for a module (tweet/translation/ig/screenshot)
    --ac <id>             Only run a specific AC (e.g. AC-TWEET-001)
    --server              Start the test server before verifying
    --server-port <port>  Server port (default: 9081)
    --force               Force run even if prerequisites missing
    --verbose, -v         Verbose output
    --exit-on-fail        Exit with code 1 if any test fails
    --help, -h            Show this help

  Module names:
    tweet         Tweet parsing & API
    translation   Translation pipeline (entity protection, resolution)
    ig            Instagram integration
    ci            CI/CD pipeline (GitHub Actions workflow)
    screenshot    Screenshot export (AC-SHOT-001~004)
  `)
  process.exit(0)
}

const options: CliOptions = {
  module: values.module as string | undefined,
  ac: values.ac as string | undefined,
  force: values.force as boolean,
  verbose: values.verbose as boolean,
  exitOnFail: values['exit-on-fail'] as boolean,
}

// ─── Print header ─────────────────────────────────────────

console.log('')
console.log('  AnonTweet Verification Suite')
console.log(`  ${new Date().toISOString()}`)
console.log('')

// ─── Setup ─────────────────────────────────────────────────

const runner = new VerifyRunner(options)

// Register all verifiers
runner.register(new TweetVerifier())
runner.register(new TranslationVerifier())
runner.register(new IGVerifier())
runner.register(new CIVerifier())
runner.register(new ScreenshotVerifier())

// If --server flag, start the test server and inject client
// This is a simplified version; full server lifecycle in future iteration
if (values.server) {
  const port = Number.parseInt(values['server-port'] as string || '9081', 10)
  console.log(`  [Setup] Test server not auto-started. Use --server-port to connect.`)
  console.log(`  [Setup] Manually start: bun run dev (PORT=${port})`)
  console.log('')
}

// ─── Run ───────────────────────────────────────────────────

const suites = await runner.run()

// ─── Exit code ─────────────────────────────────────────────

if (options.exitOnFail) {
  const hasFailure = suites.some(s => s.failed > 0)
  if (hasFailure) {
    process.exit(1)
  }
}

// Provide exit code info
const totalFailed = suites.reduce((s, suite) => s + suite.failed, 0)
if (totalFailed > 0) {
  process.exitCode = 1
}
