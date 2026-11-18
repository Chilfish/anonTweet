import type { Route } from './+types/robots.txt'

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url)
  const baseUrl = `${url.protocol}//${url.host}`

  const robots = `# https://www.robotstxt.org/robotstxt.html
# 动态详情页虽可抓取，但页面自带 noindex, follow（见 app/lib/seo.ts）
User-agent: *
Allow: /
Allow: /tweets/
Allow: /list/
Allow: /ins/
Allow: /article/
Allow: /search
# 截图路由与自用入口不参与收录
Disallow: /plain-tweet/
Disallow: /plain-ins/
Disallow: /bili
# 只读接口与 llms.txt / openapi.json 对 agent 开放（更具体的 Allow 优先于 Disallow）
Allow: /api/tweet/get/
Allow: /api/tweet/list/
Allow: /api/tweet/replies/
Allow: /api/tweet/search
Allow: /api/user/get/
Allow: /api/ig/get/
Allow: /api/proxy/image
Allow: /llms.txt
Allow: /openapi.json
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml
`

  return new Response(robots, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
