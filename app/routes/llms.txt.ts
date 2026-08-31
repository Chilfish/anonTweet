import type { Route } from './+types/llms.txt'
import { buildLlmsTxt } from '~/lib/llms'

/**
 * GET /llms.txt — AI 爬虫/代理友好的站点索引（llmstxt.org 规范）。
 *
 * 纯 markdown：H1 标题 → blockquote 简介 → H2 分区（Key Pages / Backend API /
 * Machine Readable）→ `- [文本](链接): 描述` 子弹列表；链接相对路径，
 * 任意部署域名下可用。后端接口完整定义见 /openapi.json。
 *
 * 规范参考：https://llmstxt.org/
 */
export async function loader(_args: Route.LoaderArgs) {
  return new Response(buildLlmsTxt(), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'X-Robots-Tag': 'all',
    },
  })
}
