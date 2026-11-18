# llms.txt / OpenAPI 验收标准

> 版本：1.0 | 日期：2026-08-31（新增 AC-LLMS-001/002）
> 对应规范：https://llmstxt.org/
> 关联 Verifier：`test/unit/llms.spec.ts`（verify 套件已迁移为 Vitest 三层架构）
> 执行命令：`bun verify --module llms [--ac AC-LLMS-NNN]`

---

## AC-LLMS-001：/llms.txt 是小型索引，只链可取回资源

- **输入**：`buildLlmsTxt()` 产物（`app/lib/llms.ts`）
- **预期输出**：满足 llms.txt 规范形状、且保持索引定位的 markdown
- **验证方法**：`bun verify --ac AC-LLMS-001`
- **Pass 条件**：
  - 首行 H1 标题，空行后为 `> ` blockquote 简介
  - 链接按 `## ` H2 分区组织，子弹格式统一 `- [文本](链接): 描述`
  - 纯 markdown：无 HTML 标签、无表格字符 `|`、无代码围栏
  - 全部链接为相对路径（任意部署域名可用）
  - **索引而非文档**：体积 < 3000 字符；不内联数据结构定义（不出现 `EnrichedTweet:` 之类逐字段清单），schema 一律通过 `/openapi.json` 获取
  - **链接必须可取回**：不把 POST-only 端点（`/api/tweet/set`、`/api/ai-*`、`/api/ig/translate`、`/api/bili-post`）当作链接；示例链接均为 GET
  - 必须链接机器可读入口 `/openapi.json` 与任务指南 `/skills/anon-tweet/SKILL.md`
  - 不宣传隐藏入口 `/bili`；给出调用约定（HTTP 200 + success 判定、timeline 默认关闭、INS_COOKIES 缺失返回空数组）

---

## AC-LLMS-002：/openapi.json 为合法 OpenAPI 3.1 文档且路径与端点清单一致

- **输入**：`buildOpenApiDoc(baseUrl)` 产物（`app/lib/llms.ts`）
- **预期输出**：OpenAPI 3.1 JSON，覆盖 `app/routes.ts` 中 `api/*` 全部接口
- **验证方法**：`bun verify --ac AC-LLMS-002`
- **Pass 条件**：
  - `openapi` 版本前缀为 `3.1.`，`info.title` / `servers[0].url` 正确
  - 三方奇偶校验：期望路径清单（14 条）= OpenAPI `paths` 键集合；llms.txt 不再维护第二份端点清单
  - 每个 operation 具备 `operationId` / `summary` / `tags`，响应统一挂在 `responses` 下且至少一条
  - 响应 schema 通过 `$ref` 指向 `components.schemas` 中带真实字段的定义（EnrichedTweet / IGPost / AIVisionInfo / RawUser 等），非占位 `type: object`
  - 关键端点：search 含 q/type/cursor/count query 参数；replies 含 cursor；
    proxy/image 含 url query；`/api/user/timeline/{username}` 按正常接口文档化
    （200 EnrichedTweet 数组 + 429/500 错误响应）

---

## 变更约定

任何新增/删除/调整后端接口（`app/routes.ts` 的 `api/*`）时，必须同步：

1. `app/lib/llms.ts`：`buildOpenApiDoc` 的 paths（llms.txt 只维护可读入口与示例链接）
2. 本文件 `EXPECTED_PATHS` 对应清单（`test/unit/llms.spec.ts`）

奇偶校验测试（AC-LLMS-002）会在漏改时红。
