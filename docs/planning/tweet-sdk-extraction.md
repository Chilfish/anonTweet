# 推文 SDK 抽离方案（core + react）

> 状态：方案待评审（2026-11-18）
> 目标产物：`@chilfish/tweet`（core `"."` / `"./node"` / `"./react"`）
> 关联：`app/lib/rettiwt-api`、`app/lib/react-tweet`、`app/components/tweet`、[ADR-010](architecture.md)、[postmortem 013](../postmortem/013-upstream-frontend-drift.md) / [014](../postmortem/014-upstream-contract-drift.md)

## 1. 要解决的问题

同一份 X 逆向实现现在有三处活体：

| 位置 | 性质 |
| --- | --- |
| 上游 `Rishikant181/Rettiwt-API` | 原始来源，节奏与我们无关 |
| `I:\dev\tweets-viewer\packages\rettiwt-api` | workspace 私有包，端点多、有测试与 proxy |
| `app/lib/rettiwt-api`（本仓库） | 内嵌副本，Workers 适配、jetfuel、Article、成熟 Pool |

三方的定制已经互相不可合并：

- **同一 bug 修两遍**：client transaction id 在外壳请求漏带 cookie 上，两侧各自修了一次（本仓库 `3ecfc46` / `e289f96`，viewer `c34f23b`）。
- **能力各缺一半**：本仓库有 Workers 适配与 jetfuel / Article，viewer 有 proxy、类型化错误、`TwitterAPIClient` 分层、fixtures。
- **本仓库这份没有 lint 保护**：`eslint.config.mjs` 里 `ignores: ['**/app/lib/rettiwt-api/**']`，它已经是一块飞地。

结论：把「X 取数 + 解析富化」和「推文展示组件」收敛成 npm 包，两个站点都退化为消费者，只保留业务插槽。

## 2. 现状审计（实测数据）

### 2.1 核心库

| 指标 | 本仓库 `app/lib/rettiwt-api` | `tweets-viewer/packages/rettiwt-api` |
| --- | --- | --- |
| 文件数 | 148 | 197 |
| TS 行数 | 32,778 | 37,642 |
| 独有文件 | **0**（是 viewer 的子集） | 49 |
| 同路径但内容不同 | **35** | 35 |

viewer 独有的 49 个文件里，值得吸收的是 `helper/{parseTweet,entitytParser,RettiwtPool,space,date-utils}.ts`、`services/public/{TwitterAPIClient,TweetEnrichmentService,SpaceService}.ts`、`types/enriched/*`、`types/raw/{space,user,tweet}/*` 的增量端点、`__tests__/`。

本仓库独有（在 35 个差异文件内）的是：Workers 化（`axios.server` fetch adapter、去掉 `node:https` 依赖路径）、`parsers/jetfuel.ts`、`collections/Groups.ts` 的 guest 搜索放行、`models/data/User.ts` 的置顶推文缺失修复、`types/raw/tweet/Details.ts` 的 Article 字段、`SmartPool`（per-key 冷却 / 指数退避 / inFlight）。

**合并基线取 viewer 骨架**（分层更干净、端点更全、有测试），把本仓库的能力按文件逐个移植，不盲选一边。

### 2.2 平台耦合点（抽包必须先解掉）

| 耦合 | 位置 | 处理 |
| --- | --- | --- |
| `node:https` Agent | `models/RettiwtConfig.ts` | 移入 `./node`，core 只接受注入的 `dispatcher` |
| `node:querystring` | `requests/User.ts`、`requests/DirectMessage.ts` | 换 `URLSearchParams` |
| `node:fs` | `requests/Media.ts`、`services/public/TweetService.ts` | 上传改 `Blob` / `Uint8Array`，读盘移入 `./node` |
| `Buffer` | `services/internal/AuthService.ts`（base64） | 换 `atob` / `btoa` 或 `Uint8Array` 实现 |
| `process.env` | `app/lib/SmartPool.ts` | Pool 只收 `keys` 与注入配置 |
| `~/lib/axios.server` | `FetcherService.ts`、`AuthService.ts` | 由方案 §4.1 的 `HttpClient` 取代 |
| `~/types` | `parsers/jetfuel.ts` | 类型随包搬迁（`TrendingCardInfo` 进 core 类型） |
| axios 全形态 | `AxiosRequestConfig` / `AxiosError` / `AxiosHeaders` | 见 §4.1 / §4.2 |

