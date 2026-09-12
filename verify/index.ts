#!/usr/bin/env bun
/**
 * verify/index.ts — 验证套件薄 CLI（Phase E 收口）
 *
 * 执行引擎已迁移为 Vitest 三层架构（unit / acceptance / integration，见
 * docs/archive/testing-infra-refactor.md）。本文件只做参数映射，保持既有命令兼容：
 *
 *   bun run verify/index.ts                    # 全三层（integration 自动起 TestServer）
 *   bun run verify/index.ts --ac AC-TWEET-001  # 单 AC（vitest -t 过滤）
 *   bun run verify/index.ts --module tweet     # 子系统（-t 'AC-TWEET'，跨项目过滤）
 *   bun run verify/index.ts --exit-on-fail     # CI 模式（失败 exit 1）
 *
 * 防「空跑报绿」：vitest 的 `-t` 是无匹配即 skip 并按 exit 0 退出的**过滤**语义，
 * 故本 CLI 用 json reporter 统计真正 executed（passed + failed）数——为 0 即
 * 拒绝绿灯（exit 1）。未知 `--module` 在启动期直接拒绝（白名单校验）。
 *
 * SKIP 语义（无 TWEET_KEYS / INS_COOKIES 等）由各测试的 describe.skipIf 处理；
 * 但「整条过滤链一条都没执行」不再算通过。
 */

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { parseArgs } from 'node:util'

// verify 只跑三个 node 项目；storybook 浏览器项目（chromium 视觉测试）用
// `bun run test:storybook` 单独触发（见 vitest.config.ts 注释）
const NODE_PROJECTS = ['unit', 'acceptance', 'integration'] as const

/**
 * 模块 → AC 编号正则（vitest `-t` 的 testNamePattern）。
 *
 * ⚠️ 键必须映射到 `test/**` 中真实存在的 `it('AC-...')` 前缀，否则该模块会静默
 * 空跑。历史错配：`translation` 被写成 `AC-TRANSLATION`（实为 `AC-TRANS`）、
 * `screenshot` 写成 `AC-SCREENSHOT`（实为 `AC-SHOT` + `AC-PERF`）、`postmortem`
 * 写成 `AC-POSTMORTEM`（实为 `AC-PM`）。
 */
const MODULE_PATTERNS: Record<string, string> = {
  tweet: 'AC-TWEET',
  translation: 'AC-TRANS',
  ig: 'AC-IG',
  screenshot: 'AC-(SHOT|PERF)',
  media: 'AC-MEDIA',
  postmortem: 'AC-PM',
  ci: 'AC-CI',
  build: 'AC-BUILD',
  dev: 'AC-DEV',
  vision: 'AC-VISION',
  resolver: 'AC-RESOLVER',
  decouple: 'AC-DECOUPLE',
  sec: 'AC-SEC',
  obs: 'AC-OBS',
  pwa: 'AC-PWA',
  card: 'AC-CARD',
  ui: 'AC-UI',
  test: 'AC-TEST',
}

const MODULE_NAMES = Object.keys(MODULE_PATTERNS).sort()

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    'module': { type: 'string', short: 'm' },
    'ac': { type: 'string' },
    'server': { type: 'boolean', default: false },
    'server-port': { type: 'string' },
    'exit-on-fail': { type: 'boolean', default: false },
    'verbose': { type: 'boolean', short: 'v', default: false },
    'help': { type: 'boolean', short: 'h', default: false },
  },
  allowPositionals: true,
})

if (values.help) {
  console.log(`
  AnonTweet Verification Suite (Vitest-backed)

  Usage:
    bun run verify/index.ts [options]

  Options:
    --ac <id>             Only run a specific AC (e.g. AC-TWEET-001)
    --module, -m <name>   Only run a subsystem. Valid: ${MODULE_NAMES.join(', ')}
    --exit-on-fail        Exit with code 1 if any test fails (vitest default)
    --verbose, -v         Verbose reporter
    --help, -h            Show this help

  Deprecated (no-op, integration server is managed by globalSetup):
    --server, --server-port <port>

  Note:
    0 executed tests (filter matched nothing, or all skipped) exits non-zero.
  `)
  process.exit(0)
}

if (values.server || values['server-port'] !== undefined) {
  console.warn('⚠️  --server / --server-port are deprecated no-ops: the integration server is managed by globalSetup (test/integration/global-setup.ts).')
}

// 白名单启动校验：未知模块直接失败，不再退化成「匹配不到 → exit 0」。
if (values.module && !(values.module in MODULE_PATTERNS)) {
  console.error(`❌ Unknown --module "${values.module}".`)
  console.error(`   Valid modules: ${MODULE_NAMES.join(', ')}`)
  process.exit(1)
}

const vitestArgs: string[] = [
  'run',
  // 只跑三个 node 项目（unit/acceptance/integration）。Storybook 浏览器测试
  // （storybook 项目，需 chromium）是独立可视化基线，用 `bun run test:storybook`
  // （`--project 'storybook:*'`）显式触发，不进 verify/pre-push 门禁。
  ...NODE_PROJECTS.flatMap(p => ['--project', p] as string[]),
]

let filterDescription = ''
// AC 过滤：vitest -t 子串/正则匹配 test 名（AC 编号 = test 名契约）
if (values.ac) {
  vitestArgs.push('-t', values.ac)
  filterDescription = `--ac ${values.ac}`
}
else if (values.module) {
  const pattern = MODULE_PATTERNS[values.module]!
  vitestArgs.push('-t', pattern)
  filterDescription = `--module ${values.module} (pattern ${pattern})`
}

if (values.verbose)
  vitestArgs.push('--reporter=verbose')

// json reporter 落盘用于统计「真正执行」的用例数（防 0 匹配假绿）。
// 与 default reporter 并存：终端仍输出人类可读结果。
const reportFile = path.join(os.tmpdir(), `anon-tweet-verify-${process.pid}.json`)
vitestArgs.push('--reporter=default', '--reporter=json', `--outputFile.json=${reportFile}`)

const result = spawnSync('bunx', ['vitest', ...vitestArgs], {
  stdio: 'inherit',
})

const status = result.status ?? 1

let collected = 0
let executed = 0
try {
  const report = JSON.parse(fs.readFileSync(reportFile, 'utf8')) as {
    numTotalTests?: number
    numPassedTests?: number
    numFailedTests?: number
  }
  collected = report.numTotalTests ?? 0
  executed = (report.numPassedTests ?? 0) + (report.numFailedTests ?? 0)
}
catch {
  // 报告缺失（例如 vitest 自身崩溃）→ 交给原始 exit code 判定
}
finally {
  fs.rmSync(reportFile, { force: true })
}

// 绿灯但一条都没执行 = 「空跑报绿」，拒绝。
if (status === 0 && executed === 0) {
  console.error('')
  console.error(`❌ No tests executed (0 passed / 0 failed; ${collected} collected). Refusing a false green.`)
  if (filterDescription)
    console.error(`   Filter ${filterDescription} matched no runnable test.`)
  else
    console.error('   The suite collected no runnable tests at all.')
  process.exit(1)
}

process.exit(status)
