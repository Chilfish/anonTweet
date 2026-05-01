# Anon Tweet 架构设计文档 v2.2

## 1. 架构总览 (System Architecture)

本项目采用 **React Router v7** 构建全栈应用，遵循 **BFF (Backend for Frontend)** 设计模式。系统明确划分为表现层（Presentation Layer）、API 聚合层（BFF Layer）与领域服务层（Domain Service Layer）。

- **运行时 (Runtime)**: Bun (高性能 JavaScript 运行时)
- **全栈框架 (Framework)**: React Router v7 (SSR + CSR Hybrid)
- **数据持久化 (Persistence)**: PostgreSQL (Neon Serverless) + Drizzle ORM
- **AI & 自动化 (AI & Automation)**: Google Gemini + DeepSeek + Vercel AI SDK (双提供商翻译)
- **状态管理 (State Management)**: Zustand v5 (Client State, persist v6) + SWR (Server State)

核心设计原则遵循 **关注点分离 (SoC)** 与 **读写分离**：

- **API 路由**：承担网关角色，负责数据聚合、权限校验、AI 服务代理及缓存策略。
- **UI 路由**：采用 SPA 优先策略，结合 SWR 进行高效的数据获取与缓存更新。

---

## 2. API 接口设计与路由策略 (API Layer)

API 层作为 BFF，主要负责将异构数据源（Database, Twitter Private API, AI Engine, Bilibili API）标准化为前端可消费的 JSON 格式。

### 2.1 Tweet Domain (`/api/tweet/*`)

核心推文数据的获取、处理与状态变更。

- **`POST /api/tweet/get/:id`**
  - **Handler**: `app/routes/api/tweet/get.ts`
  - **逻辑**: 复合查询接口。不仅获取指定 ID 的推文，还会触发 **递归上下文解析** (Parent Chain & Quoted Tweet)。
    1. 解析请求体提取 `tweetId`、AI 翻译配置（`provider`, `model`, `thinkingLevel` 等）。
    2. 优先读取 DB 缓存，Cache Miss 时调用 `rettiwt-api` 回源抓取并 Write-Back。
    3. **AI 预处理**: 若配置启用且推文非中文，可在服务端触发 AI 翻译流程，结果直接写入 `tweet.entities` 的 `aiTranslation` 字段。
  - **返回**: `TweetData` (按时间线排序的推文数组)。

- **`POST /api/tweet/set`**
  - **Handler**: `app/routes/api/tweet/set.ts`
  - **逻辑**: 处理推文数据的持久化与更新。
  - **机制**: 接收 `entities` 数据包，使用 `ON CONFLICT DO UPDATE` 策略写入 `tweet` 及 `tweet_entities` 表。支持批量插入（Batch Insert），确保翻译后的推文内容及时同步到数据库。

### 2.2 AI Domain

- **`POST /api/ai-translation`**
  - **Handler**: `app/routes/api/ai/ai-translation.ts`
  - **逻辑**: 单条推文 AI 翻译代理接口。
  - **多提供商支持**: 根据请求中的 `provider` 参数（`google` / `deepseek`），动态选择 `@ai-sdk/google` 或 `@ai-sdk/deepseek` 进行翻译。
  - **强制重翻译**: 支持 `force: true` 参数，即便推文已有翻译结果也会重新调用 AI。
  - **返回**: 合并后的 `entities`（包含 `aiTranslation` 字段），清理 `autoTranslationEntities` 旧字段。

- **`POST /api/ai-test`**
  - **Handler**: `app/routes/api/ai/ai-test.ts`
  - **逻辑**: AI 连通性测试及代理接口。
  - **多提供商适配**: 根据 `provider` 参数选择对应的 AI SDK 提供商和 `providerOptions` 进行连通性测试。

### 2.3 User Domain (`/api/user/*`)

用户画像与时间线数据的聚合。

- **`GET /api/user/get/:username`**
  - **逻辑**: 获取用户基础元数据。支持通过 **用户名** 或 **用户 ID** 查询。优先查库，失败则回源。

