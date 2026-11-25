#!/usr/bin/env bun
/**
 * 本地开发基础设施 CLI（@chilfish/devkit）。
 *
 *   bun run devkit dev db       # 启动 Postgres、建库、跑迁移、写入 .dev.vars
 *   bun run devkit dev proxy    # 前台运行 Neon HTTP /sql 代理
 *   bun run devkit dev status   # 只读检查本地栈
 */
import { readFileSync } from 'node:fs'
import { buildCli, runCli } from '@chilfish/devkit/cli'
import { createDevCommands } from '@chilfish/devkit/commands'
import { devkit } from '../dev.config.ts'

const pkg = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
) as { version: string }

const program = buildCli({
  config: devkit,
  version: pkg.version,
  groups: [
    createDevCommands(devkit),
  ],
})

await runCli(program, process.argv.slice(2))
