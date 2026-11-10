#!/usr/bin/env bun
/**
 * 把 Cloudflare 部署凭据同步到 GitHub Actions Secrets。
 *
 *   bun run secrets:sync
 *
 * 读取顺序：`.env` → `.dev.vars`（只补缺失键）。值经 stdin 传给 `gh secret set`，
 * 不出现在进程参数或日志里。
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseEnvContent } from './lib/env.ts'

const APP_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const REQUIRED = ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID'] as const

function fail(message: string): never {
  console.error(`[secrets] ${message}`)
  process.exit(1)
}

function mask(value: string): string {
  return value.length <= 4
    ? '****'
    : `****${value.slice(-4)}`
}

function readLocalValues(): Record<string, string> {
  const values: Record<string, string> = {}
  for (const file of ['.env', '.dev.vars']) {
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

function gh(args: string[], input?: string): string {
  const result = spawnSync('gh', args, {
    cwd: APP_ROOT,
    input,
    encoding: 'utf8',
    stdio: input === undefined
      ? ['ignore', 'pipe', 'pipe']
      : ['pipe', 'pipe', 'pipe'],
  })
  if (result.error)
    fail(`gh ${args[0]} 启动失败：${result.error.message}`)
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || '').trim()
    fail(`gh ${args.join(' ')} 失败${detail
      ? `：${detail}`
      : ''}`)
  }
  return result.stdout.trim()
}

if (spawnSync('gh', ['auth', 'status'], { stdio: 'ignore' }).status !== 0)
  fail('gh 未登录，请先执行 `gh auth login`')

const repo = gh([
  'repo',
  'view',
  '--json',
  'nameWithOwner',
  '-q',
  '.nameWithOwner',
])
const local = readLocalValues()
const missing = REQUIRED.filter(name => !local[name])
if (missing.length)
  fail(`缺少 ${missing.join(' / ')}；请在 .env 或 .dev.vars 中配置`)

console.log(`[secrets] ${repo}`)
const failures: string[] = []
for (const name of REQUIRED) {
  const value = local[name]!
  const result = spawnSync('gh', ['secret', 'set', name, '--repo', repo], {
    cwd: APP_ROOT,
    input: `${value}\n`,
    stdio: ['pipe', 'inherit', 'inherit'],
  })
  if (result.status === 0)
    console.log(`[secrets] ✓ ${name} (${mask(value)})`)
  else
    failures.push(name)
}

if (failures.length)
  fail(`写入失败：${failures.join(' / ')}`)

const listed = gh(['secret', 'list', '--repo', repo])
const absent = REQUIRED.filter(name => !listed.includes(name))
if (absent.length)
  fail(`写入后校验失败：${absent.join(' / ')}`)

console.log('[secrets] 完成；push 到 main 的非文档变更会触发 deploy workflow')