- **`GET /api/user/timeline/:username`**
  - **逻辑**: 获取指定用户的推文时间线，经过 `enrichTweet` 清洗。

### 2.4 Integration Domain

- **`POST /api/bili-post`**
  - **Handler**: `app/routes/api/bili-post.tsx`
  - **逻辑**: Bilibili 动态发布代理。
  - **流程**: 接收 FormData -> 提取凭证 -> 并发上传图片至 Bilibili BFS -> 构造动态 Payload -> 发布。
  - **缺陷**： 未实现指定代理，目前所有发送到B站动态的ip来源都来自服务器IP

---

## 3. 数据流与服务层 (Data Flow & Services)

### 3.1 混合数据源策略 (Hybrid Data Source)

系统采用 **Write-Through Cache** 变体策略，并引入 AI 增强。

1. **Level 1: 内存 LRU 缓存** — `MemoryCacheAdapter`，最大 1000 条，请求合并去重。
2. **Level 2: 文件系统缓存** — `NodeFsCacheAdapter`，原子写入，TTL 支持。
3. **Level 3: Database (Cache)**
   - 存储结构化 JSON 数据 (`EnrichedTweet`)。
   - `tweet_entities` 表存储翻译内容（新版使用 `entities[].aiTranslation` 字段代替旧的 `autoTranslationEntities`）。
4. **Level 4: Upstream API (Source of Truth)**
   - 基于 `rettiwt-api` 的逆向工程接口，通过 `RettiwtPool` 进行多 Key 调度，仅在 Cache Miss 时调用。
5. **Level 5: AI Engine (Transformation)**
   - 生成翻译数据，通过实体占位符 (Entity Placeholders) 保护推文中的链接、标签和提及。
   - 支持 Google Gemini 和 DeepSeek 双提供商。

### 3.2 运行时数据合并 (Runtime Injection)

在数据返回前端之前，服务端执行"数据富化"：

- 读取原始推文。
- 读取/生成翻译内容。
- **Merge**: 将 AI 翻译结果通过 `applyAITranslations()` 合并到 `entities[].aiTranslation` 字段，清理 `autoTranslationEntities`。

### 3.3 API Key 轮询缓冲池 (RettiwtPool)

为了应对 Twitter 严格的 Rate Limit 限制，系统实现了基于 `RettiwtPool` 的多 Key 调度机制：

1. **多 Key 管理**: 支持配置多个 `TWEET_KEYS`，维护一个 Fetcher 实例池。
2. **自动轮询 (Round-Robin)**: 每次请求自动切换使用的 Key，实现负载均衡。
3. **故障转移与重试**:
   - 捕获 `429 Too Many Requests` 错误。
   - 触发指数退避策略。
   - 自动轮询至下一个可用 Key 并重试请求。
   - 若所有 Key 均耗尽额度，则向上层抛出异常。

---

## 4. 客户端架构 (Client-Side Architecture)

### 4.1 数据获取策略 (Data Fetching)

前端采用 **SWR (Stale-While-Revalidate)** 策略替代单纯的 Client Loader。

- **SWR**:
  - 用于推文数据 (`useSWR`) 和用户数据的获取。
  - 支持自动重试、聚焦时重新验证和乐观更新。
  - 在请求时动态传递 AI 配置参数 (Provider, API Key, Model, ThinkingLevel)。

- **Plain Route (`/plain-tweet/:id`)**:
  - 专为截图设计的独立路由，仅包含核心推文组件 (`MyPlainTweet`)，移除所有 Layout、Sidebar 和交互按钮。

### 4.2 状态管理 (Zustand v5, persist v6)

使用 Zustand 构建分层状态库，共 4 个 Store：

- **`useAppConfigStore`** (`app/lib/stores/appConfig.ts`):
  - 持久化至 localStorage (`app-config-store`, v4)
  - 管理主题、截图格式、媒体代理、**AI 提供商选择**（Google/DeepSeek）、各种 API Key、模型选择、思考级别、术语表等全局配置

