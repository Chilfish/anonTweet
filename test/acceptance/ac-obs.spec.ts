import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const OBS_LOG_EXPORT_RE = /export function obsLog/
const OBS_EVENT_TYPE_RE = /export type ObsEvent/
const SUFFIX_EXPORT_RE = /export function suffix/
const MS_NOW_STARTED_AT_RE = /ms: Date\.now\(\) - startedAt/
const ATTEMPTS_RE = /attempts/
const SENSITIVE_FIELD_RE = /apiKey|baseUrl|authorization/i
const CACHE_HIT_RE = /hit: cachedData !== null/
const ADAPTER_NAME_RE = /adapter: adapter\.name/

/**
 * test/acceptance/ac-obs.spec.ts
 *
 * AC-OBS-001 仓库级静态检查（阶段二任务 3）：翻译耗时 / 缓存命中率 / RettiwtPool 状态
 * 统一输出单行 JSON 结构化日志（app/lib/obs-log.ts），且日志字段不得包含敏感信息。
 */

const read = (rel: string) => fs.readFileSync(path.resolve(import.meta.dirname, '..', '..', rel), 'utf8')

const HELPER = 'app/lib/obs-log.ts'
const FILES = {
  aiTweet: 'app/lib/AITranslation.ts',
  aiIG: 'app/lib/translateIGCaption.ts',
  cache: 'app/lib/localCache.ts',
  pool: 'app/lib/SmartPool.ts',
} as const

describe('AC-OBS-001: structured JSON observability logs', () => {
  it('obs-log.ts exports obsLog, ObsEvent and suffix', () => {
    const src = read(HELPER)
    expect(src).toMatch(OBS_LOG_EXPORT_RE)
    expect(src).toMatch(OBS_EVENT_TYPE_RE)
    expect(src).toMatch(SUFFIX_EXPORT_RE)
    for (const event of ['ai.translate', 'ai.translate.ig', 'cache.get', 'pool.rotate', 'pool.exhaust']) {
      expect(src).toContain(event)
    }
  })

  it('translation paths log latency with ms and attempts (no secrets)', () => {
    const tweetSrc = read(FILES.aiTweet)
    expect(tweetSrc).toContain('obsLog(\'ai.translate\'')
    expect(tweetSrc).toMatch(MS_NOW_STARTED_AT_RE)
    expect(tweetSrc).toMatch(ATTEMPTS_RE)

    const igSrc = read(FILES.aiIG)
    expect(igSrc).toContain('obsLog(\'ai.translate.ig\'')
    expect(igSrc).toMatch(MS_NOW_STARTED_AT_RE)

    // 敏感字段禁入日志：obsLog 调用行不得引用 apiKey/baseUrl
    const tweetLogLines = tweetSrc.split('\n').filter(l => l.includes('obsLog(\'ai.translate\''))
    for (const line of tweetLogLines)
      expect(line).not.toMatch(SENSITIVE_FIELD_RE)
    const igLogLines = igSrc.split('\n').filter(l => l.includes('obsLog(\'ai.translate.ig\''))
    for (const line of igLogLines)
      expect(line).not.toMatch(SENSITIVE_FIELD_RE)
  })

  it('local cache logs cache.get with hit flag and adapter name', () => {
    const src = read(FILES.cache)
    expect(src).toContain('obsLog(\'cache.get\'')
    expect(src).toMatch(CACHE_HIT_RE)
    expect(src).toMatch(ADAPTER_NAME_RE)
  })

  it('pool logs rotation and exhaustion events', () => {
    const src = read(FILES.pool)
    expect(src).toContain('obsLog(\'pool.rotate\'')
    expect(src).toContain('obsLog(\'pool.exhaust\'')
  })
})
