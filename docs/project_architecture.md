# Anon Tweet 架构设计文档

## 1. 架构概览

项目采用 **React Router v7** 作为全栈框架，构建了一个 **BFF (Backend for Frontend)** 架构。前端主要负责视图交互与状态管理，后端 API 路由负责数据聚合、缓存策略及第三方 API 代理。

核心设计哲学：**读写分离，动静分离**。
- **静态数据**：推特原文内容，一旦抓取，视为不可变数据，存入 Document-style 表。
- **动态数据**：用户的翻译、Tag 高亮等，视为可变数据，存入关联表。

---

## 2. Data Loading (数据获取与组装)

数据获取并非简单的单条记录查询，而是包含**递归抓取**和**运行时合并**的复杂流程。

### 2.1 线程化抓取策略 (Thread Resolution)
位于 `app/lib/getTweet.ts`。系统不仅获取目标推文，还会尝试还原对话上下文：
1.  **Fetch Loop**: 从目标 ID 开始。
2.  **Upward Traversal**: 检查 `in_reply_to_status_id_str`，递归获取父推文。
3.  **Downward Traversal**: 检查 `quoted_tweet_id`，获取引用推文。
4.  **Sorting**: 最终返回按 ID 排序的推文数组（`TweetData`），确保前端渲染顺序正确。

### 2.2 混合数据源与合并 (Hybrid Source & Merge)
位于 `app/routes/api/tweet/get.ts`。

1.  **Level 1: DB Cache (Raw)**
    - 查询 `tweet` 表。该表本质是一个 **Document Store**，通过 `jsonContent` 字段存储完整的 `EnrichedTweet` JSON 对象。
    - **Cache Miss**: 若数据库无记录，调用 `rettiwt-api` (Forked) 从 Twitter 逆向接口抓取，并**Write-Back** 写入数据库。

2.  **Level 2: User Layer (Translation)**
    - 查询 `tweet_entities` 表。根据 `tweetId` + `userId` 查找当前用户的编辑记录。
    - **Runtime Merge**: 服务端在返回数据前，动态将 DB 中的 `translation` 字段注入到原始 `jsonContent.entities` 中。
    - **优势**: 这种“非破坏性编辑”设计确保了原始推文数据的纯净，允许多个用户对同一推文有不同的翻译版本。

---

## 3. Client State Management (客户端状态)

位于 `app/lib/stores/translation.ts`。客户端使用 **Zustand** 进行复杂状态管理，而非仅仅依赖 React Context。

### 3.1 Store 结构
- **Settings Domain**: 翻译模板、分隔符样式。使用 `persist` 中间件持久化到 localStorage。
- **Data Domain**: 当前推文列表、主推文对象。**不持久化**，每次导航重置。
- **Translation Map**: `Record<string, Entity[]>`。用于快速索引和更新 UI。

### 3.2 初始化与同步
1.  **Hydration**: 当 `clientLoader` 数据返回时，组件调用 `setAllTweets`。
2.  **Extraction**: Store 自动遍历所有推文的 `entities`，提取其中包含 `translation` 字段的实体，填充到 `translations` Map 中。
3.  **Optimistic UI**: 用户编辑翻译时，直接更新 Store 中的 Map 和 Tweet 对象，实现无延迟的预览效果。

---

## 4. Mutations (数据变更)

数据写入操作遵循 **Action Pattern**，确保原子性和一致性。

### 核心流程
1.  **Endpoint**: `POST /api/tweet/set`
2.  **Payload**: 仅提交被修改的 `entities` 数组，而非整条推文。
3.  **Schema Enforcement**: 
    - 数据库表 `tweet_entities` 使用复合键逻辑：`tweetUserId` (文本字段, 格式为 `${tweetId}-${userId}`)。
    - 使用 `ON CONFLICT DO UPDATE` 策略，实现“存在即更新，不存在即插入”。
    - **关联性**: `translatedBy` 字段外键关联到 `user` 表（尽管目前 User 为 Mock）。

---

## 5. Auth & Session (认证与会话)

**⚠️ 当前状态: Development / Mocked**

虽然数据库 Schema (`app/lib/database/schema.ts`) 中完整定义了 `user`, `session`, `account` 等 `better-auth` 标准表结构，但运行时逻辑已被短路。

### 5.1 数据库模型
- **User**: 包含 `id`, `email`, `image`, `role` 等标准字段。
- **Tweet Entites Relation**: `tweet_entities.translatedBy` -> `user.id`。

### 5.2 中间件短路 (`auth-guard.ts`)
- `requireAuth` 中间件构造了一个静态的 `anonUser` 对象。
- 系统中所有的写操作（Translation Save）目前都挂载在这个虚拟的匿名用户 ID 下。
- **生产环境准备**: 代码结构已就绪，只需取消 `serverAuth.api.getSession` 的注释并配置 OAuth Provider 即可启用真实认证。

---

## 6. Routing Strategy (路由策略)

基于 **React Router v7** 的 Route Config 模式。

### Client Loader vs Server Loader
项目采用了 **SPA 优先** 的加载策略：
- **UI Routes (`routes/tweet.tsx`)**: 仅使用 `clientLoader`。
    - 这意味着路由跳转完全在客户端发生，立即响应交互。
    - 数据获取通过 `axios` 异步请求 API。
    - 配合 `Suspense` + `Skeleton` 提供流畅的用户体验。
- **API Routes (`routes/api/*`)**: 使用 Server `loader`/`action`。
    - 充当微服务网关，处理与数据库和第三方服务的交互。
    - 这种分离使得前端 UI 与后端逻辑解耦，便于独立维护。
