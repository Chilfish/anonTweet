/**
 * test/acceptance/list-page-render.spec.ts
 *
 * AC-LIST-001：列表 ID 解析、状态出口与布局。
 */
import { describe, expect, it } from 'vitest'
import { extractListId } from '~/lib/url-detect'
import { readProjectFile } from '../helpers/read-project-file'

describe('AC-LIST-001: list page', () => {
  it('accepts a raw numeric ID or an X list URL', () => {
    expect(extractListId('1234567890')).toBe('1234567890')
    expect(extractListId('https://x.com/i/lists/1234567890')).toBe('1234567890')
    expect(extractListId('https://twitter.com/i/lists/123?lang=zh')).toBe('123')
    expect(extractListId(' not-a-list ')).toBeNull()
    expect(extractListId('')).toBeNull()
  })

  it('uses one solid surface, mobile spacing and error exits', () => {
    const page = readProjectFile('app/routes/list.tsx')
    expect(page, 'app/routes/list.tsx should exist').not.toBeNull()
    expect(page).toContain('max-w-[600px]')
    expect(page).toContain('px-3 sm:px-0')
    expect(page).toContain('rounded-2xl border border-border/60 bg-card')
    expect(page).toContain('列表加载失败')
    expect(page).toContain('重试')
    expect(page).not.toContain('setTimeout')
  })
})