- **`useTranslationStore`** (`app/lib/stores/translation.ts`) — 核心:
  - 持久化至 localStorage (`translation-store`, v6)
  - **SettingsSlice**: 翻译开关、自定义分隔符模板管理
  - **DataSlice**: 推文数据 (`tweets`)、翻译缓存 (`translations`)、翻译可见性、翻译模式、`updateTweet()` 用于 AI 翻译结果回填
  - 预设模板 (`DEFAULT_TEMPLATES`) 不再持久化，每次从常量初始化
  - 存储迁移逻辑处理 v5→v6 的数据结构变更

- **`useTranslationUIStore`** (`app/lib/stores/translationUI.ts`):
  - 翻译 UI 交互状态：编辑中推文、截图状态、选择模式、已选推文

- **`useTranslationDictionaryStore`** (`app/lib/stores/TranslationDictionary.ts`):
  - 翻译词典（对照表），支持 Excel 导入/导出

- **选择器 Hooks** (`app/lib/stores/hooks.ts`):
  - `useAIConfig()` — 聚合所有 AI 提供商相关配置（含 DeepSeek）
  - `useTranslationSettings()` / `useTranslationActions()` — 翻译设置与操作

### 4.3 实体与翻译架构 (Entity & Translation Architecture)

v2.1 对翻译实体存储进行了重大重构：

- **`entities[].aiTranslation`**（新规范）: AI 翻译直接存储在实体内，与手动翻译 (`translation`) 共存。
- **`autoTranslationEntities`**（旧规范，兼容）: 独立的翻译实体数组，逐步迁移中。
- **翻译视图解析器** (`app/lib/translation/resolveTranslationView.ts`): 6 级决策链统一决定推文渲染时的翻译显示优先级。
- **实体解析器** (`app/lib/translation/resolveEntities.ts`): 统一 AI 翻译合并逻辑。

### 4.4 实体占位符保护 (Entity Placeholder Protection)

为了在翻译过程中保留推文格式：

1. **Serialization**: 将推文文本中的 URL、Mention、Tag 替换为占位符 (e.g., `<<__URL_0__>>`)。
2. **Translation**: 发送带占位符的文本至 AI 引擎。
3. **Validation & Retry**: 校验占位符完整性，最多重试 2 次。
4. **Restoration**: 通过 `restoreEntities()` + `applyAITranslations()` 将翻译结果按 `index` 合并回原始实体数组。

---

## 5. AI 翻译多提供商架构 (Multi-Provider AI)

### 5.1 提供商模型

| 提供商 | SDK | 模型 | 思考模式 |
|--------|-----|------|----------|
| Google Gemini | `@ai-sdk/google` | `gemini-3-flash-preview` 等 | `thinkingLevel` + `thinkingBudget` |
| DeepSeek | `@ai-sdk/deepseek` | `deepseek-v4-flash`, `deepseek v4 pro` | `reasoning_effort` (disabled/high/max) |

### 5.2 思考强度映射

```typescript
// Gemini: level → budget
minimal → 0, low → 1024, medium → 4096, high → 16384, max → 32768

// DeepSeek: level → reasoning_effort
minimal → 'disabled'
high    → 'high'
max     → 'max'
```

### 5.3 配置流

1. 用户在设置面板选择提供商 (Google / DeepSeek)
2. 配置对应的 API Key、模型、思考强度
3. 发起翻译请求时，`provider` 参数沿 BFF → API Route → `autoTranslateTweet()` 传递
4. `autoTranslateTweet()` 内部按 `provider` 分支选择 SDK 和 `providerOptions`

---

## 6. 基础设施依赖

- **Database**: PostgreSQL (存储 JSON Document 及关系型 User Entity)。
- **AI Engine**: Google Gemini API + DeepSeek API (通过 Vercel AI SDK 调用)。
- **Upstream**: Twitter Private API (GraphQL endpoints via Guest/Auth)。
- **新增依赖**: `@ai-sdk/deepseek` (DeepSeek 支持)、`x-client-transaction-id` (Twitter 请求头)、`linkedom` (SSR DOM 模拟)。
