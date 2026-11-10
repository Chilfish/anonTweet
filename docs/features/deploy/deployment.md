# 部署说明与生产环境准则

本手册指导开发者在 Cloudflare Workers 或自有 Node/Bun 环境交付 `anonTweet`。

## 0. 环境文件

本地只有一份环境文件：`.dev.vars`（模板 `.dev.vars.example`）。

```bash
cp .dev.vars.example .dev.vars
```

- `wrangler` / `react-router dev` / 构建与部署脚本都读它。
- 命令行或 CI 显式传入的同名变量优先于文件。
- 旧 `.env` 不再读取；迁移时把需要的键挪到 `.dev.vars`。
- 生产环境的密钥不写回文件，用 `wrangler secret put` 设置。

## 1. 部署策略

### A. Cloudflare Workers（默认）

构建链：React Router v8 + `@cloudflare/vite-plugin`，SSR 跑在 workerd。

```bash
bun run deploy -- --no-deploy   # 只构建并校验产物
bun run deploy                  # 构建 + wrangler deploy
bun run preview                 # build + vite preview（workerd 本地预览）
```

部署脚本固定按线上处理：

1. 强制 `ENVIRONMENT=production`、`ENABLE_LOCAL_CACHE=false`；
2. 读取 `.dev.vars` 补齐构建期变量（显式环境变量优先）；
3. 清理 `build/` 后从零构建；
4. 校验 `build/client`、`build/server/wrangler.json`；
5. `wrangler deploy --config build/server/wrangler.json`。

必须用 `build/server/wrangler.json`：它由 Cloudflare 插件生成，`main` 指向 Worker 入口、`assets` 指向客户端产物。根目录 `wrangler.jsonc` 是源配置（`main: ./workers/app.ts`）。

运行时配置：

- **Vars**（`wrangler.jsonc`）：`ENVIRONMENT=production`、`ENABLE_AI_TRANSLATION`、`ENABLE_DB_CACHE=true`、`ENABLE_LOCAL_CACHE=false`、`ENABLE_TIMELINE`、`ENABLE_BILI`。
- **Secrets**：
  ```bash
  bunx wrangler secret put TWEET_KEYS
  bunx wrangler secret put INS_COOKIES
  bunx wrangler secret put DB_URL
  bunx wrangler secret put GEMINI_API_KEY
  bunx wrangler secret put DEEPSEEK_API_KEY
  ```
- `HOSTNAME` 可留空：截图路由会回退到请求 origin。固定自定义域名后建议显式设置，否则同 zone 内的自请求需要走 Custom Domain（见 §4）。

Workers 注意事项：

- **必须使用 Workers Paid**：免费版 CPU 10ms / 50 subrequests，SSR + linkedom 解析不够用；Paid 默认 30s CPU、10,000 subrequests。
- 单个变量上限 5KB。`TWEET_KEYS` 是 base64 cookie，多 Key 很容易超；拆成独立 secret 或改用 KV。
- 兼容日期 `2026-11-10` 已自动启用 `nodejs_compat`，`process.env` 会注入 vars/secrets。
- 文件系统是只读 `/bundle` + 按请求隔离的 `/tmp`，**不要开** `ENABLE_LOCAL_CACHE`；缓存用内存 LRU + `ENABLE_DB_CACHE`（Neon HTTP）。
- 图片代理 / AI / IG SDK 都走原生 `fetch`；axios 在 Worker 入口被固定为 fetch adapter。

### B. 本地开发

- 开发：`bun run dev`（workerd，http://localhost:9080）
- 生产构建预览：`bun run preview`（`build` + `vite preview`）
- 本地环境变量写 `.dev.vars`，由 wrangler / Vite 插件原生读取。

---

## 2. 存储与缓存层一致性 (Persistence)

- **数据库交互**：启用 `ENABLE_DB_CACHE` 时，Schema 同步至 PostgreSQL 需执行：
  ```bash
  bun run db:push
  ```
- **Workers**：`ENABLE_LOCAL_CACHE=false` + `ENABLE_DB_CACHE=true`；内存 LRU 只做单 isolate 热缓存，持久化依赖 PostgreSQL（Neon HTTP 驱动）。
- **本地**：`ENABLE_LOCAL_CACHE=true` 生效为内存 LRU（workerd 无持久文件系统）；Node 测试进程仍走文件缓存。

---

## 3. 生产环境验收清单 (Smoke Testing)

| 验证维度         | 测试端点                                                            | 预期行为                                  |
| :--------------- | :------------------------------------------------------------------ | :---------------------------------------- |
| **Twitter 渲染** | `/tweets/:tweetId`                                                  | 静态推文卡片与服务端注水 (Hydration) 正常 |
| **Twitter 截图** | `/plain-tweet/:tweetId`                                             | 渲染最小推文静态片段                      |
| **AI 翻译**      | `/plain-tweet/:tweetId?translation=true`                            | 返回经过 AI 语义对齐后的翻译实体          |
| **IG 渲染**      | `/ins/:shortcode`                                                   | Instagram 透卡相框 + 九宫格媒体           |
| **IG 截图**      | `/plain-ins/:shortcode`                                             | 纯净版 IG 帖子静态片段                    |
| **静态资源**     | `/assets/*`、`/manifest.webmanifest`、`/skills/anon-tweet/SKILL.md` | 200 + 正确 Content-Type / Cache-Control   |
| **负载均衡**     | 日志观察                                                            | 多 `TWEET_KEYS` 环境下，上游响应分布均匀  |

---

## 4. 故障检测与排查 (Troubleshooting)

### 故障 A: `❌ Invalid environment variables`

- **根本原因**: 环境变量验证器（Zod）拦截了非法的配置注入。
- **对策**: 校验 `DB_URL` 的字符串格式、`HOSTNAME` 是否包含协议头；确认 `.dev.vars` 的引号 / 行内注释写法被正确解析。

### 故障 B: 上游速率限制 (429 Too Many Requests)

- **现象**: 推文加载响应延迟或间歇性中断。
- **最佳实践**: 增加 `TWEET_KEYS` 的池化数量；检查 `ENABLE_DB_CACHE` 是否配置，以降低对上游接口的冗余调用。

### 故障 C: 截图路由 500 / 自请求失败

- `/plain-tweet/:id` 会 `fetch` 自身域名的 `/api/tweet/get` 与 `/api/ai-translation`。
- Cloudflare 同 zone 内 Worker 互调需要 Service Binding 或 **Custom Domain**；把 `HOSTNAME` 配成 Worker 的 Custom Domain，或留空让其回退到请求 origin。
- 本地预览端口与 `HOSTNAME` 不一致时，删掉 `HOSTNAME` 或改成当前端口。

### 故障 D: 本地改了 `.dev.vars` 但 Worker 没生效

- `wrangler` / `react-router dev` 直接读 `.dev.vars`；进程环境变量优先。
- 构建脚本通过 `scripts/lib/env.ts` 只补齐缺失键，不会覆盖命令行传入的值。