### 2.3 UI 层

| 位置 | 文件数 | 行数 | 状态 |
| --- | --- | --- | --- |
| `app/lib/react-tweet`（react-tweet fork，MIT） | 25 | 2,829 | 展示组件 + 解析工具混在一起 |
| `app/components/tweet` | 20 | 2,638 | 展示 + 产品逻辑混在一起 |
| `app/types`（推文相关子集，`article`/`card`/`entities`/`media`/`photo`/`poll`/`space`/`tweet`/`user`/`video`） | 10 | 485 | 需随 core 走 |

`app/components/tweet` 的 `~/` 依赖分布（实测）：每个组件 1–9 处，集中在 `~/lib/stores/*`（translation / appConfig）、`~/components/ui/*`、`~/hooks/*`、`react-router`、`~/lib/media-url`。

按可复用性可分三类：

| 类别 | 组件 | 结论 |
| --- | --- | --- |
| 纯展示 | `TweetHeader` / `TweetTextBody` / `TweetMediaAlt` / `TweetCard` / `TweetArticleCard` / `PollCard` / `TrendingCard` / `CarouselCard` / `TweetSpaceCard` / `ThreadLine`，以及 `react-tweet/twitter-theme/*` | 进 `./react` |
| 需注入的容器 | `TweetNode`（插槽：翻译编辑器 / vision 块 / 媒体配置）、`MyTweet`（线程 + 评论组织） | 进 `./react`，但去掉 store 依赖，改 props / context |
| 产品逻辑 | `TweetOptionsMenu`（截图/设置）、`TweetInputForm`（分享/设置）、`AIVisionBlock`、`CommentBranch`、`SelectableTweetWrapper`、`FilterUnrelatedToggle`、`PlainTweet` | **留在 app**，用包内组件拼装 |

## 3. 目标产物

单仓单包、多入口，工程形态对齐 `@chilfish/gallery-dl-instagram`：

```
@chilfish/tweet
├── .                  core：Resource / Transport / Pool / Parse / Enrich / Types（平台无关）
├── ./node             Node 适配：proxy dispatcher、fs 读盘上传、env 便捷工厂
├── ./react            React 组件（react 为 optional peer）
├── ./react/styles.css 组件必需的最小样式契约
└── ./package.json
```

- 构建：`tsdown`，`format: ['esm','cjs']`、`dts: true`、`platform: 'neutral'`、`deps.neverBundle: [/^node:/]`、`exports: true`。
- 发布：tag `v*` 触发 `.github/workflows/publish.yml`，OIDC Trusted Publisher + `--provenance`，前置校验 tag ↔ `package.json.version` ↔ CHANGELOG 条目。
- 版本：`0.x` 阶段 API 可破；两站点用 **exact version** 锁定，回滚只改一个数字。
- 许可证：MIT。`NOTICE` 保留 Rettiwt-API（MIT，6.2.0）与 react-tweet（MIT，Luis Alvarez）的原始 copyright；`packages/rettiwt-api` 现有 `package.json` 写 `ISC` 与 `LICENSE` 的 MIT 自相矛盾，新包统一为 MIT。

### 3.1 导出面（初版）

