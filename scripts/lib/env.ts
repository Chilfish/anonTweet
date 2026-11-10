import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * 唯一的环境文件。wrangler / react-router dev 原生读取它，构建与部署脚本也读同一份。
 * 线上值由 wrangler 的 vars / secrets 提供，不写回这个文件。
 */
export const ENV_FILE = '.dev.vars'

const NEWLINE_RE = /\r?\n/

/**
 * 解析 `.dev.vars` 格式；不做变量展开，只处理注释、空行与成对引号。
 * `KEY=a=b` 按第一个 `=` 切分，值里可以再出现 `=`。
 */
export function parseEnvContent(content: string): Record<string, string> {
  const values: Record<string, string> = {}
  for (const line of content.split(NEWLINE_RE)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#'))
      continue

    const separator = trimmed.indexOf('=')
    if (separator === -1)
      continue

    const key = trimmed.slice(0, separator).trim()
    if (!key)
      continue

    let value = trimmed.slice(separator + 1).trim()
    if (value.startsWith('"') || value.startsWith('\'')) {
      const quote = value[0]!
      const end = value.indexOf(quote, 1)
      value = end === -1
        ? value.slice(1)
        : value.slice(1, end)
    }
    else {
      const comment = value.indexOf(' #')
      if (comment !== -1)
        value = value.slice(0, comment).trim()
    }

    values[key] = value
  }
  return values
}

/** 只读环境文件，不写入 `process.env`。 */
export function readEnvFile(path: string): Record<string, string> {
  return parseEnvContent(readFileSync(path, 'utf8'))
}

export interface LoadEnvOptions {
  /** 仓库根目录；默认当前工作目录。 */
  cwd?: string
  /** 日志前缀，默认 `env`。 */
  prefix?: string
}

/**
 * 读 `.dev.vars`，只补齐当前进程里不存在的键。
 * 命令行 / CI 显式传入的变量始终优先，不会被子进程的构建脚本覆盖。
 */
export function loadEnvFiles(options: LoadEnvOptions = {}): void {
  const path = resolve(options.cwd ?? process.cwd(), ENV_FILE)
  if (!existsSync(path))
    return

  const values = readEnvFile(path)
  let loaded = 0
  for (const [key, value] of Object.entries(values)) {
    if (process.env[key] !== undefined)
      continue
    process.env[key] = value
    loaded++
  }

  console.log(`[${options.prefix ?? 'env'}] ${ENV_FILE}: ${loaded}/${Object.keys(values).length} keys loaded`)
}
