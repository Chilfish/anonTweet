/**
 * test/helpers/read-project-file.ts
 *
 * 仓库级源码/文档读取（统一取代 verify/ 下 6 处重复的 projectPath/readProjectFile）：
 * - projectPath(rel)：仓库根相对路径 → 绝对路径
 * - readProjectFile(rel)：读文件，不存在返回 null
 * - walkTsFiles(dir)：递归列出 .ts/.tsx（跳过 node_modules）
 */
import fs from 'node:fs'
import path from 'node:path'

export const PROJECT_ROOT = path.resolve(import.meta.dirname, '..', '..')

/** 仓库根相对路径 → 绝对路径 */
export function projectPath(rel: string): string {
  return path.join(PROJECT_ROOT, rel)
}

/** 读仓库文件；不存在返回 null */
export function readProjectFile(rel: string): string | null {
  const filepath = projectPath(rel)
  if (!fs.existsSync(filepath))
    return null
  return fs.readFileSync(filepath, 'utf8')
}

/** Matches source files (.ts / .tsx). Non-capturing group — regex is static. */
const TS_FILE_RE = /\.(?:ts|tsx)$/

/** 递归列出 .ts/.tsx 文件 */
export function walkTsFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkTsFiles(full, out)
    }
    else if (TS_FILE_RE.test(entry.name)) {
      out.push(full)
    }
  }
  return out
}
