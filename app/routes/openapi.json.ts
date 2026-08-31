import type { Route } from './+types/openapi.json'
import { buildOpenApiDoc } from '~/lib/llms'

/**
 * GET /openapi.json — 后端 BFF 接口的 OpenAPI 3.1 全量规范。
 *
 * 覆盖 app/routes.ts 中 `api/*` 前缀下的全部接口（tweet / ig / user / ai /
 * proxy / bili），servers 注入当前部署域名。供 /llms.txt 与 AI 工具消费。
 */
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url)
  const baseUrl = `${url.protocol}//${url.host}`

  return new Response(JSON.stringify(buildOpenApiDoc(baseUrl), null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'X-Robots-Tag': 'all',
    },
  })
}
