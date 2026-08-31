/**
 * test/unit/llms.spec.ts
 *
 * llms.txt / openapi.json 构建器单测：
 * - AC-LLMS-001：llms.txt 符合 llmstxt.org 规范形状（H1 → blockquote → H2 分区 →
 *   链接子弹列表，纯 markdown 无 HTML/表格/代码块），覆盖全部后端端点，
 *   且 Data Shapes 小节给出常用接口（搜索/获取推文）出入参形态
 * - AC-LLMS-002：OpenAPI 3.1 结构合法，paths 与端点清单三方奇偶校验
 *   （apiEndpoints ↔ OpenAPI paths ↔ 期望路径列表），关键端点参数/请求体完整，
 *   响应 schema $ref 指向带真实字段定义的 components.schemas
 */
import { describe, expect, it } from 'vitest'
import { apiEndpoints, buildLlmsTxt, buildOpenApiDoc } from '~/lib/llms'

const BASE_URL = 'https://anon-tweet.example.com'

// 复用的规范化检查正则（模块作用域，避免每次调用重新编译）
const LINK_BULLET_RE = /^- \[[^\]]+\]\([^)]+\): /
const HTML_TAG_RE = /<[a-z/]/i

// ── 期望路径清单（与 app/routes.ts 的 api/* 前缀一一对应） ────────────────
const EXPECTED_PATHS = [
  '/api/tweet/get/{id}',
  '/api/tweet/list/{id}',
  '/api/tweet/replies/{id}',
  '/api/tweet/search',
  '/api/tweet/set',
  '/api/ig/get/{id}',
  '/api/ig/translate/{id}',
  '/api/user/get/{username}',
  '/api/user/timeline/{username}',
  '/api/ai-test',
  '/api/ai-translation',
  '/api/ai-vision',
  '/api/proxy/image',
  '/api/bili-post',
] as const

describe('AC-LLMS-001: llms.txt matches llmstxt.org spec shape and covers all endpoints', () => {
  const txt = buildLlmsTxt()
  const lines = txt.split('\n')

  it('starts with H1 title, followed by blockquote description', () => {
    expect(lines[0]).toBe('# Anon Tweet')
    expect(lines[1]).toBe('')
    expect((lines[2] ?? '').startsWith('> ')).toBe(true)
  })

  it('organizes links under H2 sections with bullet link lists', () => {
    expect(txt).toContain('## Key Pages')
    expect(txt).toContain('## Backend API')
    expect(txt).toContain('\n- [/](/): ')

    // 每个含链接的子弹必须是 `- [文本](链接): 描述` 完整格式
    const bulletLines = lines.filter(l => l.trim().startsWith('- '))
    expect(bulletLines.length).toBeGreaterThan(5)
    for (const line of bulletLines) {
      if (line.includes(']('))
        expect(line).toMatch(LINK_BULLET_RE)
    }
  })

  it('is plain markdown: no HTML, no tables, no code fences', () => {
    expect(txt).not.toMatch(HTML_TAG_RE)
    expect(txt.split('\n').some(l => l.includes('|'))).toBe(false)
    expect(txt).not.toContain('```')
  })

  it('uses relative links only (work on any hostname)', () => {
    expect(txt).not.toContain('http://')
    expect(txt).not.toContain('https://')
    // 链接目标必须存在且以 / 开头
    const hrefs = [...txt.matchAll(/\]\(([^)]+)\)/g)]
      .map(m => m[1])
      .filter((h): h is string => typeof h === 'string')
    expect(hrefs.length).toBeGreaterThan(5)
    for (const h of hrefs)
      expect(h.startsWith('/')).toBe(true)
  })

  it('lists every backend endpoint exactly once, plus the openapi.json entry', () => {
    const bulletTexts = [...txt.matchAll(/^- \[([^\]]+)\]/gm)]
      .map(m => m[1])
      .filter((t): t is string => typeof t === 'string')
    const endpointLabels = apiEndpoints.map(e => e.label)

    expect(bulletTexts).toContain('/openapi.json')
    expect(bulletTexts).toContain('/sitemap.xml')
    for (const label of endpointLabels)
      expect(bulletTexts).toContain(label)

    // 端点行应唯一（GET+POST 同路径也算不同 label）
    const unique = new Set(bulletTexts)
    expect(unique.size).toBe(bulletTexts.length)
  })

  it('apiEndpoints hrefs all resolve within the endpoint set', () => {
    for (const e of apiEndpoints)
      expect(e.href.startsWith('/api/')).toBe(true)
  })

  it('data Shapes section describes key response types and search/get inputs', () => {
    expect(txt).toContain('## Data Shapes')
    expect(txt).toContain('EnrichedTweet:')
    expect(txt).toContain('TweetUser:')
    expect(txt).toContain('Entity:')
    expect(txt).toContain('SearchResponse / RepliesResponse:')

    // 关键接口入参：搜索参数与获取推文路径参数
    expect(txt).toContain('GET /api/tweet/search:')
    expect(txt).toContain('GET /api/tweet/get/{id}:')
    expect(txt).toContain('nextCursor')
    expect(txt).toContain('aiTranslation')
  })
})

// 宽松结构：noUncheckedIndexedAccess 下用可选链收窄，避免裸非空断言
interface OperationShape {
  operationId?: string
  summary?: string
  tags?: string[]
  parameters?: { name: string, in: string, required?: boolean }[]
  requestBody?: { content: Record<string, { schema?: Record<string, unknown> }> }
  responses?: Record<string, unknown>
}

