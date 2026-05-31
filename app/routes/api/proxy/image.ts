import type { Route } from './+types/image'

const IMAGE_EXT_RE = /^https?:\/\/.+\.(?:jpg|jpeg|png|webp|gif|avif|heic|heif)/i

/**
 * 通用图片代理接口。
 *
 * 解决 Instagram CDN 的 CORS / CORP 拦截问题。
 * 服务端 fetch 图片后以同源响应返回，附带缓存头。
 *
 * GET /api/proxy/image?url=https://scontent.cdninstagram.com/...
 */
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url).searchParams.get('url')

  if (!url) {
    return new Response('Missing "url" query parameter', { status: 400 })
  }

  // 安全：只允许代理图片 URL（后缀白名单 或 IG/FB 域名）
  if (!IMAGE_EXT_RE.test(url) && !url.includes('cdninstagram.com') && !url.includes('fbcdn.net')) {
    return new Response('Invalid or disallowed URL', { status: 403 })
  }

  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.instagram.com/',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
    })

    if (!resp.ok) {
      return new Response(`Upstream fetch failed: ${resp.status}`, { status: resp.status })
    }

    const contentType = resp.headers.get('Content-Type') || 'image/jpeg'
    const body = await resp.arrayBuffer()

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': body.byteLength.toString(),
        'Cache-Control': 'public, max-age=86400, s-maxage=3600',
        'Access-Control-Allow-Origin': '*',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      },
    })
  }
  catch (error: any) {
    console.error('[Proxy] Failed:', error.message)
    return new Response(`Proxy error: ${error.message}`, { status: 502 })
  }
}