```ts
// "@chilfish/tweet"
export { TwitterClient } from './client'        // 门面：tweet / user / space / list
export { RettiwtPool } from './pool'
export { TwitterApiError, RateLimitError, AuthError, NotFoundError } from './errors'
export { ResourceType, TweetRepliesSortType } from './enums'
export { enrichTweet, getEntities, mapPollCard, mapArticle, parseTrendingCard, mapSpaceDetails } from './parse'
export { normalizeMediaUrl, normalizeProfileImageUrl } from './media-url'
export type { EnrichedTweet, RawTweet, TweetData, Entity, TweetPoll, SpaceDetails, TweetArticle, LinkPreviewCard } from './types'

// "@chilfish/tweet/node"
export { createNodeClient } from './node/client'   // { keys, proxy, cookie, timeout, logger }

// "@chilfish/tweet/react"
export { TweetProvider, TweetBody, TweetHeader, TweetMedia, TweetContainer, TweetNotFound, TweetSkeleton, VerifiedBadge, TweetNode, TweetThread, TweetLinkCard, TweetArticleCard, PollCardView, TrendingCardView, CarouselCardView, TweetSpaceCard, TweetMediaAlt, ThreadLine }
```

`Rettiwt` 旧门面类**不导出**：它绑定 `RettiwtConfig` 与 axios 形态，保留只会把旧耦合带回来。需要低层控制时用 `FetcherService` + `ResourceType`（viewer 的 `TwitterAPIClient` 就是这层）。

## 4. 核心层设计

### 4.1 HTTP：fetch + 可注入客户端

```ts
export interface HttpClient {
  request: <T>(req: {
    url: string
    method?: string
    headers?: Record<string, string>
    body?: BodyInit | Uint8Array
    timeout?: number
    signal?: AbortSignal
  }) => Promise<{ status: number; headers: Headers; data: T }>
}
```

- 默认实现用全局 `fetch`（Workers / Deno / Bun / 浏览器 / Node 18+ 全通），删除 `app/lib/axios.server.ts` 的 adapter 补丁。
- resource builder 从「返回 `AxiosRequestConfig`」改为「返回中立的 `HttpRequest` 描述」，`collections/Requests.ts` 的类型随之改名。
- `AuthCredential.toHeader()` 从 `AxiosHeaders` 改为 `Record<string, string>`。
- 超时用 `AbortSignal.timeout()`；重试逻辑保持在 `FetcherService`。

### 4.2 错误模型

```ts
class TwitterApiError extends Error { status?: number; code?: number; resource?: ResourceType }
class RateLimitError extends TwitterApiError {}  // 429
class AuthError extends TwitterApiError {}       // 401 / 403
class NotFoundError extends TwitterApiError {}   // 404 / TweetTombstone
```

- `RettiwtPool` 的分类器直接读 `error.status`，不再猜 `error?.response?.status ?? error?.status ?? error?.statusCode`。
- 替换 `models/errors/TwitterError.ts` 与 `services/internal/ErrorService.ts`；`errorHandler` 配置项保留为可选钩子。

### 4.3 Pool

以本仓库 `app/lib/SmartPool.ts`（251 行，per-key 冷却 / 指数退避 / inFlight 负载均衡 / 可注入分类器）为唯一实现，吸收 viewer 的类型化错误：

```ts
new RettiwtPool(keys, {
  proxy,                  // 仅 ./node 生效，core 里传 dispatcher
  cooldownMs, backoffMs, maxAttempts,
  shouldRetry,            // (error) => boolean | { retryable, cooldown }
  createFetcher,          // 测试注入
  logger,                 // 取代 obsLog / console.warn
})
```

`process.env.http_proxy` 读取移入 `createNodeClient`，core 里不碰 `process`。

### 4.4 解析与富化

`app/lib/react-tweet/utils/*` 的纯函数（`parseTweet` 569 行、`entitytParser` 362 行、`poll` 209、`space` 295、`article` 131、`organizeTweets` 177、`date-utils` 75）整体进 core：

- 依赖只有 `~/types`、`normalizeMediaUrl`、`obsLog`、`parseTrendingCard` → 前两个随包搬，日志改注入 `logger`，jetfuel 已在包内。
- `get-tweet.ts`（359 行，含 `twitterPool` 单例与 `process.env.TWEET_KEYS`）**不进包**：它属于应用装配，改写为包外 `app/lib/twitter.ts`，用 `createNodeClient` / `TwitterClient` 组合。
- `mapSpaceDetails` / `resolveSpaceId` 进 core（viewer 已这么分）。

