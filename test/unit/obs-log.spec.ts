import { beforeEach, describe, expect, it, vi } from 'vitest'
import { obsLog, suffix } from '~/lib/obs-log'

const NEWLINE_RE = /\n/

/**
 * AC-OBS-001 P5：obs-log helper 单测——单行 JSON 格式与敏感字段摘要。
 */
describe('obs-log (AC-OBS-001)', () => {
  let logSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    // restoreMocks 配置下模块级 spy 会在用例间被还原，须在每个用例前重建
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  it('obsLog emits a single-line JSON with ts and event', () => {
    obsLog('cache.get', { hit: true, adapter: 'Memory(LRU)' })
    expect(logSpy).toHaveBeenCalledTimes(1)

    const line = logSpy.mock.calls[0]![0] as string
    const parsed = JSON.parse(line)
    expect(parsed.event).toBe('cache.get')
    expect(parsed.hit).toBe(true)
    expect(parsed.adapter).toBe('Memory(LRU)')
    expect(new Date(parsed.ts).getTime()).not.toBeNaN()
    // 单行：无换行符，便于聚合采集
    expect(line).not.toMatch(NEWLINE_RE)
  })

  it('suffix shortens long ids and passes short/empty through', () => {
    expect(suffix('12345678901234567890')).toBe('...1234567890')
    expect(suffix('abc')).toBe('abc')
    expect(suffix('')).toBe('none')
    expect(suffix(null)).toBe('none')
    expect(suffix(undefined)).toBe('none')
  })
})
