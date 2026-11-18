import type { Route } from './+types/sitemap.xml'

/**
 * 只收录**可索引**的静态页（策略见 `docs/planning/seo-strategy.md`）。
 * 动态详情页（推文 / IG / List / 长文）与搜索结果均为 `noindex, follow`，
 * 不放进来——sitemap 与页面 robots 必须一致，否则只会让 Search Console 报噪音。
 */
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url)
  const baseUrl = `${url.protocol}//${url.host}`

  const pages = [
    { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'weekly' },
    { loc: `${baseUrl}/about`, priority: '0.6', changefreq: 'monthly' },
  ]

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(p => `  <url>
    <loc>${p.loc}</loc>
    <priority>${p.priority}</priority>
    <changefreq>${p.changefreq}</changefreq>
  </url>`).join('\n')}
</urlset>`

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
