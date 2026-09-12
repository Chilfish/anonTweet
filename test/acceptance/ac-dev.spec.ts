/**
 * test/acceptance/ac-dev.spec.ts
 *
 * L3 AC 语义层 — dev / build 脚本模式固定（F1 / postmortem 011）：
 * AC-DEV-002（结构性防护，源码扫描）。
 *
 * 行为验收（AC-DEV-001）在集成层：test/integration/dev-server.spec.ts。
 * 本条只做快速结构约束——脚本被改回裸命令时立即失败，避免再次静默回归。
 */
import { describe, expect, it } from 'vitest'
import { readProjectFile } from '../helpers/read-project-file'

interface PackageJson {
  scripts: Record<string, string>
}

const pkg = JSON.parse(readProjectFile('package.json') ?? '{}') as PackageJson

describe('AC-DEV script mode pinning (structural guard)', () => {
  it('AC-DEV-002: dev/build scripts pin NODE_ENV to avoid inherited-mode crashes', () => {
    expect(pkg.scripts.dev).toContain('NODE_ENV=development')
    expect(pkg.scripts.build).toContain('NODE_ENV=production')
  })
})
