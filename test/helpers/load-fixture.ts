/**
 * test/helpers/load-fixture.ts
 *
 * 统一 fixture 加载器（单一解包规则）——取代 verify/ 下 4 处不一致的 loadFixture：
 * - tweet/ig/vision fixture 顶层为 { _meta, data }
 * - translation fixture 顶层为 { _meta, testCases }
 * - 统一规则：data ?? testCases ?? parsed（无包裹时原样返回）
 *
 * fixtures 目录：test/fixtures（由 verify/fixtures 迁移而来，见
 * docs/archive/testing-infra-refactor.md Phase A/E）
 */
import fs from 'node:fs'
import path from 'node:path'

const FIXTURES_DIR = path.resolve(import.meta.dirname, '..', 'fixtures')

interface WrappedFixture {
  _meta?: { source?: string, exportedAt?: string, schema?: string }
  data?: unknown
  testCases?: unknown
}

export function loadFixture<T = unknown>(rel: string): T {
  const filepath = path.join(FIXTURES_DIR, rel)
  const raw = fs.readFileSync(filepath, 'utf8')
  const parsed = JSON.parse(raw) as WrappedFixture
  return (parsed.data ?? parsed.testCases ?? parsed) as T
}

/** fixture 绝对路径（供需要直接读文件/校验 _meta 的场景） */
export function fixturePath(rel: string): string {
  return path.join(FIXTURES_DIR, rel)
}

/** 读取 _meta 元信息（来源/导出日期/schema 标签） */
export function fixtureMeta(rel: string): WrappedFixture['_meta'] {
  const filepath = path.join(FIXTURES_DIR, rel)
  const raw = fs.readFileSync(filepath, 'utf8')
  const parsed = JSON.parse(raw) as WrappedFixture
  return parsed._meta
}
