/**
 * 媒体 URL 归一化（app/lib/media-url.ts）
 *
 * 将 twimg 媒体图片链接从 query 形态 `?name=<size>&format=<ext>`（或
 * `?format=<ext>&name=<size>`）统一为路径形态 `<slug>.<ext>`：
 *
 *   https://pbs.twimg.com/media/HPxZhM0aQAAZxz3?format=jpg&name=small
 *     → https://pbs.twimg.com/media/HPxZhM0aQAAZxz3.jpg
 *
 * 已带扩展名的 URL（如官方原始图 `.../HPxZhM0aQAAZxz3.jpg`）原样保留，仅清理
 * `format` / `name` 两个查询参数。所有媒体链接消费方（getMediaUrl / buildMediaUrl /
 * 卡片渲染 / Markdown 导出）共用本函数，避免第六套媒体 URL 逻辑（Postmortem #005）。
 */

const IMAGE_EXT_RE = /\.(?:jpe?g|png|webp|gif|avif|heic|heif)$/i

export function normalizeMediaUrl(raw: string): string {
  if (!raw)
    return raw
  try {
    const url = new URL(raw)
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
