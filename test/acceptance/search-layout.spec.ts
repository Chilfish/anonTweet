/**
 * test/acceptance/search-layout.spec.ts
 *
 * AC-SEARCH-002：搜索页的实心表面、移动端留白与结果摘要。
 */
import { describe, expect, it } from 'vitest'
import { readProjectFile } from '../helpers/read-project-file'

function source(rel: string): string {
  const content = readProjectFile(rel)
  expect(content, `${rel} should exist`).not.toBeNull()
  return content!
}

describe('AC-SEARCH-002: search layout', () => {
  it('uses one solid grouped surface with mobile padding', () => {
    const search = source('app/routes/search.tsx')
    expect(search).toContain('max-w-[600px]')
    expect(search).toContain('px-3 sm:px-0')
    expect(search).toContain('rounded-2xl border border-border/60 bg-card')
    expect(search).not.toContain('bg-card/60')
  })

  it('shows the loaded count and offers retry / clear actions', () => {
    const search = source('app/routes/search.tsx')
    expect(search).toContain('resultCountLabel')
    expect(search).toContain('重试')
    expect(search).toContain('清空关键词')
  })

  it('renders syntax shortcuts with their own descriptions', () => {
    const search = source('app/routes/search.tsx')
    for (const syntax of [
      'from:',
      'to:',
      '#',
      'lang:',
      'min_faves:',
      'min_retweets:',
      'since:',
      'until:',
    ]) {
      expect(search, `${syntax} shortcut should exist`).toContain(`syntax: '${syntax}'`)
    }
    expect(search).toContain('点击插入语法')
  })

  it('keeps the shared hero text inside the viewport on small screens', () => {
    expect(source('app/components/layout/PageHeader.tsx')).toContain('px-4')
  })

  it('lets the result toolbar wrap on narrow screens', () => {
    expect(source('app/components/search/SearchToolbar.tsx')).toContain('flex-wrap')
  })
})
