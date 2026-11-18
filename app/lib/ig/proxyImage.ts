/** Instagram CDN 图片域名（需同源代理绕过 CORP / CORS 拦截）。 */
const IG_CDN_RE = /cdninstagram\.com|fbcdn\.net/

/** Instagram CDN 图片 URL → 同源代理 URL；其它 URL 原样返回。 */
export function proxyIGImage(url: string): string {
  if (IG_CDN_RE.test(url))
    return `/api/proxy/image?url=${encodeURIComponent(url)}`
  return url
}
