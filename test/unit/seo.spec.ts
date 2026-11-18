/**
 * test/unit/seo.spec.ts
 *
 * SEO 元信息单源与页面分级单测：
 * - AC-SEO-001：`buildMeta()` 每键只输出一次（title / description / robots / OG /
 *   Twitter Card / canonical），避免线上出现两个 `<title>` 把路由标题压掉
 * - AC-SEO-002：可索引页输出绝对 canonical 与 og:url；noindex 页输出
 *   `noindex, follow` 且不输出 canonical
 * - AC-SEO-003：动态详情页（推文 / IG / List / 长文 / 搜索 / 截图 / 自用）全部
 *   noindex，且 sitemap / robots 与页面策略一致
 */
import { describe, expect, it } from 'vitest'
import { buildMeta, clampDescription, ogLocale, SITE } from '~/lib/seo'
import { loader as robotsLoader } from '~/routes/robots.txt'
import { loader as sitemapLoader } from '~/routes/sitemap.xml'
import { readProjectFile } from '../helpers/read-project-file'

const BASE = 'https://anon-tweet.example.com'

type Tag = Record<string, string>

const tagsOf = (meta: unknown): Tag[] => meta as Tag[]

function findBy(tags: Tag[], key: string, value: string): Tag | undefined {
  return tags.find(t => t[key] === value)
}

describe('AC-SEO-001: buildMeta outputs each tag exactly once', () => {
  const tags = tagsOf(buildMeta({
    title: '测试标题',
    description: '测试描述',
    canonicalPath: '/',
    baseUrl: BASE,
  }))

  it('renders exactly one <title> and one description', () => {
    expect(tags.filter(t => 'title' in t)).toHaveLength(1)
    expect(tags.filter(t => t.name === 'description')).toHaveLength(1)
  })

  it('renders exactly one robots / og:title / og:image / twitter:card', () => {
    expect(tags.filter(t => t.name === 'robots')).toHaveLength(1)
    expect(tags.filter(t => t.property === 'og:title')).toHaveLength(1)
    expect(tags.filter(t => t.property === 'og:image')).toHaveLength(1)
    expect(tags.filter(t => t.name === 'twitter:card')).toHaveLength(1)
  })

  it('uses the passed title/description instead of the site defaults', () => {
    expect(tags.find(t => 'title' in t)?.title).toBe('测试标题')
    expect(findBy(tags, 'name', 'description')?.content).toBe('测试描述')
  })

  it('root-level defaults stay site-level and indexable', () => {
    const defaults = tagsOf(buildMeta())
    expect(defaults.find(t => 'title' in t)?.title).toBe(SITE.title)
    expect(findBy(defaults, 'name', 'robots')?.content).toBe('index, follow')
    expect(findBy(defaults, 'rel', 'canonical')).toBeUndefined()
    expect(findBy(defaults, 'property', 'og:url')).toBeUndefined()
  })
})

describe('AC-SEO-002: canonical and noindex semantics', () => {
  it('builds absolute canonical + og:url from baseUrl', () => {
    const tags = tagsOf(buildMeta({ canonicalPath: '/about', baseUrl: BASE }))
    const canonical = findBy(tags, 'rel', 'canonical')
    expect(canonical).toMatchObject({ tagName: 'link', href: `${BASE}/about` })
    expect(findBy(tags, 'property', 'og:url')?.content).toBe(`${BASE}/about`)
  })

  it('noindex pages emit noindex, follow and drop canonical', () => {
    const tags = tagsOf(buildMeta({
      title: '动态页',
      canonicalPath: '/tweets/1',
      baseUrl: BASE,
      noindex: true,
    }))
    expect(findBy(tags, 'name', 'robots')?.content).toBe('noindex, follow')
    expect(findBy(tags, 'rel', 'canonical')).toBeUndefined()
    expect(findBy(tags, 'property', 'og:url')).toBeUndefined()
  })

  it('image: null degrades to a summary card without og:image', () => {
    const tags = tagsOf(buildMeta({ image: null }))
    expect(findBy(tags, 'name', 'twitter:card')?.content).toBe('summary')
    expect(findBy(tags, 'property', 'og:image')).toBeUndefined()
  })

  it('clamps long descriptions and maps content languages to og:locale', () => {
    expect(clampDescription('a'.repeat(300))).toHaveLength(160)
    expect(clampDescription('  短  文本\n换行 ')).toBe('短 文本 换行')
    expect(ogLocale('zh')).toBe('zh_CN')
    expect(ogLocale('ja')).toBe('ja_JP')
    expect(ogLocale('en')).toBe('en_US')
    expect(ogLocale(undefined)).toBe('en_US')
  })
})

describe('AC-SEO-003: dynamic pages are noindex and sitemap/robots agree', () => {
  const NOINDEX_ROUTES = [
    'app/routes/tweet.tsx',
    'app/routes/article.tsx',
    'app/routes/ins.tsx',
    'app/routes/list.tsx',
    'app/routes/user.tsx',
    'app/routes/search.tsx',
    'app/routes/plain.tsx',
    'app/routes/plain-ig.tsx',
    'app/routes/bili.tsx',
    'app/routes/not-found.tsx',
  ]

  it.each(NOINDEX_ROUTES)('%s declares noindex', (rel) => {
    const source = readProjectFile(rel)
    expect(source).toBeTruthy()
    expect(source).toContain('noindex: true')
  })

  it('sitemap only lists indexable static pages', async () => {
    const response = await sitemapLoader({
      request: new Request(`${BASE}/sitemap.xml`),
    } as Parameters<typeof sitemapLoader>[0])
    const xml = await response.text()

    expect(xml).toContain(`<loc>${BASE}/</loc>`)
    expect(xml).toContain(`<loc>${BASE}/about</loc>`)
    for (const path of [
      '/tweets',
      '/ins',
      '/list',
      '/article',
      '/search',
      '/plain-tweet',
    ])
      expect(xml).not.toContain(`<loc>${BASE}${path}`)
  })

  it('robots.txt blocks screenshot and hidden routes', async () => {
    const response = await robotsLoader({
      request: new Request(`${BASE}/robots.txt`),
    } as Parameters<typeof robotsLoader>[0])
    const txt = await response.text()

    expect(txt).toContain('Disallow: /plain-tweet/')
    expect(txt).toContain('Disallow: /plain-ins/')
    expect(txt).toContain('Disallow: /bili')
    expect(txt).toContain(`Sitemap: ${BASE}/sitemap.xml`)
  })
})
