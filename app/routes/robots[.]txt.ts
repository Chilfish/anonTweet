import type { Route } from './+types/robots[.]txt'

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url)
  const baseUrl = `${url.protocol}//${url.host}`

  const robots = `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /
Allow: /tweets/
Allow: /list/

Sitemap: ${baseUrl}/sitemap.xml

# Disallow API routes
Disallow: /api/
`

  return new Response(robots, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
