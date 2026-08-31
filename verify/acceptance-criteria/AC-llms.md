# llms.txt / OpenAPI 验收标准

> 版本：1.0 | 日期：2026-08-31（新增 AC-LLMS-001/002）
> 对应规范：https://llmstxt.org/
> 关联 Verifier：`test/unit/llms.spec.ts`（verify 套件已迁移为 Vitest 三层架构）
> 执行命令：`bun verify --module llms [--ac AC-LLMS-NNN]`

---

## AC-LLMS-001：/llms.txt 符合 llmstxt.org 规范且覆盖全部后端端点

- **输入**：`buildLlmsTxt()` 产物（`app/lib/llms.ts`）
- **预期输出**：满足 llms.txt 规范形状的 markdown
- **验证方法**：`bun verify --ac AC-LLMS-001`
- **Pass 条件**：
  - 首行 H1 标题，第二行（空行后）为 `> ` blockquote 简介
  - 链接按 `## ` H2 分区组织，子弹格式统一 `- [文本](链接): 描述`
  - 纯 markdown：无 HTML 标签、无表格字符 `|`、无代码围栏
  - 全部链接为相对路径（任意部署域名可用）
  - Backend API 分区逐条列出 `apiEndpoints` 全部端点，且互不重复
  - **Data Shapes 分区**描述常用接口（搜索 / 获取推文）出入参形态：至少包含 `EnrichedTweet` / `TweetUser` / `Entity` 字段清单、`{ tweets, nextCursor }` 分页形态、`GET /api/tweet/search` 与 `GET /api/tweet/get/{id}` 的入参说明

---

## AC-LLMS-002：/openapi.json 为合法 OpenAPI 3.1 文档且路径与端点清单一致

- **输入**：`buildOpenApiDoc(baseUrl)` 产物（`app/lib/llms.ts`）
- **预期输出**：OpenAPI 3.1 JSON，覆盖 `app/routes.ts` 中 `api/*` 全部接口
- **验证方法**：`bun verify --ac AC-LLMS-002`
- **Pass 条件**：
  - `openapi` 版本前缀为 `3.1.`，`info.title` / `servers[0].url` 正确
  - 三方奇偶校验：`apiEndpoints` 去重路径 = OpenAPI `paths` 键集合 =
    期望路径清单（14 条）
  - 每个 operation 具备 `operationId` / `summary` / `tags`，响应统一挂在 `responses` 下且至少一条
  - 响应 schema 通过 `$ref` 指向 `components.schemas` 中带真实字段的定义（EnrichedTweet / IGPost / AIVisionInfo / RawUser 等），非占位 `type: object`
  - 关键端点：search 含 q/type/cursor/count query 参数；replies 含 cursor；
    proxy/image 含 url query；`/api/user/timeline/{username}` 固定 429 且无 200

---

## 变更约定

任何新增/删除/调整后端接口（`app/routes.ts` 的 `api/*`）时，必须同步：

1. `app/lib/llms.ts`：`apiEndpoints`（llms.txt 列表）+ `buildOpenApiDoc` 的 paths
2. 本文件 `EXPECTED_PATHS` 对应清单（`test/unit/llms.spec.ts`）

奇偶校验测试（AC-LLMS-002）会在漏改时红。
