# 架构决策记录

> 记录关键架构决策及其理由。格式: 日期 / 决策 / 背景 / 后果。

## 技术栈总览

| 层     | 技术                                       |
| ------ | ------------------------------------------ |
| 框架   | React Router v8（SSR + CSR Hybrid）        |
| 运行时 | Bun 1.3                                    |
| 状态   | Zustand v5（client）/ SWR（server）        |
| 持久化 | PostgreSQL（Neon Serverless）+ Drizzle ORM |
| AI     | Vercel AI SDK（Google Gemini + DeepSeek）  |
| UI     | Tailwind v4 + shadcn/ui + Lucide           |
| 测试   | Vitest + verify 验证套件                   |

## ADR-001: React Router v8 全栈框架（BFF 模式）

- **日期**: 2026-05
- **决策**: 使用 React Router（原 Remix 演进）做全栈框架，API 路由承担 BFF 网关角色
- **背景**: 需要 SSR + CSR 混合渲染，同时统一前后端数据聚合
- **理由**:
  - 单一仓库单一框架，路由即 API 层（`app/routes/api/*`）
  - SSR 渲染推文卡片 + 截图路由（`/plain`）天然支持
  - Vercel Serverless 部署友好
- **后果**: 客户端/服务端边界需严格区分（见 postmortem #004）；截图组件隔离在纯路由

## ADR-002: RettiwtPool 多 Key 轮询池

- **日期**: 2026-05
- **决策**: `app/lib/SmartPool.ts` 实现 Twitter 多 Key 调度池
- **背景**: Twitter Private API 严格的 Rate Limit，单 Key 频繁 429
- **设计**:
  - 多 `TWEET_KEYS`（Base64 cookies），懒初始化 Fetcher 实例池
  - Round-Robin 轮询 + 429/401/403 自动故障转移
  - 每 Key 独立 `FetcherService` 缓存；全部耗尽抛聚合错误
- **后果**: 用户需配置多个 Key 应对高频；catch 用 `unknown` 窄化

## ADR-003: 双 AI Provider（Gemini + DeepSeek）

- **日期**: 2026-05
- **决策**: 通过 Vercel AI SDK 抽象 Google Gemini 与 DeepSeek 双提供商，`provider` 参数运行时切换
- **设计**:
  - Twitter: 实体级翻译（placeholder 保护）→ `autoTranslateTweet()`
  - IG: caption 纯文本翻译 → `translateIGCaption()`（`isChinese()` 守卫）
  - 思考强度映射: Gemini `thinkingLevel→budget`；DeepSeek `reasoning_effort`
- **理由**: 解耦具体 AI SDK，支持运行时切换，避免供应商锁定
- **后果**: `resolveTranslationView.ts` 6 级决策链统一渲染优先级

## ADR-004: Zustand + SWR 状态分层

- **日期**: 2026-05
- **决策**: Client 状态用 Zustand v5（persist v6），Server 状态用 SWR
- **背景**: 全局配置 + 翻译状态需要持久化；服务端数据需要缓存/重验证
- **规则**:
  - Store 定义 `create<T>()()`（双括号）；**永远用 selector** 订阅
  - persist store 用 `_hasHydrated` 防 SSR mismatch；迁移必须类型化
  - SWR 负责推文/用户数据获取（自动重试、聚焦重验证、乐观更新）
- **后果**: postmortem #006 教训固化——禁止整 store 订阅

## ADR-005: 实体占位符保护机制

- **日期**: 2026-03
- **决策**: 送 LLM 前将 URL/mention/hashtag 替换为 `<<__TYPE_INDEX__>>` 占位符
- **流程**: Serialization → Translation → Validation（校验占位符完整，重试 ≤2）→ Restoration（`restoreEntities()` + `applyAITranslations()` 按 index 合并）
- **理由**: 防止 AI 破坏推文格式；保证 `tweet.entities` 原文只读
- **后果**: 翻译存 `entities[].aiTranslation`；手动翻译存 `TranslationStore`；`autoTranslationEntities` 旧规范逐步迁移

## ADR-006: 三层缓存策略

- **日期**: 2026-05
- **决策**: Memory（LRU max 1000，`structuredClone`）→ Node FS（原子写）→ PostgreSQL（Drizzle），请求合并去重
- **背景**: 减少上游调用 + 截图/翻译性能
- **理由**: `structuredClone` 优于 `JSON.parse(JSON.stringify())`；FS 原子写（tmp → rename）防损坏；DB 可跨实例共享
- **后果**: `ENABLE_DB_CACHE` / `ENABLE_LOCAL_CACHE` 开关控制；Serverless 只读环境不可用 FS 缓存

## ADR-007: verify 验收框架

- **日期**: 2026-07
- **决策**: 建立「AI 实现 → 自验证 → Pass/Fail 反馈」闭环（CLI + Fixture + SDK + AC）
- **背景**: 此前零自动化闭环，所有验证依赖浏览器手动测试（postmortem #007 教训）
- **设计**:
  - AC（验收标准）→ fixtures → verifier 实现 → `bun run verify/index.ts`
  - 离线 AC 用 fixture 直接验证，无需网络/API key
  - 集成 AC 需 `TWEET_KEYS` + 测试服务器
- **后果**: 验证先行成为强制规范（CLAUDE.md 🔴 规则 2）

## ADR-008: 媒体代理统一（postmortem #005 预防）

- **日期**: 规划中
- **决策**: 抽 `createMediaUrl(originalUrl, config)` 纯函数统一代理逻辑，所有 React/非 React 路径走同一函数
- **背景**: 代理/视频/截图四套重复 URL 转换 → 双代理、漏代理、漏下载
- **后果**: 截图等待用 `document.fonts.ready` 而非固定 delay；S7 Media Proxy Verifier 待实施
