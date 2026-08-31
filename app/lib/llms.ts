/**
 * app/lib/llms.ts
 *
 * llms.txt + OpenAPI 3.1 文档构建器（LLM 友好的站点 / API 描述）。
 *
 * - `buildLlmsTxt()` → llms.txt markdown（llmstxt.org 规范：H1 标题 → blockquote
 *   简介 → `## ` 分区 → `- [文本](链接): 描述` 子弹列表；纯 markdown，无
 *   HTML/表格/代码块；链接统一相对路径，任意域名下可用）。除链接索引外，
 *   补充「Data Shapes」小节，直接给出最常被关心的接口（搜索 / 获取推文）
 *   出入参形态（EnrichedTweet 字段等）。
 * - `buildOpenApiDoc(baseUrl)` → OpenAPI 3.1 JSON，覆盖 `app/routes.ts` 中
 *   `api/*` 前缀下的全部后端接口（路径/参数/请求体/响应描述），响应 schema
 *   $ref 到带真实字段定义的 `components.schemas`。
 *
 * 规范参考：https://llmstxt.org/（/llms.txt 与可选 /llms-full.txt）。
 *
 * ⚠️ 端点清单变更时（新增/删除/改路径）必须同步更新 `apiEndpoints` 与
 * `buildOpenApiDoc` 的 paths——`test/unit/llms.spec.ts`（AC-LLMS-002）会做
 * 「OpenAPI 路径 ↔ 端点清单 ↔ 期望列表」三方奇偶校验兜底。
 */

/** llms.txt / OpenAPI 使用的示例值（优先取仓库 fixture 里真实存在的 id） */
export const LLMS_EXAMPLES = {
  /** 推文 id（test/fixtures/tweets/normal-ja.json） */
  tweetId: '2032649981690261684',
  /** List id（示例值） */
  listId: '1460328522022621184',
  /** Instagram shortcode（test/fixtures/ig-posts/post-with-media.json） */
  igShortcode: 'DWlrun0AVbE',
  /** Instagram 用户名（fixture 示例） */
  username: 'meeeei.gt',
} as const

/** 单个后端接口的 llms.txt 描述条目 */
export interface ApiEndpointLink {
  method: 'GET' | 'POST'
  /** OpenAPI 路径模板（如 /api/tweet/get/{id}） */
  path: string
  /** llms.txt 链接文本（method + 路径模板） */
  label: string
  /** 相对链接（填入示例值，AI 可直接拉取） */
  href: string
  /** 接口描述 */
  description: string
}

/**
 * 后端 API 端点清单（与 app/routes.ts 的 `...prefix('api', [...])` 一一对应，
 * 共 16 条路径）。
 */
