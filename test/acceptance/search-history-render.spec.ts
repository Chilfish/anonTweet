/**
 * test/acceptance/search-history-render.spec.ts
 *
 * AC-SEARCH-001：最近搜索渲染为可点选按钮，空列表不占位。
 */
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { RecentSearches } from '~/components/search/RecentSearches'

describe('AC-SEARCH-001: recent searches render', () => {
  it('renders one clickable chip per query with a clear action', () => {
    const html = renderToString(createElement(RecentSearches, {
      queries: ['cat', 'from:GeminiApp'],
      onSelect: () => {},
      onClear: () => {},
    }))

    expect(html).toContain('最近搜索')
    expect(html).toContain('cat')
    expect(html).toContain('from:GeminiApp')
    expect(html).toContain('清除')
    expect(html).toContain('<button')
  })

  it('renders nothing without history', () => {
    const html = renderToString(createElement(RecentSearches, {
      queries: [],
      onSelect: () => {},
      onClear: () => {},
    }))
    expect(html).toBe('')
  })
})
