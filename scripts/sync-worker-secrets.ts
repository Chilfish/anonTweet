#!/usr/bin/env bun
/**
 * 把本机 `.dev.vars` 里的敏感值同步到 Cloudflare Worker secrets。
 *
 *   bun run secrets:worker               # 默认同步 INS_COOKIES
 *   bun run secrets:worker TWEET_KEYS    # 指定 secret，可多个
 *   bun run secrets:worker --dry-run     # 只检查本地值，不写入线上
 *
 * 读取顺序：`.dev.vars` → `.env`（只补缺失键）。值经 stdin 传给
 * `wrangler secret put`，不出现在进程参数或日志里。
 *
 * `wrangler secret put` 只更新线上 binding，不上传代码，改完立即生效，不需要再 deploy。
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { parseEnvContent } from './lib/env.ts'

const APP_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ENV_FILES = ['.dev.vars', '.env']
const DEFAULT_SECRETS = ['INS_COOKIES']
const MAX_SECRET_BYTES = 5 * 1024

const USAGE = `用法：bun scripts/sync-worker-secrets.ts [secret...] [选项]

把本地环境文件里的值同步到 Cloudflare Worker secrets。

默认同步：${DEFAULT_SECRETS.join(' ')}
读取顺序：${ENV_FILES.join(' → ')}（只补缺失键）。

选项：
  --dry-run     只检查本地值，不写入线上
  -h, --help    显示本帮助`

const { values, positionals } = parseArgs({
  options: {
    'dry-run': { type: 'boolean' },
    'help': { type: 'boolean', short: 'h' },
  },
  allowPositionals: true,
})

if (values.help) {
  console.log(USAGE)
  process.exit(0)
}

function log(message: string): void {
  console.log(`[secrets:worker] ${message}`)
}

function fail(message: string): never {
  console.error(`[secrets:worker] ${message}`)
  process.exit(1)
}

function mask(value: string): string {
  return value.length <= 4
    ? '****'
    : `****${value.slice(-4)}`
}

function readLocalValues(): Record<string, string> {
  const values: Record<string, string> = {}
  for (const file of ENV_FILES) {
    const path = join(APP_ROOT, file)
    if (!existsSync(path))
      continue
    for (const [key, value] of Object.entries(parseEnvContent(readFileSync(path, 'utf8')))) {
      if (values[key] === undefined)
        values[key] = value
    }
  }
  return values
}

/** 失败时抛错而非退出，便于批量任务收集全部失败项后统一报告。 */
function runWrangler(args: string[], input?: string): string {
  const result = spawnSync('bun', [
    'x',
    'wrangler',
    '--config',
    'wrangler.jsonc',
    ...args,
  ], {
    cwd: APP_ROOT,
    input,
    encoding: 'utf8',
    stdio: input === undefined
      ? ['ignore', 'pipe', 'pipe']
      : ['pipe', 'inherit', 'inherit'],
  })
  if (result.error)
    throw new Error(`wrangler ${args.join(' ')} 启动失败：${result.error.message}`)
  if (result.status !== 0)
    throw new Error(`wrangler ${args.join(' ')} 失败（退出码 ${result.status ?? 'unknown'}）`)
  return result.stdout ?? ''
}

const names = positionals
  .flatMap(item => item.split(','))
  .map(name => name.trim())
  .filter(Boolean)
const targets = names.length ? names : DEFAULT_SECRETS

const local = readLocalValues()
const missing = targets.filter(name => !local[name])
if (missing.length)
  fail(`本地缺少 ${missing.join(' / ')}；请在 ${ENV_FILES[0]} 中配置`)

const oversized = targets.filter(name => Buffer.byteLength(local[name]!, 'utf8') > MAX_SECRET_BYTES)
if (oversized.length) {
  fail(`${oversized.join(' / ')} 超过 Cloudflare 单个 secret 上限 ${MAX_SECRET_BYTES} 字节，请拆分成独立 secret 或改用 KV`)
}

for (const name of targets)
  log(`${name} ← ${mask(local[name]!)}（${Buffer.byteLength(local[name]!, 'utf8')} 字节）`)

if (values['dry-run']) {
  log('dry-run：本地值校验通过，未写入线上')
  process.exit(0)
}

const failures: string[] = []
for (const name of targets) {
  try {
    runWrangler(['secret', 'put', name], `${local[name]!}\n`)
    log(`✓ ${name} 已更新`)
  }
  catch (error) {
    failures.push(`${name}：${error instanceof Error
      ? error.message
      : String(error)}`)
  }
}

if (failures.length)
  fail(`写入失败：\n  ${failures.join('\n  ')}`)

let listed: { name: string }[]
try {
  listed = JSON.parse(runWrangler(['secret', 'list', '--format', 'json'])) as { name: string }[]
}
catch (error) {
  fail(`读取线上 secret 列表失败：${error instanceof Error
    ? error.message
    : String(error)}`)
}
const absent = targets.filter(name => !listed.some(secret => secret.name === name))
if (absent.length)
  fail(`写入后校验失败：${absent.join(' / ')} 不在线上 secret 列表里`)

log('完成；secrets 已立即生效，无需重新 deploy（代码有变更时再跑 bun run deploy）')