export const apiEndpoints: ApiEndpointLink[] = [
  // ── Tweet ──────────────────────────────────────────────
  { method: 'GET', path: '/api/tweet/get/{id}', label: 'GET /api/tweet/get/{id}', href: `/api/tweet/get/${LLMS_EXAMPLES.tweetId}`, description: '拉取单条推文（DB 缓存 → Twitter 原文）' },
  { method: 'POST', path: '/api/tweet/get/{id}', label: 'POST /api/tweet/get/{id}', href: `/api/tweet/get/${LLMS_EXAMPLES.tweetId}`, description: '旧式拉取推文（兼容旧客户端，内部不再内联 AI 翻译）' },
  { method: 'GET', path: '/api/tweet/list/{id}', label: 'GET /api/tweet/list/{id}', href: `/api/tweet/list/${LLMS_EXAMPLES.listId}`, description: '拉取 List 时间线推文（EnrichedTweet 数组）' },
  { method: 'GET', path: '/api/tweet/replies/{id}', label: 'GET /api/tweet/replies/{id}', href: `/api/tweet/replies/${LLMS_EXAMPLES.tweetId}`, description: '拉取推文回复（{ tweets, nextCursor }，cursor 分页）' },
  { method: 'GET', path: '/api/tweet/search', label: 'GET /api/tweet/search', href: '/api/tweet/search?q=twitter', description: '推文搜索（q 必填，type/cursor/count 可选，支持 X 高级语法）' },
  { method: 'POST', path: '/api/tweet/set', label: 'POST /api/tweet/set', href: '/api/tweet/set', description: '保存推文实体编辑（intent: updateEntities，同步 localCache）' },
  // ── Instagram ──────────────────────────────────────────
  { method: 'GET', path: '/api/ig/get/{id}', label: 'GET /api/ig/get/{id}', href: `/api/ig/get/${LLMS_EXAMPLES.igShortcode}`, description: '拉取 IG 帖子（简化版，不触发 AI 翻译）' },
  { method: 'POST', path: '/api/ig/get/{id}', label: 'POST /api/ig/get/{id}', href: `/api/ig/get/${LLMS_EXAMPLES.igShortcode}`, description: '拉取 IG 帖子（可启用 AI caption 翻译）' },
  { method: 'POST', path: '/api/ig/translate/{id}', label: 'POST /api/ig/translate/{id}', href: `/api/ig/translate/${LLMS_EXAMPLES.igShortcode}`, description: 'IG caption AI 翻译或手动翻译（manualTranslation 直接写入）' },
  // ── User ───────────────────────────────────────────────
  { method: 'GET', path: '/api/user/get/{username}', label: 'GET /api/user/get/{username}', href: `/api/user/get/${LLMS_EXAMPLES.username}`, description: '查询用户资料（DB 缓存）' },
  { method: 'GET', path: '/api/user/timeline/{username}', label: 'GET /api/user/timeline/{username}', href: `/api/user/timeline/${LLMS_EXAMPLES.username}`, description: '用户时间线（当前固定 429 限流，建议自部署实例 + 自己的 Key）' },
  // ── AI ─────────────────────────────────────────────────
  { method: 'POST', path: '/api/ai-test', label: 'POST /api/ai-test', href: '/api/ai-test', description: 'AI 提供商连通性测试（apiKey + model）' },
  { method: 'POST', path: '/api/ai-translation', label: 'POST /api/ai-translation', href: '/api/ai-translation', description: '统一 AI 翻译端点（type: twitter 或 ins）' },
  { method: 'POST', path: '/api/ai-vision', label: 'POST /api/ai-vision', href: '/api/ai-vision', description: 'AI 视觉描述生成 / OCR 翻译 / 保存（三种严格互斥请求形态）' },
  // ── Proxy / Misc ───────────────────────────────────────
  { method: 'GET', path: '/api/proxy/image', label: 'GET /api/proxy/image', href: '/api/proxy/image?url=https%3A%2F%2Fscontent.cdninstagram.com%2Fv%2Ft51.2885-15%2Fphoto.jpg', description: '图片代理（解决 IG CDN CORS/CORP，url 白名单校验）' },
  { method: 'POST', path: '/api/bili-post', label: 'POST /api/bili-post', href: '/api/bili-post', description: 'Bili 动态发布（隐藏自用入口，ENABLE_BILI 控制，需 Bili Cookie）' },
]

/** llms.txt markdown 构建（相对链接，任意部署域名可用） */
export function buildLlmsTxt(): string {
  const apiBullets = apiEndpoints
    .map(e => `- [${e.label}](${e.href}): ${e.description}`)
    .join('\n')

  return `# Anon Tweet

> Anon Tweet 是一个匿名浏览 Twitter/X 推文与 Instagram 帖子的全栈应用，内置 AI 翻译（Google Gemini / DeepSeek）、截图导出与 Markdown 卡片导出。主要页面使用 HTML；后端为 /api/* 的 BFF 聚合接口，完整机器可读 API 规范见 /openapi.json。

## Key Pages

- [/](/): 首页 — 粘贴 Twitter/X 或 Instagram 链接开始匿名浏览
- [/search](/search): 推文搜索 — 高级语法快捷插入 + 热门/最新切换 + 分页加载
- [/tweets/{id}](/tweets/${LLMS_EXAMPLES.tweetId}): 推文详情（AI 翻译 / 截图导出）
- [/ins/{id}](/ins/${LLMS_EXAMPLES.igShortcode}): Instagram 帖子详情（AI 翻译 / 截图导出）
- [/bili](/bili): Bili 动态发布（隐藏自用入口）

## Backend API

- [/openapi.json](/openapi.json): OpenAPI 3.1 规范 — 全部后端接口的路径、参数、请求与响应描述

${apiBullets}

## Data Shapes

后端主要接口（搜索 / 获取推文）的出参是 EnrichedTweet 数组，字段对齐 react-tweet：

- EnrichedTweet: id_str（推文 ID）、text（推文文本）、url（完整链接）、lang（语言码）、created_at（ISO 8601 创建时间）、user（作者 TweetUser）、entities（实体 Entity[]）、visionInfo（可选，AI 视觉描述）、quotedTweet（可选，引用推文）、card（可选，预览卡片）
- TweetUser: id_str、name、screen_name、profile_image_url_https（头像）、verified、is_blue_verified
- Entity: type（text / hashtag / mention / url / media / symbol / media_alt / separator）、text、index（文本偏移）、href（多数类型带链接）、translation（手动翻译）、aiTranslation（AI 翻译）
- SearchResponse / RepliesResponse: { tweets: EnrichedTweet[], nextCursor }（nextCursor 为 string 或 null，null 表示没有更多）

关键接口入参：

- GET /api/tweet/search: 必填 q（≤500 字符，支持 X 高级语法，如 (from:user) since:2025-01-01），可选 type=latest/top、cursor（分页游标）、count（默认 20）
- GET /api/tweet/get/{id}: 路径参数 id 为推文 ID（如 ${LLMS_EXAMPLES.tweetId}），返回 EnrichedTweet 数组，AI 翻译存于 entities[].aiTranslation
- GET /api/tweet/replies/{id}: 可选 cursor 翻页，返回 { tweets, nextCursor }
- GET /api/ig/get/{id}: 路径参数 id 为 shortcode（或 username/story_id），未配置 INS_COOKIES 时返回空数组

## Machine Readable

- [/sitemap.xml](/sitemap.xml): XML 站点地图
- [/robots.txt](/robots.txt): 爬虫规则（Disallow /api/，llms.txt 与 openapi.json 不受限）
`
}