富化层进 core 的理由：viewer 那份已经把 `parseTweet` + `EnrichedTweet` 放进包并导出，两站点都需要同一份 `EnrichedTweet` 定义——它是 core 与 `./react` 之间的真正契约。

## 5. UI 层设计

### 5.1 注入点

组件不再 `import '~/lib/stores/*'`，改用一层 context：

```tsx
<TweetProvider
  link={({ href, children }) => <a href={href}>{children}</a>}   // 默认 <a>，app 传 react-router Link
  media={{ url: (u, isVideo) => proxy(u), Image: MediaImage, Skeleton: Skeleton }}
  onMediaClick={(index) => {}}
  slots={{ headerActions: <TranslationEditor />, afterMedia: <AIVisionBlock />, footer: <TweetOptionsMenu /> }}
>
  <TweetNode tweet={tweet} variant="main" />
</TweetProvider>
```

- 默认值全部是零依赖实现（`<a>` / `<img>` / `undefined`），不注入也能跑。
- `TweetNode` 的翻译/vision/截图入口全部走 `slots`，包内不含任何语言、AI、截图代码。
- `MyTweet` 改名为 `TweetThread`：只做 `organizeTweets`（进 core）+ 线程连线，评论区渲染交给 `slots.comments`。

### 5.2 样式契约

- 组件保留 Tailwind 语义 class（`bg-card` / `text-muted-foreground` / `border-border` 等），`styles.css` 只声明少量自定义变量（`--tweet-*`）与 `tweet-loaded` / `tweet-body` 等结构性 class。
- 硬编码的 X 官方灰阶（`#536471` / `#71767b` / `#cfd9de` / `#333639`）收敛为 token，与 `docs/ui-design/README.md` 的语义色规范一致。

## 6. 搬迁矩阵

| 内容 | 来源 | 去向 |
| --- | --- | --- |
| resource / transport / auth | viewer 骨架 | `lib/` |
| jetfuel、Article、guest 搜索放行、置顶推文修复 | 本仓库 | `lib/` |
| `SmartPool` → `RettiwtPool` | 本仓库 + viewer 错误类型 | `lib/pool/` |
| `parseTweet` / `entitytParser` / `poll` / `space` / `article` / `organizeTweets` | 本仓库（更全）+ viewer 的 `types/enriched` | `lib/parse/` |
| `normalizeMediaUrl` / `normalizeProfileImageUrl` | 本仓库 `app/lib/media-url.ts` | `lib/media-url.ts` |
| proxy（http/https/socks） | viewer | `node/` |
| user 端点增量（about / search / settings / history / media update） | viewer | `lib/` |
| fixtures + `__tests__` | viewer | `test/` |
| `twitter-theme/*` + 10 个展示组件 + `TweetNode` / `TweetThread` | 本仓库 UI（更新） | `react/` |

## 7. 迁移步骤

**Phase 0 — 建包（阻塞后续）**

1. 新建仓库 `Chilfish/tweet-sdk`，`bun init` + tsdown + eslint（`@antfu/eslint-config`）+ vitest + lefthook，CI/publish 抄 `gallery-dl-ins` 的 `.github/workflows/`。
2. 按 §6 搬迁并解掉 §2.2 全部耦合；`tsc --noEmit` 与 `tsdown build` 双平台（neutral + node）都过。
3. 补 fixture 与解析单测（本仓库 12 个 rettiwt 相关 spec + viewer `__tests__` 合流）。

**Phase 1 — 本仓库切换**

