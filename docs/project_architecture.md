# Anon Tweet 架构设计文档 v2.1

## 1. 架构总览 (System Architecture)

本项目采用 **React Router v7** 构建全栈应用，遵循 **BFF (Backend for Frontend)** 设计模式。系统明确划分为表现层（Presentation Layer）、API 聚合层（BFF Layer）与领域服务层（Domain Service Layer）。

- **运行时 (Runtime)**: Bun (高性能 JavaScript 运行时)
- **全栈框架 (Framework)**: React Router v7 (SSR + CSR Hybrid)
- **数据持久化 (Persistence)**: PostgreSQL (Neon Serverless) + Drizzle ORM
- **AI & 自动化 (AI & Automation)**: Google Gemini API + Vercel AI SDK (Translation), Puppeteer (Screenshot)
- **状态管理 (State Management)**: Zustand (Client State) + SWR (Server State)

核心设计原则遵循 **关注点分离 (SoC)** 与 **读写分离**：

- **API 路由**：承担网关角色，负责数据聚合、权限校验、AI 服务代理及缓存策略。
- **UI 路由**：采用 SPA 优先策略，结合 SWR 进行高效的数据获取与缓存更新。

---

## 2. API 接口设计与路由策略 (API Layer)

API 层作为 BFF，主要负责将异构数据源（Database, Twitter Private API, AI Engine, Bilibili API）标准化为前端可消费的 JSON 格式。

### 2.1 Tweet Domain (`/api/tweet/*`)

核心推文数据的获取、处理与状态变更。

- **`GET /api/tweet/get/:id`**
  - **Handler**: `app/routes/api/tweet/get.ts`
  - **逻辑**: 复合查询接口。不仅获取指定 ID 的推文，还会触发 **递归上下文解析** (Parent Chain & Quoted Tweet)。
    1.  解析 URL 参数提取 `tweetId`。
    2.  优先读取 DB 缓存，Cache Miss 时调用 `rettiwt-api` 回源抓取并 Write-Back。
    3.  **AI 预处理**: 若配置启用，可在服务端触发 AI 翻译流程。
  - **返回**: `TweetData` (按时间线排序的推文数组)。

- **`POST /api/tweet/set`**
  - **Handler**: `app/routes/api/tweet/set.ts`
  - **逻辑**: 处理推文数据的持久化与更新。
  - **机制**: 接收 `entities` 数据包，使用 `ON CONFLICT DO UPDATE` 策略写入 `tweet` 及 `tweet_entities` 表。支持批量插入（Batch Insert），确保翻译后的推文内容及时同步到数据库。

- **`GET /api/tweet/image/:id`**
  - **Handler**: `app/routes/api/tweet/image.ts`
  - **逻辑**: 服务端截图生成服务。
  - **流程**:
    1.  启动 Headless Browser (Puppeteer)。
    2.  访问内部渲染路由 `/plain-tweet/:id` (纯净模式，无干扰 UI)。
    3.  通过 Query 参数控制是否渲染 AI 翻译内容。
    4.  截取视口快照并返回 `image/png` 流。

### 2.2 AI Domain

- **`POST /api/ai-test`**
  - **Handler**: `app/routes/api/ai-test.ts`
  - **逻辑**: AI 连通性测试及代理接口。
  - **实现**: 集成 `Vercel AI SDK` (`@ai-sdk/google`)，调用 Google Gemini 模型（如 `gemini-2.0-flash-exp`）。

### 2.3 User Domain (`/api/user/*`)

用户画像与时间线数据的聚合。

- **`GET /api/user/get/:username`**
  - **逻辑**: 获取用户基础元数据。优先查库，失败则回源。

- **`GET /api/user/timeline/:username`**
  - **逻辑**: 获取指定用户的推文时间线，经过 `enrichTweet` 清洗。

### 2.4 Integration Domain

- **`POST /api/bili-post`**
  - **Handler**: `app/routes/api/bili-post.tsx`
  - **逻辑**: Bilibili 动态发布代理。
  - **流程**: 接收 FormData -> 提取凭证 -> 并发上传图片至 Bilibili BFS -> 构造动态 Payload -> 发布。

---

## 3. 数据流与服务层 (Data Flow & Services)

### 3.1 混合数据源策略 (Hybrid Data Source)

系统采用 **Write-Through Cache** 变体策略，并引入 AI 增强。

1.  **Level 1: Database (Cache)**
    - 存储结构化 JSON 数据 (`EnrichedTweet`)。
    - `tweet_entities` 表存储翻译内容 (`autoTranslationEntities` 等)。
2.  **Level 2: Upstream API (Source of Truth)**
    - 基于 `rettiwt-api` 的逆向工程接口，仅在 Cache Miss 时调用。
3.  **Level 3: AI Engine (Transformation)**
    - 生成翻译数据，通过实体占位符 (Entity Placeholders) 保护推文中的链接、标签和提及。

### 3.2 运行时数据合并 (Runtime Injection)

在数据返回前端之前，服务端执行“数据富化”：

- 读取原始推文。
- 读取/生成翻译内容 (Entity[])。
- **Merge**: 将翻译实体注入 `EnrichedTweet` 对象。

---

## 4. 客户端架构 (Client-Side Architecture)

### 4.1 数据获取策略 (Data Fetching)

前端采用 **SWR (Stale-While-Revalidate)** 策略替代单纯的 Client Loader。

- **SWR**:
  - 用于推文数据 (`useSWR`) 和用户数据的获取。
  - 支持自动重试、聚焦时重新验证和乐观更新。
  - 在请求时动态传递 AI 配置参数 (API Key, Model)。

- **Plain Route (`/plain-tweet/:id`)**:
  - 专为截图设计的独立路由，仅包含核心推文组件 (`MyPlainTweet`)，移除所有 Layout、Sidebar 和交互按钮。

### 4.2 状态管理 (Zustand)

使用 Zustand 构建分层状态库，重点增强了翻译管理：

- **Translation Store (`useTranslationStore`)**:
  - **Translations Map**: `Record<string, Entity[] | null>`，支持 `null` 状态以表示用户主动隐藏翻译。
  - **Settings**: 管理分隔符模板、API Key、模型选择等配置。
  - **Actions**: 提供 `setTranslation` (深层更新)、`deleteTemplate` (智能回退) 等业务逻辑。

### 4.3 实体解析与保护 (Entity Parsing)

为了在翻译过程中保留推文格式：

1.  **Serialization**: 将推文文本中的 URL、Mention、Tag 替换为占位符 (e.g., `[[URL0]]`)。
2.  **Translation**: 发送带占位符的文本至 Gemini AI。
3.  **Restoration**: 将翻译结果中的占位符还原为原始 Entity 对象。

---

## 5. 基础设施依赖

- **Database**: PostgreSQL (存储 JSON Document 及关系型 User Entity)。
- **AI Engine**: Google Gemini API (通过 Vercel AI SDK 调用)。
- **Headless Browser**: Puppeteer (服务端运行，支持 Vercel Serverless 环境适配)。
- **Upstream**: Twitter Private API (GraphQL endpoints via Guest/Auth)。