/** OpenAPI 3.1 文档构建（servers 注入当前部署域名） */
export function buildOpenApiDoc(baseUrl: string): Record<string, unknown> {
  // 200 JSON 响应体（供各操作 responses 复用）
  const jsonOk = (description: string, schema: Record<string, unknown>) => ({
    description,
    content: { 'application/json': { schema } },
  })

  const errorRef = { $ref: '#/components/schemas/ErrorResponse' }
  const errorJson = (description: string) => ({
    description,
    content: { 'application/json': { schema: errorRef } },
  })

  const pathParam = (name: string, description: string) => ({
    name,
    in: 'path',
    required: true,
    description,
    schema: { type: 'string' },
  })

  return {
    openapi: '3.1.0',
    info: {
      title: 'Anon Tweet API',
      description: 'Anon Tweet 后端 BFF 聚合接口：Twitter/X 推文、Instagram 帖子、AI 翻译（Google Gemini / DeepSeek）、AI 视觉与截图导出缓存。人类可读说明见站点根 /llms.txt。',
      version: '1.0.0',
    },
    servers: [
      { url: baseUrl, description: '当前部署实例' },
    ],
    tags: [
      { name: 'Tweet', description: 'Twitter/X 推文与 List' },
      { name: 'Instagram', description: 'Instagram 帖子与翻译' },
      { name: 'User', description: '用户查询' },
      { name: 'AI', description: 'AI 翻译 / 视觉 / 连通性测试' },
      { name: 'Proxy', description: '图片代理' },
      { name: 'Bili', description: 'Bili 动态发布（隐藏自用）' },
    ],
    paths: {
      // ── Tweet ────────────────────────────────────────────
      '/api/tweet/get/{id}': {
        get: {
          tags: ['Tweet'],
          operationId: 'tweetGet',
          summary: '拉取单条推文',
          description: '三层缓存（Memory → FS → DB → Twitter API）拉取推文并 enrich；不再内联 AI 翻译（AC-DECOUPLE-001）。',
          parameters: [pathParam('id', '推文 ID')],
          responses: {
            200: jsonOk('EnrichedTweet 数组（与 react-tweet 结构对齐）', {
              type: 'array',
              description: '推文数据（可能为空数组）',
              items: { $ref: '#/components/schemas/EnrichedTweet' },
            }),
            404: errorJson('推文未找到'),
            500: errorJson('上游/解析错误'),
          },
        },
        post: {
          tags: ['Tweet'],
          operationId: 'tweetGetAction',
          summary: '旧式拉取推文（兼容旧客户端）',
          description: '与 GET 同链路；请求体 AI 字段为旧客户端兼容保留，路由不再读取。',
          parameters: [pathParam('id', '推文 ID')],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['tweetId'],
                  properties: {
                    tweetId: { type: 'string', description: '推文 ID' },
                    enableAITranslation: { type: 'boolean', description: '兼容字段，不再读取' },
                    apiKey: { type: 'string', description: '兼容字段，不再读取' },
                    model: { type: 'string', description: '兼容字段，不再读取' },
                    provider: { type: 'string', enum: ['google', 'deepseek', 'openrouter'], description: '兼容字段，不再读取' },
                    baseUrl: { type: 'string', description: '兼容字段，不再读取' },
                    thinkingLevel: { type: 'string', enum: ['minimal', 'low', 'medium', 'high', 'max'], description: '兼容字段，不再读取' },
                    translationGlossary: { type: 'string', description: '兼容字段，不再读取' },
                    force: { type: 'boolean', description: '兼容字段，不再读取' },
                  },
                },
              },
            },
          },
          responses: {
            200: jsonOk('同 GET', {
              type: 'array',
              items: { $ref: '#/components/schemas/EnrichedTweet' },
            }),
            400: errorJson('参数校验失败（zod flatten）'),
            404: errorJson('推文未找到'),
          },
        },
      },
      '/api/tweet/list/{id}': {
        get: {
          tags: ['Tweet'],
          operationId: 'tweetList',
          summary: '拉取 List 时间线',
          parameters: [pathParam('id', 'List ID')],
          responses: {
            200: jsonOk('EnrichedTweet 数组', {
              type: 'array',
              items: { $ref: '#/components/schemas/EnrichedTweet' },
            }),
            500: errorJson('上游/解析错误'),
          },
        },
      },
      '/api/tweet/replies/{id}': {
        get: {
          tags: ['Tweet'],
          operationId: 'tweetReplies',
          summary: '拉取推文回复',
          parameters: [
            pathParam('id', '推文 ID'),
            { name: 'cursor', in: 'query', required: false, description: '分页游标（base62）', schema: { type: 'string' } },
          ],
          responses: {
            200: jsonOk('回复列表 + 下一页游标', { $ref: '#/components/schemas/RepliesResponse' }),
            500: errorJson('上游/解析错误'),
          },
        },
      },
      '/api/tweet/search': {
        get: {
          tags: ['Tweet'],
          operationId: 'tweetSearch',
          summary: '推文搜索',
          description: 'X 高级搜索语法直接可用（如 (from:user) until:2025-12-20）；q 缺省或超长返回 400 + 空结果。',
          parameters: [
            { name: 'q', in: 'query', required: true, description: '搜索关键词（≤500 字符）', schema: { type: 'string', maxLength: 500 } },
            { name: 'type', in: 'query', required: false, description: '排序方式', schema: { type: 'string', enum: ['latest', 'top'], default: 'latest' } },
            { name: 'cursor', in: 'query', required: false, description: '分页游标', schema: { type: 'string' } },
            { name: 'count', in: 'query', required: false, description: '每页数量', schema: { type: 'integer', default: 20 } },
          ],
          responses: {
            200: jsonOk('搜索推文列表 + 下一页游标', { $ref: '#/components/schemas/SearchResponse' }),
            400: errorJson('缺少/非法 q'),
            500: errorJson('搜索失败'),
          },
        },
      },
      '/api/tweet/set': {
        post: {
          tags: ['Tweet'],
          operationId: 'tweetSet',
          summary: '保存推文实体编辑',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['intent', 'data'],
                  properties: {
                    intent: { type: 'string', const: 'updateEntities' },
                    data: {
                      type: 'array',
                      description: '每项包含 tweetId 与 entities（TranslationEntity[]）',
                      items: {
                        type: 'object',
                        required: ['tweetId', 'entities'],
                        properties: {
                          tweetId: { type: 'string' },
                          entities: { type: 'array', items: { $ref: '#/components/schemas/TranslationEntity' } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: jsonOk('保存结果', {
              type: 'object',
              properties: { success: { type: 'boolean' }, message: { type: 'string' } },
            }),
            400: errorJson('校验失败'),
          },
        },
      },
      // ── Instagram ────────────────────────────────────────
      '/api/ig/get/{id}': {
        get: {
          tags: ['Instagram'],
          operationId: 'igGet',
          summary: '拉取 IG 帖子（简化版）',
          description: 'SDK 抓取并标准化为 IGPost；不触发 AI 翻译。未配置 INS_COOKIES 时返回空数组。',
          parameters: [pathParam('id', 'shortcode 或 stories 段（username/story_id）')],
          responses: {
            200: jsonOk('IGPost 数组（可能为空）', {
              type: 'array',
              items: { $ref: '#/components/schemas/IGPost' },
            }),
            500: errorJson('抓取失败'),
          },
        },
        post: {
          tags: ['Instagram'],
          operationId: 'igGetAction',
          summary: '拉取 IG 帖子（可启用 AI 翻译）',
          parameters: [pathParam('id', 'shortcode 或 stories 段（username/story_id）')],
          requestBody: {
            required: false,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    enableAITranslation: { type: 'boolean', default: false },
                    apiKey: { type: 'string', description: '启用翻译时必填' },
                    model: { type: 'string', description: '启用翻译时必填' },
                    provider: { type: 'string', enum: ['google', 'deepseek', 'openrouter'], default: 'google' },
                    thinkingLevel: { type: 'string', enum: ['minimal', 'low', 'medium', 'high', 'max'] },
                    translationGlossary: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: jsonOk('IGPost 数组（可能为空）', {
              type: 'array',
              items: { $ref: '#/components/schemas/IGPost' },
            }),
            400: errorJson('缺少 id'),
            404: errorJson('解析失败'),
            500: errorJson('INS_COOKIES 未配置 / 抓取失败'),
          },
        },
      },
      '/api/ig/translate/{id}': {
        post: {
          tags: ['Instagram'],
          operationId: 'igTranslate',
          summary: 'IG caption AI / 手动翻译',
          description: 'manualTranslation 直接写入跳过 AI；否则需 apiKey + model。结果写回 DB + localCache。',
          parameters: [pathParam('id', 'IG shortcode')],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    apiKey: { type: 'string' },
                    model: { type: 'string' },
                    provider: { type: 'string', enum: ['google', 'deepseek', 'openrouter'], default: 'google' },
                    thinkingLevel: { type: 'string', enum: ['minimal', 'low', 'medium', 'high', 'max'] },
                    translationGlossary: { type: 'string' },
                    manualTranslation: { type: 'string', description: '手动翻译文本，提供则跳过 AI' },
                  },
                },
              },
            },
          },
          responses: {
            200: jsonOk('翻译结果', {
              type: 'object',
              properties: { captionTranslation: { type: 'string' } },
            }),
            400: errorJson('缺少 API Key/Model 或非法 JSON'),
            404: errorJson('帖子未找到或无 caption'),
            500: errorJson('翻译失败'),
          },
        },
      },
      // ── User ─────────────────────────────────────────────
      '/api/user/get/{username}': {
        get: {
          tags: ['User'],
          operationId: 'userGet',
          summary: '查询用户资料',
          description: '从 DB 缓存读取用户；无记录返回 null。',
          parameters: [pathParam('username', '用户名（screen_name）')],
          responses: {
            200: jsonOk('RawUser 或 null', {
              oneOf: [
                { $ref: '#/components/schemas/RawUser' },
                { type: 'null' },
              ],
            }),
          },
        },
      },
      '/api/user/timeline/{username}': {
        get: {
          tags: ['User'],
          operationId: 'userTimeline',
          summary: '用户时间线（当前禁用）',
          description: '固定返回 429：防止对上游接口的滥用；建议使用自部署实例与自己的 Key（https://github.com/Chilfish/anonTweet）。',
          parameters: [pathParam('username', '用户名')],
          responses: {
            429: errorJson('限流（固定返回）'),
          },
        },
      },
      // ── AI ───────────────────────────────────────────────
      '/api/ai-test': {
        post: {
          tags: ['AI'],
          operationId: 'aiTest',
          summary: 'AI 提供商连通性测试',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['apiKey', 'model'],
                  properties: {
                    apiKey: { type: 'string' },
                    model: { type: 'string', description: '模型名（app/lib/constants.ts 的 models 列表）' },
                    provider: { type: 'string', enum: ['google', 'deepseek', 'openrouter'], description: '默认按模型推断' },
                    baseUrl: { type: 'string', description: '自定义 OpenAI 兼容 baseUrl' },
                    thinkingLevel: { type: 'string', enum: ['minimal', 'low', 'medium', 'high', 'max'] },
                  },
                },
              },
            },
          },
          responses: {
            200: jsonOk('生成文本 + 请求参数回显', {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                data: {
                  type: 'object',
                  properties: { text: { type: 'string' }, model: { type: 'string' }, thinkingConfig: { type: 'object' } },
                },
              },
            }),
            400: errorJson('缺少 model/apiKey 或 baseUrl 不在白名单'),
            500: errorJson('生成失败（含 aiError 归一化）'),
          },
        },
      },
      '/api/ai-translation': {
        post: {
          tags: ['AI'],
          operationId: 'aiTranslation',
          summary: '统一 AI 翻译端点',
          description: 'type=twitter（默认）翻译推文实体；type=ins 翻译 IG caption。baseUrl 走 ENABLE_AI_BASE_URL_WHITELIST 可选白名单（AC-SEC-001）。',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', enum: ['twitter', 'ins'], default: 'twitter' },
                    tweet: { $ref: '#/components/schemas/EnrichedTweet', description: 'type=twitter 时必填' },
                    igPost: { $ref: '#/components/schemas/IGPost', description: 'type=ins 时必填' },
                    enableAITranslation: { type: 'boolean', description: 'twitter 分支守卫' },
                    force: { type: 'boolean', description: '强制重新翻译' },
                    apiKey: { type: 'string' },
                    model: { type: 'string' },
                    provider: { type: 'string', enum: ['google', 'deepseek', 'openrouter'] },
                    baseUrl: { type: 'string' },
                    thinkingLevel: { type: 'string', enum: ['minimal', 'low', 'medium', 'high', 'max'] },
                    translationGlossary: { type: 'string', maxLength: 4000 },
                  },
                },
              },
            },
          },
          responses: {
            200: jsonOk('翻译结果', {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                message: { type: 'string' },
                data: {
                  type: 'object',
                  properties: {
                    tweetId: { type: 'string' },
                    entities: { type: 'array', items: { $ref: '#/components/schemas/TranslationEntity' } },
                    captionTranslation: { type: 'string', description: 'ins 分支' },
                  },
                },
              },
            }),
            400: errorJson('缺少参数 / baseUrl 不在白名单'),
            404: errorJson('tweet/igPost 缺失'),
            500: errorJson('翻译失败（含 aiError）'),
          },
        },
      },
      '/api/ai-vision': {
        post: {
          tags: ['AI'],
          operationId: 'aiVision',
          summary: 'AI 视觉描述 / OCR 翻译 / 保存',
          description: '三种严格互斥请求形态：generate（mediaIndexes + mode，无 action）、translate（action=translate + items）、save（action=save + tweet.visionInfo）。',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  description: '触发形态由字段组合严格互斥（详见路由内 zod strict 校验）',
                  properties: {
                    action: { type: 'string', enum: ['translate', 'save'], description: 'translate/save 形态必填；generate 不带' },
                    tweet: {
                      $ref: '#/components/schemas/EnrichedTweet',
                      description: '客户端可携带 visionInfo（generate 合并用）',
                    },
                    mediaIndexes: { type: 'array', items: { type: 'integer', minimum: 0 }, description: 'generate 形态必填' },
                    mode: { type: 'string', enum: ['describe', 'ocr', 'custom'], description: 'generate 形态必填' },
                    customPrompt: { type: 'string', maxLength: 2000 },
                    withContext: { type: 'boolean' },
                    items: { type: 'array', description: 'translate 形态：{ index, originalText }[]', items: { type: 'object' } },
                    apiKey: { type: 'string' },
                    model: { type: 'string' },
                    provider: { type: 'string', enum: ['google', 'deepseek', 'openrouter'] },
                    baseUrl: { type: 'string' },
                    thinkingLevel: { type: 'string', enum: ['minimal', 'low', 'medium', 'high', 'max'] },
                    translationGlossary: { type: 'string', maxLength: 4000 },
                  },
                },
              },
            },
          },
          responses: {
            200: jsonOk('操作结果', {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                data: {
                  type: 'object',
                  properties: {
                    visionInfo: { type: 'array', items: { $ref: '#/components/schemas/AIVisionInfo' } },
                    translations: { type: 'array', items: { type: 'object' } },
                  },
                },
              },
            }),
            400: errorJson('非法 JSON / 形状不匹配任一形态 / baseUrl 不在白名单'),
            500: errorJson('生成/保存/翻译失败'),
          },
        },
      },
      // ── Proxy ────────────────────────────────────────────
      '/api/proxy/image': {
        get: {
          tags: ['Proxy'],
          operationId: 'proxyImage',
          summary: '图片代理',
          description: '解决 Instagram CDN CORS/CORP 拦截；仅允许图片扩展名或 cdninstagram.com / fbcdn.net 域名（防 SSRF）。',
          parameters: [
            { name: 'url', in: 'query', required: true, description: '图片 URL（同源响应返回，带缓存头）', schema: { type: 'string' } },
          ],
          responses: {
            200: jsonOk('图片二进制（Content-Type 透传上游）', { type: 'string', format: 'binary' }),
            400: errorJson('缺少 url'),
            403: errorJson('URL 不在白名单'),
            502: errorJson('上游拉取失败'),
          },
        },
      },
      // ── Bili ─────────────────────────────────────────────
      '/api/bili-post': {
        post: {
          tags: ['Bili'],
          operationId: 'biliPost',
          summary: 'Bili 动态发布（隐藏自用）',
          description: '隐藏自用入口：转发到 api.bilibili.com 上传图片并发布动态；ENABLE_BILI=false 时返回 404。',
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['content', 'cookie'],
                  properties: {
                    content: { type: 'string', description: '动态正文' },
                    title: { type: 'string' },
                    cookie: { type: 'string', description: 'Bili Cookie（需含 bili_jct 与 DedeUserID）' },
                    images: { type: 'array', items: { type: 'string', format: 'binary' }, description: '可选图片文件' },
                  },
                },
              },
            },
          },
          responses: {
            200: jsonOk('发布结果（CreateDynResult）', {
              type: 'object',
              properties: { dyn_id_str: { type: 'string' }, error: { type: 'string', description: '失败时' } },
            }),
            404: errorJson('ENABLE_BILI=false 未启用'),
            500: errorJson('发布失败'),
          },
        },
      },
    },
    components: {
      schemas: {
        ErrorResponse: {
          type: 'object',
          description: '统一错误响应',
          properties: {
            success: { type: 'boolean', default: false },
            error: { type: 'string' },
            message: { type: 'string' },
            status: { type: 'integer' },
            cause: {},
            aiError: { description: 'AI 提供商归一化错误（可选）' },
          },
        },
        // ── Tweet 相关 ───────────────────────────────────────
        TweetUser: {
          type: 'object',
          description: '推文作者（app/types/user.ts TweetUser）',
          required: ['id_str', 'name', 'profile_image_url_https', 'profile_image_shape', 'screen_name', 'verified', 'is_blue_verified'],
          properties: {
            id_str: { type: 'string' },
            name: { type: 'string' },
            profile_image_url_https: { type: 'string', format: 'uri', description: '头像 URL' },
            profile_image_shape: { type: 'string', enum: ['Circle', 'Square', 'Hexagon'] },
            screen_name: { type: 'string' },
            verified: { type: 'boolean' },
            verified_type: { type: 'string', enum: ['Business', 'Government'], description: '可选' },
            is_blue_verified: { type: 'boolean' },
          },
        },
        Entity: {
          type: 'object',
          description: '推文实体（app/types/entities.ts Entity）。type 决定附加字段：hashtag/mention/url/media/symbol 带 href；media_alt/separator 无 href；separator 带 mediaIndex。',
          required: ['text', 'type', 'index'],
          properties: {
            text: { type: 'string' },
            index: { type: 'integer', description: '实体的文本偏移索引' },
            type: {
              type: 'string',
              enum: ['text', 'hashtag', 'mention', 'url', 'media', 'symbol', 'media_alt', 'separator'],
            },
            href: { type: 'string', description: '除 text/media_alt/separator 外的类型带链接' },
            translation: { type: 'string', description: '手动翻译' },
            aiTranslation: { type: 'string', description: 'AI 翻译（ai-translation 端点写入）' },
            mediaIndex: { type: 'integer', description: 'separator 类型：对应媒体索引' },
          },
          additionalProperties: true,
        },
        TranslationEntity: {
          type: 'object',
          description: '存储在 DB 的翻译实体（app/types/entities.ts TranslationEntity），类型限于 text/hashtag/media_alt/separator，含翻译字段。',
          required: ['text', 'type', 'index'],
          properties: {
            text: { type: 'string' },
            index: { type: 'integer' },
            type: { type: 'string', enum: ['text', 'hashtag', 'media_alt', 'separator'] },
            href: { type: 'string' },
            translation: { type: 'string' },
            aiTranslation: { type: 'string' },
          },
          additionalProperties: true,
        },
        AIVisionInfo: {
          type: 'object',
          description: 'AI 视觉描述条目（app/types/vision.ts AIVisionInfo），挂在 EnrichedTweet.visionInfo[]',
          required: ['index', 'mode', 'promptId', 'provider', 'model', 'status', 'createdAt'],
          properties: {
            index: { type: 'integer', description: '对应 mediaDetails 数组索引（0-based）' },
            mode: { type: 'string', enum: ['describe', 'ocr', 'custom'] },
            promptId: { type: 'string' },
            provider: { type: 'string', description: '实际使用的 provider' },
            model: { type: 'string', description: '实际使用的模型 slug' },
            description: { type: 'string', description: 'describe/custom 模式：看图说话描述' },
            originalText: { type: 'string', description: 'ocr 模式：图片原文' },
            translatedText: { type: 'string', description: 'ocr 模式：简体中文翻译' },
            status: { type: 'string', enum: ['done', 'error'] },
            error: { type: 'string', description: 'status=error 时' },
            createdAt: { type: 'integer', description: 'epoch ms' },
          },
        },
        EnrichedTweet: {
          type: 'object',
          description: 'enrich 后的推文（app/types/index.ts EnrichedTweet），字段类型与媒体验证为 open schema。',
          required: ['lang', 'created_at', 'entities', 'id_str', 'text', 'user', 'url'],
          properties: {
            __typename: { type: 'string', enum: ['Tweet'] },
            lang: { type: 'string', description: '语言代码，如 en/ja' },
            created_at: { type: 'string', format: 'date-time', description: 'ISO 8601' },
            id_str: { type: 'string', description: '推文唯一 ID' },
            text: { type: 'string' },
            url: { type: 'string', format: 'uri', description: '推文完整 URL' },
            user: { $ref: '#/components/schemas/TweetUser' },
            entities: { type: 'array', items: { $ref: '#/components/schemas/Entity' } },
            autoTranslationEntities: { type: 'array', items: { $ref: '#/components/schemas/Entity' }, description: '旧版自动翻译实体' },
            visionInfo: { type: 'array', items: { $ref: '#/components/schemas/AIVisionInfo' }, description: 'AI 视觉描述结果' },
            quoted_tweet_id: { type: 'string', description: '引用推文 ID' },
            quotedTweet: { $ref: '#/components/schemas/EnrichedTweet', description: '引用推文（递归）' },
            card: { type: 'object', description: '预览卡片（LinkPreviewCard）' },
            comments: { type: 'array', items: { $ref: '#/components/schemas/EnrichedTweet' }, description: '内联评论线程' },
            in_reply_to_status_id_str: { type: 'string' },
            mediaDetails: { type: 'array', items: { type: 'object', description: '媒体详情（图片/视频，见 app/types/media.ts）' } },
            possibly_sensitive: { type: 'boolean' },
          },
          additionalProperties: true,
        },
        // ── Instagram 相关 ───────────────────────────────────
        IGAudio: {
          type: 'object',
          description: 'IG 帖子附带音频/音乐信息（app/types/ins.ts IGAudio）',
          properties: {
            title: { type: 'string' },
            subtitle: { type: 'string' },
            artist: { type: 'string' },
            duration: { type: 'number' },
            cover_artwork_uri: { type: 'string', format: 'uri' },
            cover_artwork_thumbnail_uri: { type: 'string', format: 'uri' },
            has_lyrics: { type: 'boolean' },
            is_explicit: { type: 'boolean' },
          },
        },
        IGMedia: {
          type: 'object',
          description: 'IG 媒体项（app/types/ins.ts IGMedia）',
          required: ['num', 'media_id', 'display_url', 'width', 'height', 'type'],
          properties: {
            num: { type: 'integer', description: '帖内序号' },
            media_id: { type: 'string' },
            shortcode: { type: 'string', description: '媒体级短码' },
            display_url: { type: 'string', format: 'uri' },
            video_url: { type: ['string', 'null'], format: 'uri', description: '视频 CDN URL（图片为 null）' },
            width: { type: 'integer' },
            height: { type: 'integer' },
            width_original: { type: 'integer' },
            height_original: { type: 'integer' },
            type: { type: 'string', enum: ['photo', 'video'] },
            tagged_users: {
              type: 'array',
              items: {
                type: 'object',
                properties: { id: { type: 'string' }, username: { type: 'string' }, full_name: { type: 'string' } },
              },
            },
          },
        },
        IGPost: {
          type: 'object',
          description: 'IG 帖子标准化结构（app/types/ins.ts IGPost）',
          required: ['id', 'post_id', 'url', 'username', 'fullname', 'description', 'likes', 'type', 'media'],
          properties: {
            id: { type: 'string', description: 'URL shortcode，路由主键' },
            post_id: { type: 'string', description: '帖子数字 ID' },
            url: { type: 'string', format: 'uri' },
            username: { type: 'string' },
            fullname: { type: 'string' },
            description: { type: 'string', description: 'caption，翻译目标文本' },
            tags: { type: 'array', items: { type: 'string' }, description: '#hashtag 列表' },
            likes: { type: 'integer' },
            type: { type: 'string', enum: ['post', 'reel', 'story', 'highlight'] },
            media: { type: 'array', items: { $ref: '#/components/schemas/IGMedia' } },
            avatar_url: { type: 'string', format: 'uri' },
            created_at: { type: 'string', format: 'date-time', description: 'ISO 字符串' },
            location_name: { type: 'string' },
            coauthors: {
              type: 'array',
              items: { type: 'object', properties: { username: { type: 'string' }, fullname: { type: 'string' } } },
            },
            verified: { type: 'boolean' },
            audio: { $ref: '#/components/schemas/IGAudio' },
            captionTranslation: { type: 'string', description: 'AI / 手动翻译后的 caption' },
          },
        },
        // ── User 相关 ────────────────────────────────────────
        RawUser: {
          type: 'object',
          description: '用户资料（app/lib/rettiwt-api/types/data/User.ts IUser）',
          required: ['createdAt', 'followersCount', 'followingsCount', 'fullName', 'id', 'isVerified', 'likeCount', 'profileImage', 'statusesCount', 'userName'],
          properties: {
            createdAt: { type: 'string', description: '账号创建时间' },
            description: { type: 'string', description: '用户简介' },
            followersCount: { type: 'integer' },
            followingsCount: { type: 'integer' },
            fullName: { type: 'string' },
            id: { type: 'string', description: 'rest id' },
            isFollowed: { type: 'boolean', description: '仅登录态可得' },
            isFollowing: { type: 'boolean', description: '仅登录态可得' },
            isVerified: { type: 'boolean' },
            likeCount: { type: 'integer' },
            location: { type: 'string' },
            pinnedTweet: { type: 'string' },
            profileBanner: { type: 'string', description: '封面图 URL' },
            profileImage: { type: 'string', format: 'uri' },
            statusesCount: { type: 'integer' },
            userName: { type: 'string', description: 'screen_name' },
          },
        },
        RepliesResponse: {
          type: 'object',
          required: ['tweets', 'nextCursor'],
          properties: {
            tweets: { type: 'array', items: { $ref: '#/components/schemas/EnrichedTweet' } },
            nextCursor: { type: ['string', 'null'] },
          },
        },
        SearchResponse: {
          type: 'object',
          required: ['tweets', 'nextCursor'],
          properties: {
            tweets: { type: 'array', items: { $ref: '#/components/schemas/EnrichedTweet' } },
            nextCursor: { type: ['string', 'null'] },
          },
        },
      },
    },
  }
}
