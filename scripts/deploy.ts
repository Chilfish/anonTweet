#!/usr/bin/env bun
/**
 * 部署到 Cloudflare Workers。
 *
 *   bun run deploy               # build + wrangler deploy
 *   bun run deploy -- --no-deploy # 只构建并校验产物
 *
 * 1. 强制 `ENVIRONMENT=production`、关闭本地 FS 缓存；
 * 2. 读 `.dev.vars` 补齐构建期需要的值（命令行 / CI 环境变量优先）；
 * 3. 清空 `build/` 后从零构建，避免旧 chunk 残留；
 * 4. 通过后才执行 `wrangler deploy`。
 */
import { spawnSync } from 'node:child_process'
import { existsSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { loadEnvFiles } from './lib/env.ts'

const APP_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const BUILD_ROOT = join(APP_ROOT, 'build')

const USAGE = `用法：bun scripts/deploy.ts [选项]

构建并用线上配置部署到 Cloudflare Workers。

选项：
  --no-deploy   只构建并校验产物，不执行 wrangler deploy
  -h, --help    显示本帮助`

const { values } = parseArgs({
  options: {
    'no-deploy': { type: 'boolean' },
    'help': { type: 'boolean', short: 'h' },
  },
  allowPositionals: false,
})

if (values.help) {
  console.log(USAGE)
  process.exit(0)
}

function log(message: string): void {
  console.log(`[deploy] ${message}`)
}

function fail(message: string): never {
  console.error(`[deploy] ${message}`)
  process.exit(1)
}

function run(args: string[], label: string): void {
  const result = spawnSync(args[0] as string, args.slice(1), {
    cwd: APP_ROOT,
    env: process.env,
    stdio: 'inherit',
  })
  if (result.error)
    fail(`${label} 启动失败：${result.error.message}`)
  if (result.status !== 0)
    fail(`${label} 失败（退出码 ${result.status ?? 'unknown'}）`)
}

process.env.ENVIRONMENT = 'production'
process.env.ENABLE_LOCAL_CACHE = 'false'
loadEnvFiles({ cwd: APP_ROOT, prefix: 'deploy' })

log('清理 build/')
try {
  rmSync(BUILD_ROOT, { recursive: true, force: true })
}
catch (error) {
  let message = String(error)
  if (error instanceof Error)
    message = error.message
  fail(`build/ 被占用，请先停止 vite preview / wrangler dev：${message}`)
}

log('构建 Worker 与静态资源')
run(['bun', 'run', 'build'], 'react-router build')

for (const dir of ['client', 'server']) {
  if (!existsSync(join(BUILD_ROOT, dir)))
    fail(`构建产物缺少 build/${dir}`)
}

const wranglerConfig = join(BUILD_ROOT, 'server', 'wrangler.json')
if (!existsSync(wranglerConfig))
  fail('构建产物缺少 build/server/wrangler.json，无法部署')

if (values['no-deploy']) {
  log('构建校验通过，已跳过 wrangler deploy')
  process.exit(0)
}

log('部署到 Cloudflare Workers')
run([
  'bun',
  'x',
  'wrangler',
  'deploy',
  '--config',
  wranglerConfig,
], 'wrangler deploy')
