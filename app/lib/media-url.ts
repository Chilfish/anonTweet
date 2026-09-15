/**
 * 媒体 URL 归一化（app/lib/media-url.ts）
 *
 * 将 twimg 媒体图片链接从 query 形态 `?name=<size>&format=<ext>`（或
 * `?format=<ext>&name=<size>`）统一为路径形态 `<slug>.<ext>`：
 *
 *   https://pbs.twimg.com/media/HPxZhM0aQAAZxz3?format=jpg&name=small
 *     → https://pbs.twimg.com/media/HPxZhM0aQAAZxz3.jpg
 *
 * 例外：`/card_img/<id>/<slug>`（链接卡片图）不支持路径形态 ——
 * `/card_img/2096230549069438976/ZRBr6uOS.jpg` 会 404，只有
 * `?format=<ext>&name=<size>` 的 query 形态可达。故该路径保留 query，
 * 缺失时补默认 `format=jpg&name=large`。
 *
 * 已带扩展名的 URL（如官方原始图 `.../HPxZhM0aQAAZxz3.jpg`）原样保留，仅清理
 * `format` / `name` 两个查询参数。所有媒体链接消费方（getMediaUrl / buildMediaUrl /
 * 卡片渲染 / Markdown 导出）共用本函数，避免第六套媒体 URL 逻辑（Postmortem #005）。
 */

const IMAGE_EXT_RE = /\.(?:jpe?g|png|webp|gif|avif|heic|heif)$/i
const CARD_IMG_PATH_RE = /^\/card_img\//

export function normalizeMediaUrl(raw: string): string {
  if (!raw)
    return raw
  try {
    const url = new URL(raw)
    // card_img 只能走 query 形态：把 format 并入路径会 404，故保留 query 并补默认值
    if (CARD_IMG_PATH_RE.test(url.pathname)) {
      if (!url.searchParams.has('format'))
        url.searchParams.set('format', 'jpg')
      if (!url.searchParams.has('name'))
        url.searchParams.set('name', 'large')
      return url.toString()
    }
    // 路径已带图片扩展名 → 保留；否则把 format 查询参数并入路径
    if (!IMAGE_EXT_RE.test(url.pathname)) {
      const format = url.searchParams.get('format')
      if (format)
        url.pathname = `${url.pathname}.${format}`
    }
    url.searchParams.delete('format')
    url.searchParams.delete('name')
    return url.toString()
  }
  catch {
    return raw
  }
}
