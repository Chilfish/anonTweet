/**
 * test/acceptance/ac-build.spec.ts
 *
 * L3 AC 语义层 — 构建管线完整性（postmortem 010）：
 * AC-BUILD-001~002。守护 Babel/.tsx 转换链，防止依赖升级再次静默打断 JSX 解析。
 */
import path from 'node:path'
import babel from '@babel/core'
import { describe, expect, it } from 'vitest'
import { projectPath, readProjectFile } from '../helpers/read-project-file'

const TSX_PROBE = `export default function App() {\n  return <div className="x">hi</div>\n}\n`

function installedMajor(pkg: string): string {
  const raw = readProjectFile(path.join('node_modules', pkg, 'package.json'))
  if (raw === null)
    throw new Error(`${pkg} is not installed`)
  const { version } = JSON.parse(raw) as { version: string }
  return version.slice(0, version.indexOf('.'))
}

describe('AC-BUILD babel pipeline integrity', () => {
  it('AC-BUILD-001: babel transpiles .tsx JSX with the project preset', () => {
    const result = babel.transformSync(TSX_PROBE, {
      filename: projectPath('app/ac-build-probe.tsx'),
      babelrc: false,
      configFile: false,
      presets: ['@babel/preset-typescript'],
      plugins: [['babel-plugin-react-compiler', {}]],
    })

    expect(result?.code).toBeTruthy()
    expect(result?.code).toContain('<div')
    expect(result?.code).toContain('react/compiler-runtime')
  })

  it('AC-BUILD-002: @babel/preset-typescript major matches @babel/core major', () => {
    expect(installedMajor('@babel/preset-typescript')).toBe(installedMajor('@babel/core'))
  })

  it('AC-BUILD-003: production build runs in pre-push and CI gates', () => {
    expect(readProjectFile('lefthook.yml')).toContain('bun run build')
    expect(readProjectFile(path.join('.github', 'workflows', 'verify.yml'))).toContain('bun run build')
  })
})
