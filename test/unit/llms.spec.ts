/**
 * test/unit/llms.spec.ts
 *
 * llms.txt / openapi.json 构建器单测：
 * - AC-LLMS-001：llms.txt 符合 llmstxt.org 规范形状（H1 → blockquote → H2 分区 →
 *   链接子弹列表，纯 markdown 无 HTML/表格/代码块），且保持**索引**定位：
 *   体积受限、不内联 schema、只链 GET 可取回资源、不宣传隐藏入口
 * - AC-LLMS-002：OpenAPI 3.1 结构合法，paths 与期望路径清单奇偶校验，
 *   关键端点参数/请求体完整，响应 schema $ref 指向带真实字段定义的
 *   components.schemas；另做版本奇偶校验——`info.version` 单源取自
 *   package.json，随附快照不得漂移
 */
import { describe, expect, it } from 'vitest'
import { buildLlmsTxt, buildOpenApiDoc } from '~/lib/llms'
import pkg from '../../package.json'
import { readProjectFile } from '../helpers/read-project-file'

const BASE_URL = 'https://anon-tweet.example.com'

/** 随本 skill 分发的 OpenAPI 快照（由 /openapi.json 重新生成） */
const OPENAPI_SNAPSHOT_REL = '.agents/skills/anon-tweet/references/anon-tweet-openapi.json'

// 复用的规范化检查正则（模块作用域，避免每次调用重新编译）
const LINK_BULLET_RE = /^- \[[^\]]+\]\([^)]+\): /
const HTML_TAG_RE = /<[a-z/]/i
const SEMVER_RE = /^\d+\.\d+\.\d+/
/** llms.txt 只允许链这些 GET 读取端点（前缀匹配） */
const GET_API_HREF_RE = /^\/api\/(tweet\/(get|search|replies|list)|ig\/get|user\/get|proxy\/image)/

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
    expect(txt).toContain('## Start here')
    expect(txt).toContain('## Optional')
    expect(txt).toContain('\n- [/openapi.json](/openapi.json): ')

    // 每个含链接的子弹必须是 `- [文本](链接): 描述` 完整格式
    const bulletLines = lines.filter(l => l.trim().startsWith('- '))
    expect(bulletLines.length).toBeGreaterThan(5)
    const linkBullets = bulletLines.filter(l => l.includes(']('))
    expect(linkBullets.length).toBeGreaterThan(0)
    for (const line of linkBullets)
      expect(line).toMatch(LINK_BULLET_RE)
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
    const hrefs = [
      ...txt.matchAll(/\]\(([^)]+)\)/g),
    ]
      .map(m => m[1])
      .filter((h): h is string => typeof h === 'string')
    expect(hrefs.length).toBeGreaterThan(5)
    for (const h of hrefs)
      expect(h.startsWith('/')).toBe(true)
  })

  it('links the machine-readable entry points', () => {
    expect(txt).toContain('](/skills/anon-tweet/SKILL.md): ')
  })

  it('links only GET-fetchable resources', () => {
    const hrefs = [
      ...txt.matchAll(/\]\(([^)]+)\)/g),
    ]
      .map(m => m[1])
      .filter((h): h is string => typeof h === 'string')

    // POST-only 端点不能作为链接（agent 跟过去只会拿到 405）
    const writePaths = [
      '/api/tweet/set',
      '/api/ai-test',
      '/api/ai-translation',
      '/api/ai-vision',
      '/api/ig/translate',
      '/api/bili-post',
    ]
    for (const path of writePaths)
      expect(hrefs.some(h => h.startsWith(path))).toBe(false)

    const apiHrefs = hrefs.filter(h => h.startsWith('/api/'))
    expect(apiHrefs.length).toBeGreaterThan(0)
    for (const h of apiHrefs)
      expect(h).toMatch(GET_API_HREF_RE)
  })

  it('stays an index instead of duplicating the OpenAPI schema', () => {
    expect(txt.length).toBeLessThan(3000)
    expect(txt).not.toContain('## Data Shapes')
    expect(txt).not.toContain('EnrichedTweet:')
    expect(txt).not.toContain('- TweetUser:')
  })

  it('does not advertise the hidden /bili entry', () => {
    expect(txt).not.toContain('/bili')
  })

  it('states the calling conventions an agent needs', () => {
    expect(txt).toContain('/api/user/timeline')
    expect(txt).toContain('INS_COOKIES')
    expect(txt).toContain('success')
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

  it('info.version is single-sourced from package.json (no hardcoded literal)', () => {
    expect(pkg.version).toMatch(SEMVER_RE)
    expect(doc.info.version).toBe(pkg.version)
  })

  it('bundled skill OpenAPI snapshot mirrors the generated spec version', () => {
    const raw = readProjectFile(OPENAPI_SNAPSHOT_REL)
    expect(raw).toBeTruthy()

    const snapshot = JSON.parse(raw ?? '{}') as { info?: { version?: string } }
    expect(snapshot.info?.version).toBe(pkg.version)
  })

  it('paths parity: openapi paths ↔ expected list', () => {
    const fromDoc = Object.keys(doc.paths).sort()
    const expected = [...EXPECTED_PATHS].sort()

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

  it('documents user timeline pagination (200 tweets + nextCursor, plus errors)', () => {
    const op = doc.paths['/api/user/timeline/{username}']?.get
    expect(op?.responses?.['200']).toBeTruthy()
    expect(op?.responses?.['429']).toBeTruthy()
    expect(op?.responses?.['500']).toBeTruthy()

    const paramNames = ((op?.parameters ?? []) as Array<{ name?: string }>)
      .map(param => param.name)
    expect(paramNames).toContain('cursor')

    const schema = (op?.responses?.['200'] as { content?: Record<string, { schema?: { type?: string, required?: string[], properties?: Record<string, unknown> } }> })
      ?.content?.['application/json']
      ?.schema
    expect(schema).toMatchObject({
      type: 'object',
      required: ['tweets', 'nextCursor'],
      properties: {
        tweets: {
          type: 'array',
          items: { $ref: '#/components/schemas/EnrichedTweet' },
        },
        nextCursor: {
          type: ['string', 'null'],
        },
      },
    })
  })

  describe('response schemas reference concrete component definitions', () => {
    const schemas = doc.components.schemas

    it('core response components exist with real fields', () => {
      const enriched = schemas.EnrichedTweet as { properties?: Record<string, unknown> }
      expect(enriched?.properties).toMatchObject({
        id: expect.anything(),
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
        expect.arrayContaining([
          'index',
          'mode',
          'promptId',
          'provider',
          'model',
          'status',
          'createdAt',
        ]),
      )

      const rawUser = schemas.RawUser as { properties?: Record<string, unknown> }
      expect(Object.keys(rawUser?.properties ?? {})).toEqual(
        expect.arrayContaining([
          'id',
          'userName',
          'fullName',
          'profileImage',
          'followersCount',
        ]),
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
