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

  it('AC-DEV-003: bun run dev brings up the local database stack on demand', () => {
    expect(pkg.scripts.dev).toContain('NODE_ENV=development')
    expect(pkg.scripts.dev).toContain('scripts/dev.ts')

    const devScript = readProjectFile('scripts/dev.ts') ?? ''
    expect(devScript).toContain('ENABLE_DB_CACHE')
    expect(devScript).toContain('ensureDevServices')
    expect(devScript).toContain('react-router')

    const config = readProjectFile('dev.config.ts') ?? ''
    expect(config).toContain(`file: '.dev.vars'`)
    expect(config).toContain(`migrations: 'drizzle'`)
    expect(config).toContain('proxyEndpoint')

    const envSource = readProjectFile('app/lib/env.server.ts') ?? ''
    expect(envSource).toContain('DATABASE_URL')
    expect(envSource).toContain('NEON_HTTP_ENDPOINT')
    expect(readProjectFile('app/lib/database/db.server.ts')).toContain('neonConfig.fetchEndpoint')
  })
})
