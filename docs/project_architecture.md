```md D:/git/anonTweet/docs/project_architecture.md
# Anon Tweet 架构设计文档 v2.0

## 1. 架构总览 (System Architecture)

本项目采用 **React Router v7** 构建全栈应用，遵循 **BFF (Backend for Frontend)** 设计模式。系统明确划分为表现层（Presentation Layer）、API 聚合层（BFF Layer）与领域服务层（Domain Service Layer）。

- **运行时 (Runtime)**: Bun (高性能 JavaScript 运行时)
- **全栈框架 (Framework)**: React Router v7 (SSR + CSR Hybrid)
- **数据持久化 (Persistence)**: PostgreSQL (Neon Serverless) + Drizzle ORM
- **状态管理 (State Management)**: Zustand (Client) + React Router Loaders (Server/Network)

核心设计原则遵循 **关注点分离 (SoC)** 与 **读写分离**：

- **API 路由**：承担网关角色，负责数据聚合、权限校验、第三方服务代理及缓存策略。
- **UI 路由**：采用 SPA (Single Page Application) 优先策略，通过 Client Loader 异步请求 API，确保交互的瞬时响应性。

---

## 2. API 接口设计与路由策略 (API Layer)

API 层作为 BFF，主要负责将异构数据源（Database, Twitter Private API, S3, Bilibili API）标准化为前端可消费的 JSON 格式。

### 2.1 Tweet Domain (`/api/tweet/*`)

核心推文数据的获取、处理与状态变更。

- **`GET /api/tweet/get/:id`**
  - **Handler**: `app/routes/api/tweet/get.ts`
  - **逻辑**: 这是一个复合查询接口。它不仅获取指定 ID 的推文，还会触发 **递归上下文解析 (Recursive Context Resolution)** 逻辑。
    1.  解析 URL 参数提取 `tweetId`。
    2.  调用 `getTweets` 服务，该服务会向上查找父推文（Parent Chain），向下查找引用推文（Quoted Tweet）。
    3.  优先读取 DB 缓存，Cache Miss 时回源抓取并 Write-Back。
  - **返回**: `TweetData` (按时间线排序的推文数组)。

- **`POST /api/tweet/set`**
  - **Handler**: `app/routes/api/tweet/set.ts`
  - **逻辑**: 处理用户对推文的“富化”操作（如翻译、笔记）。
  - **机制**: 接收 `entities` 数据包，使用 `ON CONFLICT DO UPDATE` 策略写入 `tweet_entities` 表。支持批量更新，保证原子性。

- **`GET /api/tweet/list/:id`**
  - **Handler**: `app/routes/api/tweet/list.ts`
  - **逻辑**: 对 Twitter List 功能的封装。调用 `fetchListTweets` 获取原始数据，并应用 `enrichTweet` 进行数据清洗和标准化，剔除冗余字段，适配前端组件。

- **`GET /api/tweet/image/:id`**
  - **Handler**: `app/routes/api/tweet/image.ts`
  - **逻辑**: 服务端渲染 (SSR) 转图片的生成服务。
  - **实现**: 启动 Headless Browser (Puppeteer/Chromium)，渲染特定推文快照，返回 `image/png` 流。该接口通常用于跨平台分享或元数据预览。

### 2.2 User Domain (`/api/user/*`)

用户画像与时间线数据的聚合。

- **`GET /api/user/get/:username`**
  - **Handler**: `app/routes/api/user/get.ts`
  - **逻辑**: 获取用户基础元数据（头像、Banner、简介等）。优先查库，失败则回源。

- **`GET /api/user/timeline/:username`**
  - **Handler**: `app/routes/api/user/timeline.ts`
  - **逻辑**: 获取指定用户的推文时间线。包含 `enrichTweet` 处理流程，确保返回结构与单条推文详情页一致。

### 2.3 Integration Domain

外部平台集成服务。

- **`POST /api/bili-post`**
  - **Handler**: `app/routes/api/bili-post.tsx`
  - **逻辑**: Bilibili 动态发布代理。
  - **流程**:
    1.  接收多部分表单数据 (Multipart FormData)，包含文本与图片文件。
    2.  从 Payload 或 DB 中提取用户凭证 (Cookie)。
    3.  **并发上传**: 将图片并发上传至 Bilibili 图床服务 (`/x/dynamic/feed/draw/upload_bfs`)。
    4.  **元数据组装**: 构造符合 Bilibili 协议的复杂 JSON Payload（包含 `raw_text`, `pics`, `upload_id` 等）。
    5.  **发布**: 调用动态创建接口，完成跨平台发布。
  - 缺陷：发布者的ip目前只能跟随着服务器ip，没法改变，致使平台上所有用户都用同一个ip发布动态

---

## 3. 数据流与服务层 (Data Flow & Services)

### 3.1 混合数据源策略 (Hybrid Data Source)

系统采用 **Write-Through Cache** 变体策略。

1.  **Level 1: Database (Cache)**
    - 作为主要读取源。存储结构化 JSON 数据 (`EnrichedTweet`)。
    - **User Metadata**: `tweet_entities` 表存储用户生成的翻译、标注等动态数据，与原始推文解耦。

2.  **Level 2: Upstream API (Source of Truth)**
    - 基于 `rettiwt-api` (Forked) 的逆向工程接口。
    - 仅在 DB Cache Miss 时调用，获取后立即通过 Write-Back 机制存入数据库。

### 3.2 运行时数据合并 (Runtime Injection)

在数据返回前端之前，服务端会执行“数据富化”过程：

- 读取 `tweet` 表获取原始推文。
- 读取 `tweet_entities` 表获取翻译内容。
- **Merge**: 将翻译内容动态注入到 `jsonContent.entities` 节点中。此过程在内存中完成，不修改原始推文记录。

---

## 4. 客户端架构 (Client-Side Architecture)

### 4.1 SPA 路由加载机制

前端采用 **Render-as-you-fetch** 模式的变体。

- **Client Loader (`clientLoader`)**:
  - UI 路由（如 `/tweets/:id`）仅定义 `clientLoader`。
  - 通过 `axios` 发起对本域 API 的异步请求。
  - 这种设计避免了传统 SSR 的 TTFB (Time to First Byte) 阻塞问题，允许前端先渲染骨架屏 (Skeleton)，提升感官性能。
  - **Redirection**: 在客户端处理重定向逻辑（例如检测到当前 ID 为 Retweet 时，自动跳转至源推文 ID）。

### 4.2 状态管理 (Zustand)

使用 Zustand 构建分层状态库：

- **Ephemeral State (短暂状态)**:
  - `tweets`: 当前视图的推文列表。每次路由切换时，通过 `useEffect` 监听 `loaderData` 变化并重置。
  - `translations`: 翻译内容的索引 Map (`Record<string, Entity[]>`)。用于 O(1) 复杂度的查找与更新。
- **Persistent State (持久状态)**:
  - 用户偏好设置（如翻译语言、显示风格），通过中间件持久化至 `localStorage`。

### 4.3 乐观 UI 更新 (Optimistic UI)

在用户提交翻译 (`POST /api/tweet/set`) 时：

1.  **立即突变**: 直接更新 Zustand Store 中的本地数据，UI 即刻反映变化。
2.  **后台同步**: 异步发送网络请求。若请求失败，则回滚状态并提示错误。

---

## 5. 基础设施依赖

- **Database**: PostgreSQL (用于存储 JSON Document 及关系型 User Entity)。
- **Object Storage**: S3 兼容协议 (用于存储生成的图片、媒体资源)。
- **Headless Browser**: Puppeteer (运行于服务端，用于高保真截图生成)。
- **Upstream**: Twitter Private API (GraphQL endpoints via Guest Auth)。
```
