#!/usr/bin/env bun
/**
 * 本地开发入口。
 *
 *   bun run dev
 *
 * `ENABLE_DB_CACHE=true` 时先拉起 devkit 本地栈（Postgres → 建库 → 迁移 →
 * `/sql` 代理 → 写入 `.dev.vars`），再启动 react-router dev；否则跳过本地库，
 * 只启动 dev server。集成测试会把 `ENABLE_DB_CACHE` 固定为 false，因此不会
 * 依赖本机 Postgres。
 */
import { spawn } from 'node:child_process'
import { resolveServerSpawn } from '@chilfish/devkit/commands'
import { loadEnvFile } from '@chilfish/devkit/env'
import { ensureDevServices } from '@chilfish/devkit/local'
import { devkit } from '../dev.config.ts'

const TRUTHY = new Set(['true', '1', 'yes', 'on'])

function isDbCacheEnabled(): boolean {
  return TRUTHY.has((process.env.ENABLE_DB_CACHE ?? '').trim().toLowerCase())
}

loadEnvFile({ config: devkit })

if (isDbCacheEnabled()) {
  // ensureEnvFile 只在本地模式写入本地地址
  process.env.LOCAL = '1'
  try {
    await ensureDevServices({ config: devkit, storage: false })
  }
  catch (error) {
    console.error(`[dev] local database stack failed: ${error instanceof Error
      ? error.message
      : String(error)}`)
    console.error('[dev] set ENABLE_DB_CACHE=false to start without the local database')
    process.exit(1)
  }
}

/**
 * 运行时必须是 Node：`@cloudflare/vite-plugin` 的 miniflare 用 undici 的
 * dispatcher 做内部转发（`__vite_plugin_cloudflare_*` 请求打到 `http://localhost`），
 * 而 Bun 的 `undici` 只是残缺 shim（没有真正的 MockAgent/Dispatcher），
 * 换到 Bun 后这些内部请求会真连 `localhost:80`，启动直接 ECONNREFUSED。
 * 旧脚本走 `.bin/react-router` 的 `#!/usr/bin/env node` 恰好跑在 Node 上，
 * devkit 包装后必须显式声明。
 */
const plan = resolveServerSpawn(
  {
    runtime: 'node',
    command: 'react-router',
    args: ['dev'],
  },
  process.argv.slice(2),
)

const child = spawn(plan.executable, plan.args, {
  stdio: 'inherit',
  env: process.env,
  shell: plan.shell,
})

function forward(signal: NodeJS.Signals) {
  if (!child.killed)
    child.kill(signal)
}
process.on('SIGINT', forward)
process.on('SIGTERM', forward)

const code = await new Promise<number>((resolve) => {
  child.on('exit', (exitCode, signal) => resolve(exitCode ?? (signal ? 1 : 0)))
})

process.off('SIGINT', forward)
process.off('SIGTERM', forward)
process.exit(code)
