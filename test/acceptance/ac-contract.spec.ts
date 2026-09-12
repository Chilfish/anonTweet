/**
 * test/acceptance/ac-contract.spec.ts
 *
 * 契约元测试（F4 / review-2026-09-11 P1-6）：AC 编号 ↔ 测试名一致性。
 *
 * verify/README.md 宣称「AC 编号即测试名，文档 ↔ 代码 1:1 可追溯」。本测试把这句
 * 话变成机器可查的不变量：
 *   - 采集 `verify/acceptance-criteria/*.md` 中出现的全部 AC 编号（文档集）
 *   - 采集 `test/**` 中 `describe` / `it` **名字**里的 AC 编号（测试集）
 *     （含 `it.skipIf(...)('AC-...')` 形式；`AC-X-001/002` 简写会展开为两条）
 *   - 任一方向的差集非空即失败
 *
 * 注意：只认「名字」，不认注释 / 普通字符串——避免「注释里提一句 AC 编号」就算覆盖。
 * 若某条 AC 的语义已被测试覆盖但命名未对齐，应补名字（见 F9 的 AC-TRANS-005/006/007）。
 */
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { projectPath, walkTsFiles } from '../helpers/read-project-file'

const CRITERIA_DIR = projectPath(path.join('verify', 'acceptance-criteria'))
const TEST_DIR = projectPath('test')

/** 匹配 AC-<组>-<三位数>，并把 `AC-X-001/002/003` 的斜杠简写展开为多条。 */
const AC_ID_RE = /\bAC-([A-Z][A-Z0-9-]*?)-(\d{3})((?:\/\d{3})*)/g

/** describe/it 名字字面量（含 it.skipIf(...)('name') 这类修饰形式）。 */
const NAME_CALL_RE = /\b(?:it|test|describe)(?:\.[A-Za-z]+(?:\([^()]*\))?)?\(\s*(['"`])([\s\S]*?)\1/g

function collectIds(text: string, into: Set<string>) {
  for (const match of text.matchAll(AC_ID_RE)) {
    const prefix = `AC-${match[1]}`
    into.add(`${prefix}-${match[2]}`)
    for (const extra of (match[3] ?? '').split('/').filter(Boolean))
      into.add(`${prefix}-${extra}`)
  }
}

function docAcIds(): Set<string> {
  const ids = new Set<string>()
  for (const file of fs.readdirSync(CRITERIA_DIR).filter(f => f.endsWith('.md')))
    collectIds(fs.readFileSync(path.join(CRITERIA_DIR, file), 'utf8'), ids)
  return ids
}

function testAcIds(): Set<string> {
  const ids = new Set<string>()
  for (const file of walkTsFiles(TEST_DIR).filter(f => f.endsWith('.spec.ts'))) {
    const src = fs.readFileSync(file, 'utf8')
    for (const call of src.matchAll(NAME_CALL_RE))
      collectIds(call[2]!, ids)
  }
  return ids
}

const sorted = (s: Set<string>) => [...s].sort()

describe('AC-contract: AC numbers in criteria docs match test names 1:1', () => {
  it('no AC number is documented without a named test, and vice versa', () => {
    const docs = docAcIds()
    const tests = testAcIds()

    const docOnly = sorted(new Set([...docs].filter(id => !tests.has(id))))
    const testOnly = sorted(new Set([...tests].filter(id => !docs.has(id))))

    expect(
      { docOnly, testOnly },
      [
        'AC number ↔ test name contract broken:',
        `  doc-only  (in criteria, no describe/it name): ${docOnly.join(', ') || '—'}`,
        `  test-only (named test, not in criteria):      ${testOnly.join(', ') || '—'}`,
      ].join('\n'),
    ).toEqual({ docOnly: [], testOnly: [] })
  })
})
