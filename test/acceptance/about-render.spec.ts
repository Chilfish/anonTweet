/**
 * test/acceptance/about-render.spec.ts
 *
 * AC-ABOUT-001：关于页承载构建信息、数据边界与机器可读入口。
 */
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import About from '~/routes/about'
import pkg from '../../package.json'

describe('AC-ABOUT-001: about page', () => {
  it('shows build info, GitHub links, data boundary and machine-readable endpoints', () => {
    const html = renderToString(createElement(About, {
      loaderData: { version: pkg.version },
    } as never))

    expect(html).toContain('关于 Anon Tweet')
    expect(html).toContain(pkg.version)
    expect(html).toContain('github.com/Chilfish/anonTweet')
    expect(html).toContain('IndexedDB')
    expect(html).toContain('localStorage')
    expect(html).toContain('/llms.txt')
    expect(html).toContain('/openapi.json')
    expect(html).toContain('/skills/anon-tweet/SKILL.md')
  })
})
