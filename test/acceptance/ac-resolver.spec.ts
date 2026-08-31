import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const DERIVE_MANUAL_EXPORT_RE = /export function deriveManualTranslation/

/**
 * test/acceptance/ac-resolver.spec.ts
 *
 * AC-RESOLVER-001 仓库级静态检查：三处选择链必须收敛为单一纯函数
 * `deriveManualTranslation`（app/lib/translation/resolveEntities.ts）。
 *
 * 两个编辑器 hook 不得再内联实现 manual > ai > legacy 选择链（review P2-3 /
 * postmortem #009 的四处漂移复发土壤）。
 */
const HOOKS = [
  'app/hooks/use-translation-editor-logic.ts',
  'app/hooks/use-alt-translation-logic.ts',
] as const

// 内联选择链特征：按 index 查找后多级 || 回退翻译值（旧实现模式）
const INLINE_CHAIN_RE = /\.find\(\s*[a-zA-Z]+\s*=>\s*(entity|original)\.index\s*===/

describe('AC-RESOLVER-001: hooks converge on deriveManualTranslation (source scan)', () => {
  for (const rel of HOOKS) {
    const abs = path.resolve(import.meta.dirname, '..', '..', rel)

    it(`${path.basename(rel)} imports and uses deriveManualTranslation`, () => {
      expect(fs.existsSync(abs)).toBe(true)
      const src = fs.readFileSync(abs, 'utf8')
      const importLine = src.split('\n').find(line => line.includes('from') && line.includes('resolveEntities'))
      expect(importLine).toBeTruthy()
      expect(importLine).toContain('deriveManualTranslation')
      // 名称确实被调用（不止 import 了）
      expect(src.match(/deriveManualTranslation/g)!.length).toBeGreaterThanOrEqual(2)
    })

    it(`${path.basename(rel)} does not inline the selection chain`, () => {
      const src = fs.readFileSync(abs, 'utf8')
      expect(src).not.toMatch(INLINE_CHAIN_RE)
    })
  }

  it('deriveManualTranslation is exported from resolveEntities.ts', () => {
    const abs = path.resolve(import.meta.dirname, '..', '..', 'app/lib/translation/resolveEntities.ts')
    const src = fs.readFileSync(abs, 'utf8')
    expect(src).toMatch(DERIVE_MANUAL_EXPORT_RE)
  })
})
