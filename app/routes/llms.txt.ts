import type { Route } from './+types/llms.txt'
import { buildLlmsTxt } from '~/lib/llms'

/**
 * GET /llms.txt — AI 爬虫/代理友好的站点索引（llmstxt.org 规范）。
 *
 * 纯 markdown：H1 标题 → blockquote 简介 → 调用约定 → H2 分区
 * （Start here / Live examples / Optional）→ `- [文本](链接): 描述` 子弹列表；
 * 链接为相对路径，任意部署域名下可用。
 *
 * 只做索引：不内联 schema，不链 POST-only 端点，不宣传隐藏入口。
 * 字段级定义见 /openapi.json，任务级示例见 /skills/anon-tweet/SKILL.md。
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