describe('AC-LLMS-002: openapi.json is a valid OpenAPI 3.1 doc covering all backend routes', () => {
  const doc = buildOpenApiDoc(BASE_URL) as {
    openapi: string
    info: { title: string, version: string }
    servers: { url: string }[]
    paths: Record<string, Record<string, OperationShape>>
    components: { schemas: Record<string, Record<string, unknown>> }
  }

  it('declares OpenAPI 3.1 + title + servers with the deployed baseUrl', () => {
    expect(doc.openapi.startsWith('3.1.')).toBe(true)
    expect(doc.info.title).toBe('Anon Tweet API')
    expect(doc.servers[0]?.url).toBe(BASE_URL)
  })

  it('paths parity: apiEndpoints ↔ openapi paths ↔ expected list', () => {
    const fromEndpoints = [...new Set(apiEndpoints.map(e => e.path))].sort()
    const fromDoc = Object.keys(doc.paths).sort()
    const expected = [...EXPECTED_PATHS].sort()

    expect(fromEndpoints).toEqual(expected)
    expect(fromDoc).toEqual(expected)
  })

  it('every operation has operationId, summary, a tag, and a responses map', () => {
    for (const ops of Object.values(doc.paths)) {
      expect(Object.keys(ops).length).toBeGreaterThan(0)
      for (const [method, op] of Object.entries(ops)) {
        expect(['get', 'post']).toContain(method)
        expect(op.operationId).toBeTruthy()
        expect(op.summary).toBeTruthy()
        expect(op.tags?.length).toBeGreaterThan(0)
        // OpenAPI 要求响应统一挂在 responses 下
        expect(Object.keys(op.responses ?? {}).length).toBeGreaterThan(0)
      }
    }
  })

  it('documents query params for search / replies / proxy endpoints', () => {
    const paramsOf = (path: string, method: 'get' | 'post') =>
      doc.paths[path]?.[method]?.parameters?.map(p => p.name) ?? []

    expect(paramsOf('/api/tweet/search', 'get')).toEqual(
      expect.arrayContaining(['q', 'type', 'cursor', 'count']),
    )
    expect(paramsOf('/api/tweet/replies/{id}', 'get')).toContain('cursor')
    expect(paramsOf('/api/proxy/image', 'get')).toContain('url')

    // 路径参数 required
    for (const p of doc.paths['/api/tweet/get/{id}']?.get?.parameters ?? [])
      expect(p.required).toBe(true)
  })

  it('documents request bodies for action endpoints', () => {
    const postOp = doc.paths['/api/ai-translation']?.post
    expect(postOp?.requestBody?.content['application/json']?.schema).toBeTruthy()
    expect(doc.paths['/api/tweet/set']?.post?.requestBody?.content['application/json']?.schema).toBeTruthy()
    expect(doc.paths['/api/bili-post']?.post?.requestBody?.content['multipart/form-data']?.schema).toBeTruthy()
  })

  it('marks user timeline as permanently rate-limited (429)', () => {
    const op = doc.paths['/api/user/timeline/{username}']?.get
    expect(op?.responses?.['429']).toBeTruthy()
    expect(op?.responses?.['200']).toBeFalsy()
  })

  describe('response schemas reference concrete component definitions', () => {
    const schemas = doc.components.schemas

    it('core response components exist with real fields', () => {
      const enriched = schemas.EnrichedTweet as { properties?: Record<string, unknown> }
      expect(enriched?.properties).toMatchObject({
        id_str: expect.anything(),
        text: expect.anything(),
        entities: expect.anything(),
        user: expect.anything(),
        url: expect.anything(),
      })

      const igPost = schemas.IGPost as { properties?: Record<string, unknown> }
      expect(igPost?.properties).toMatchObject({
        id: expect.anything(),
        username: expect.anything(),
        description: expect.anything(),
        media: expect.anything(),
      })

      const visual = schemas.AIVisionInfo as { properties?: Record<string, unknown> }
      expect(Object.keys(visual?.properties ?? {})).toEqual(
        expect.arrayContaining(['index', 'mode', 'promptId', 'provider', 'model', 'status', 'createdAt']),
      )

      const rawUser = schemas.RawUser as { properties?: Record<string, unknown> }
      expect(Object.keys(rawUser?.properties ?? {})).toEqual(
        expect.arrayContaining(['id', 'userName', 'fullName', 'profileImage', 'followersCount']),
      )
    })

    it('tweet / ig response arrays $ref into those components', () => {
      const readItems = (path: string, method: 'get' | 'post') => {
        const responses = doc.paths[path]?.[method]?.responses ?? {}
        const schema = (responses['200'] as { content?: Record<string, { schema?: { items?: unknown } }> })
          ?.content?.['application/json']
          ?.schema
        return schema
      }

      expect(readItems('/api/tweet/get/{id}', 'get')).toMatchObject({
        items: { $ref: '#/components/schemas/EnrichedTweet' },
      })
      expect(readItems('/api/tweet/list/{id}', 'get')).toMatchObject({
        items: { $ref: '#/components/schemas/EnrichedTweet' },
      })
      expect(readItems('/api/ig/get/{id}', 'get')).toMatchObject({
        items: { $ref: '#/components/schemas/IGPost' },
      })
    })

    it('user/get response is a nullable RawUser', () => {
      const responses = doc.paths['/api/user/get/{username}']?.get?.responses ?? {}
      const schema = (responses['200'] as { content?: Record<string, { schema?: unknown }> })
        ?.content?.['application/json']
        ?.schema
      expect(schema).toMatchObject({
        oneOf: expect.arrayContaining([
          { $ref: '#/components/schemas/RawUser' },
          { type: 'null' },
        ]),
      })
    })
  })
})
