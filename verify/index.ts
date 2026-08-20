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
 *   bun run verify/index.ts --exit-on-fail     # CI 模式（vitest 默认失败即 exit 1）
 *   bun run verify/index.ts --server           # 兼容参数（服务器由 globalSetup 管理，no-op）
 *
 * SKIP 语义（无 TWEET_KEYS / INS_COOKIES 等）由各测试的 describe.skipIf 处理。
 */

import { spawnSync } from 'node:child_process'
import { parseArgs } from 'node:util'

// verify 只跑三个 node 项目；storybook 浏览器项目（chromium 视觉测试）用
// `bun run test:storybook` 单独触发（见 vitest.config.ts 注释）
const NODE_PROJECTS = ['unit', 'acceptance', 'integration'] as const

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
    --module, -m <name>   Only run a subsystem (tweet/translation/ig/screenshot/media/postmortem/ci/vision)
    --server              Accept for compatibility — integration server is managed by globalSetup
    --server-port <port>  Accepted for compatibility
    --exit-on-fail        Exit with code 1 if any test fails (vitest default)
    --verbose, -v         Verbose reporter
    --help, -h            Show this help
  `)
  process.exit(0)
}

const vitestArgs: string[] = [
  'run',
  // 只跑三个 node 项目（unit/acceptance/integration）。Storybook 浏览器测试
  // （storybook 项目，需 chromium）是独立可视化基线，用 `bun run test:storybook`
  // （`--project 'storybook:*'`）显式触发，不进 verify/pre-push 门禁。
  ...NODE_PROJECTS.flatMap(p => ['--project', p] as string[]),
]

// AC 过滤：vitest -t 子串匹配 test 名（AC 编号 = test 名契约）
if (values.ac) {
  vitestArgs.push('-t', values.ac)
}
else if (values.module) {
  vitestArgs.push('-t', `AC-${values.module.toUpperCase()}`)
}

if (values.verbose)
  vitestArgs.push('--reporter=verbose')

// --exit-on-fail：vitest run 默认在失败时 exit 1，无需额外处理；参数保留兼容

const result = spawnSync('bunx', ['vitest', ...vitestArgs], {
  stdio: 'inherit',
})

process.exit(result.status ?? 1)