1. `bun add @chilfish/tweet@<exact>`。
2. 新增 `app/lib/twitter.ts`：用 `createNodeClient`（Workers 下用注入 fetch 的 `TwitterClient`）装配单例，保留 `fetchTweet` / `fetchReplies` / `fetchSearchTweets` 等函数签名，内部换实现。
3. 删除 `app/lib/rettiwt-api` 与 `app/lib/SmartPool.ts`，`eslint.config.mjs` 移除 ignore 条目。
4. 改 16 个引用文件（`app/lib/article/parse.ts`、`app/lib/SmartPool.ts`、`app/types/index.ts`、`scripts/tmp-dump-article.ts`，以及 12 个测试）；另 `app/lib/react-tweet/utils/{get-tweet,parseTweet,space,article}.ts` 与 `app/lib/obs-log.ts` 的 `pool.*` 事件随 §4.4 搬迁一并调整。
5. 门禁：`bun run typecheck` → `bun run test` → `bun run verify/index.ts --exit-on-fail` → `bun run build` 全绿；用真实 `TWEET_KEYS` 手测 `get` / `search` / `replies` / Space / Article 五条链路。

**Phase 2 — tweets-viewer 切换**

删 `packages/rettiwt-api`，改依赖 npm 包；`apps/web-react` 与 `apps/server` 的 import 前缀由 `@tweets-viewer/rettiwt-api` 改为 `@chilfish/tweet`。

**Phase 3 — UI 抽离**

1. `./react` 先只出纯展示组件 + `TweetProvider`，`PeerDependenciesMeta.react.optional`。
2. 本仓库 `TweetNode` / `MyTweet` 改写为「包组件 + 插槽」，产品逻辑留 app；`app/lib/react-tweet` 删除。
3. Storybook 用例随组件迁移（`app/stories/TweetCompoments.stories.tsx` 拆到包仓）。
4. 门禁：`bun run build-storybook`、截图路由 `/plain-tweet/:id` 逐项比对（AC-SHOT-001~004）。

**Phase 4 — 上游跟踪**

包内建 fixture 形态快照（对应 postmortem 014 的预防项）与月度真实探针 workflow；`x-client-transaction-id` 的外壳探测逻辑进包，单点维护。

## 8. 验证与门禁

| 层 | 手段 |
| --- | --- |
| 包内单测 | 解析器 fixture 回归、`Requests` 描述符快照、Pool 故障转移（冷却/退避/耗尽） |
| 包内集成 | 可选真实 key 的 `describe.skipIf` 用例（沿用验证套件的 SKIP 语义） |
| 消费者门禁 | 本仓库 `verify/` 全三层 + `tweets-viewer` 的 `test` 与 `test:visual` |
| 发布前 | tag ↔ version ↔ CHANGELOG 三向校验；`npm publish --provenance` |

`verify/` 的 AC 编号契约不变：AC-TWEET-*/AC-CARD-*/AC-SPACE-* 仍在本仓库，只是被测实现换成了包。

## 9. 风险

| 风险 | 说明 | 缓解 |
| --- | --- | --- |
| 单点故障 | 包坏了两站一起坏 | exact version 锁 + 回滚只改版本号；发布前消费者冒烟 |
| Workers 兼容 | `x-client-transaction-id` + linkedom 在新运行时下的行为 | 包 CI 加 Workers 环境冒烟（miniflare），`tidProvider` 可注入 |
| 上游继续漂移 | 逆向契约无版本 | fixture 快照 + 月度探针（postmortem 013/014 预防项落地） |
| UI 抽取回归 | 插槽改造触碰截图与翻译呈现 | 分两步：先纯展示组件，再容器；截图 AC 作为硬门禁 |
| 许可证归属 | fork 的 relicense 风险 | 保留 MIT + NOTICE，不改上游 copyright |

## 10. 待决问题

1. 包名：`@chilfish/tweet`（npm 已确认可用）vs `@chilfish/tweet-sdk`。
2. 是否同时发一个 `./cli`（`rettiwt` 风格命令行）。当前两站点都不用 CLI，倾向不发。
3. `EnrichedTweet` 的字段命名：本仓库用 `id_str` / `quotedTweet` / `isInlineMeida`（拼写错误），viewer 用 `id` / `quoted_tweet` / `is_inline_media`。抽包是同一次机会，建议在 `0.1.0` 定为 `id` / `quotedTweet` / `isInlineMedia`，两站点适配一次。
4. 本仓库是否保留 `app/lib/react-tweet/utils/get-tweet.ts` 的单例形态（`twitterPool`），还是改成显式 `TwitterClient` 注入。
