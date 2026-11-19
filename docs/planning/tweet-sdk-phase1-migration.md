# Phase 1：切换到 `@chilfish/tweet`（数据层）

> 状态：**Phase 1 已完成**（2026-11-19，代码门禁全绿；真实 Key 手测待执行）
> 上游版本：`@chilfish/tweet@0.2.2`（npm `latest`，2026-11-19）
> 关联：[tweet-sdk-extraction.md](./tweet-sdk-extraction.md)、[ADR-010](./architecture.md)、[issue #1](https://github.com/Chilfish/tweet-sdk/issues/1)、[issue #3](https://github.com/Chilfish/tweet-sdk/issues/3)、[issue #4](https://github.com/Chilfish/tweet-sdk/issues/4)（fieldToggles 缺口）
> 范围：**只做 core 数据层与解析富化**；`./react` 组件留给 Phase 3。

---

## 1. 目标与不变量

### 1.1 目标

把「X 取数 + 解析富化」从内嵌副本切换为 npm 包，本仓库只保留装配与业务插槽：

- 删除 `app/lib/rettiwt-api`（148 文件 / 32,778 行）与 `app/lib/SmartPool.ts`。
- 删除 `app/lib/react-tweet/utils` 中已进包的 7 个解析文件。
- 新增 `app/lib/twitter.server.ts` 装配层，保留现有业务函数签名。
- `EnrichedTweet` / `RawTweet` / 解析类型以包为唯一数据源；app 只扩展 `autoTranslationEntities` / `visionInfo`。

### 1.2 不变量（不得回归）

- 对外路由与 API 响应形状不变（内部类型改名不算接口变更）。
- 三层缓存继续工作：`localCache → DB → 上游`；旧缓存回填（Space / Article / Card）保留。
- Workers 运行时不变：`fetch` + `linkedom` + `x-client-transaction-id`；不引入 `node:*` 运行时代码。
- UI 交互、Storybook、截图 AC 不回归。
- 门禁全绿：`typecheck` → `eslint .` → `test` → `verify --exit-on-fail` → `build` → `build-storybook`。

---

## 2. 上游契约（0.2.2 实测）

| 入口                        | 本仓库用到的符号                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@chilfish/tweet`           | `TwitterClient` / `createClient` / `RettiwtPool` / `PoolKeyStatus`；`enrichTweet` / `getEntities` / `getMediaAltEntities` / `serializeForAI` / `restoreEntities` / `applyAITranslations`；`mapArticle` / `parseContentState` / `mediaFromRaw` / `normalizeEntityMap` / `collectEmbeddedTweetIds` / `derivePlainText`；`mapTwitterCard` / `mapPollCard` / `mapSpaceDetails` / `attachSpaceDetails` / `resolveSpaceId` / `isSpaceUrl` / `extractSpaceIdFromUrl`；`organizeTweets` / `parseTrendingCard`；`formatDate`；`normalizeMediaUrl` / `normalizeProfileImageUrl`；`TwitterApiError` 家族；`Logger` |
| `@chilfish/tweet/internals` | `RawTweet` 之外的 raw response 类型、`IListTweetsResponse`、`IRawSpace` / `ISpaceDetailsResponse`、`RawArticle*`；`Extractors` / `findByFilter` / `Requests` / `TweetRequests` / `SpaceRequests` / `ListRequests` / `UserRequests` / `MediaRequests` / `TweetFilter`；`UserDetails`（class）/ `UserData`（结构）                                                                                                                                                                                                                                                                                        |
| `@chilfish/tweet/node`      | **不使用**（Workers；proxy / fs 不需要）                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

关键行为（0.2.2 已确认）：

- `createClient({ keys: string })` 按逗号拆分，与 `TWEET_KEYS` 语义一致。
- `NotSupportedError` 默认 `status: 403`；`PoolExhaustedError` 保留真实 status（网络错误不伪造 401）。
- 默认分类器：`429/401/403` 轮换 + 冷却；`408/425/5xx` 重试不冷却。
- `RettiwtPool.status()` 返回 per-key 状态。
- `Logger` 为 `{ warn?(event, fields) }`，`pool.rotate` 字段含 `keySuffix`。
- 版本锁定 **exact 0.2.2**；升级前先跑本仓库门禁。
- `TweetRequests.details` / `replies` 已带 Article `fieldToggles`（`withArticleRichContentState` + `withArticlePlainText`）；0.2.2 起不再需要 app 侧补丁。

---

## 3. 现状审计（2026-11-19 实测）

### 3.1 引用面

| 类别                                                              | 数量    | 位置                                                                                                                                                                                                             |
| ----------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 直接 import `~/lib/rettiwt-api` / `~/lib/SmartPool`               | 20 文件 | `app/types/index.ts`、`app/lib/react-tweet/utils/{get-tweet,parseTweet,space,article}.ts`、`app/lib/article/parse.ts`、`app/lib/SmartPool.ts`、`scripts/tmp-dump-article.ts`、`test/unit/*`、`test/acceptance/*` |
| import `~/lib/react-tweet/utils`                                  | 30 文件 | UI 组件、routes、service、hooks、stories、tests、scripts                                                                                                                                                         |
| `id_str` 命中                                                     | 89 文件 | 约 30 个在待删 vendor 内；剩余含 raw fixture（保留）与 enriched 读取（改）                                                                                                                                       |
| 旧字段 `isInlineMeida` / `quoted_tweet_id` / `retweetedOrignalId` | 14 文件 | routes / components / service / stores / tests                                                                                                                                                                   |
| `~/lib/media-url` import                                          | 16 文件 | 改 re-export 即可                                                                                                                                                                                                |

### 3.2 `RawUser` 语义修正（重要）

现状：`app/types/index.ts` 把 `RawUser` 定义成 vendor 的 raw `IUser`，但 `fetchUserDetails` 实际返回 `Extractors` 产出的 `User` model（`userName` / `fullName` / `profileImage` / `followersCount` …）。

- 受影响：`app/lib/database/schema.ts:62`（`json('user').$type<RawUser>()`）、`app/lib/service/getUser.server.ts`、`app/components/profile/ProfileCard.tsx`、`app/routes/user.tsx`、`app/lib/llms.ts`（OpenAPI `RawUser` schema）。
- 结论：`RawUser` 改为 `UserData`（`@chilfish/tweet/internals` 的结构接口）。现有 DB 行与 `llms.ts` schema **已经是 model 形状**，无需数据迁移；只改类型来源与文档描述。

### 3.3 可保留的依赖

- `axios` / `axios-cache-interceptor`：bili / `fetcher.ts` / `downloader.ts` / 翻译同步仍在用，**不删**。
- `app/lib/axios.server.ts`：同上保留。
- `linkedom` / `x-client-transaction-id`：删除 vendor 后无直接 import，可从 `package.json` 顶层移除（仍由 `@chilfish/tweet` 传递安装）。

---

## 4. 改动清单

### A. 依赖与装配

1. `bun add @chilfish/tweet@0.2.2`（exact，不用 `^`）。
2. 新增 `app/lib/twitter.server.ts`（用 `.server` 后缀，防止 `env.server` 进入客户端 bundle；对齐仓库既有 `*.server.ts` 约定）：

```ts
import type { EnrichedTweet as SDKEnrichedTweet, RawTweet } from '@chilfish/tweet'
import type { ObsEvent, ObsFields } from '~/lib/obs-log'
import { attachSpaceDetails, createClient, enrichTweet, mapSpaceDetails } from '@chilfish/tweet'
import { env } from '~/lib/env.server'
import { obsLog, suffix } from '~/lib/obs-log'

const logger = {
  warn: (event: string, fields?: Record<string, unknown>) =>
    obsLog(event as ObsEvent, (fields ?? {}) as ObsFields),
}

export const twitter = createClient({ keys: env.TWEET_KEYS, logger })

export const fetchTweet = (id: string) => twitter.getTweet(id)
export const fetchSpaceDetails = (id: string) => twitter.getSpace(id)
export const fetchListTweets = (id: string) => twitter.getListTweets(id)
export const fetchUserDetails = (idOrUsername: string) => twitter.getUser(idOrUsername)
export const fetchUserTimeline = (id: string, cursor?: string) =>
  twitter.getUserTimeline(id, cursor)
export const fetchReplies = (id: string, cursor?: string) =>
  twitter.getReplies(id, { cursor })
export const fetchSearchTweets = (query: string, options?: SearchOptions) =>
  twitter.searchTweets(query, options)
```

3. 保留 app 侧装配（不进包）：
   - `getTweets`（父推文链 + quoted 二次抓取）——`app/lib/service/getTweet.ts`。
   - `getEnrichedUserTimeline`（广告过滤 + quoted 富化）——`twitter.server.ts`。
   - `resolveSpaceById`（缓存回填用，失败返回 `null` + `obsLog('space.fetch.failed')`）。
   - `getEnrichedTweet`（单条：`enrichTweet` + `attachSpaceDetails` 数组包装）。
4. 删除 `app/lib/react-tweet/utils/get-tweet.ts`，更新 9 个直接 importer（service / routes / tests）。
5. `app/lib/obs-log.ts`：`ObsEvent` 已包含 `pool.rotate` / `pool.exhaust` / `jetfuel.parse.fallback` / `space.fetch.failed`，无需改；logger 适配器只在 `twitter.server.ts` 做一次字符串→联合类型收窄。

### B. 类型层

| 文件                                         | 动作                                                                                                               |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `app/types/index.ts`                         | 包 `EnrichedTweet` + app 扩展；`RawTweet` re-export；`RawUser = UserData`                                          |
| `app/types/article.ts`                       | re-export `TweetArticle` / `ArticleBlock` / `ArticleRun` / `ArticleMedia` / `ArticleInlineStyle`                   |
| `app/types/card.ts`                          | re-export `LinkPreviewCard` / `CardCarouselImage` / `TrendingCardInfo` / `CardLayout`；删除未使用的 `TwitterCard*` |
| `app/types/entities.ts`                      | re-export `Entity` / `EntityWithType` / `TranslationEntity` 及子类型                                               |
| `app/types/media.ts`                         | re-export `MediaDetails` / `MediaPhoto` / `MediaAnimatedGif` / `MediaVideo` / `VideoInfo`                          |
| `app/types/poll.ts`                          | re-export `PollChoice` / `TweetPoll`                                                                               |
| `app/types/space.ts`                         | re-export `SpaceDetails` / `SpaceHost` / `SpaceState` / `SpaceAvailability`                                        |
| `app/types/tweet.ts`                         | re-export `Tweet` / `TweetBase` / `TweetEditControl` / `TweetParent` / `QuotedTweet`                               |
| `app/types/user.ts`                          | re-export `TweetUser`                                                                                              |
| `app/types/photo.ts` / `video.ts`            | 暂不删除；确认无引用后另开清理（不在本阶段扩大 diff）                                                              |
| `app/types/vision.ts` / `ins.ts` / `bili.ts` | 保持 app 私有                                                                                                      |

`EnrichedTweet` 建议形态（保留嵌套 app 扩展）：

```ts
import type { EnrichedTweet as BaseEnrichedTweet, RawTweet } from '@chilfish/tweet'
import type { UserData } from '@chilfish/tweet/internals'
import type { AIVisionInfo } from './vision'

export type { RawTweet }
export type RawUser = UserData

export type EnrichedTweet = Omit<BaseEnrichedTweet, 'quotedTweet' | 'comments'> & {
  autoTranslationEntities?: Entity[]
  visionInfo?: AIVisionInfo[]
  quotedTweet?: EnrichedTweet
  comments?: EnrichedTweet[]
}
```

同步：`app/lib/llms.ts` 的 `RawUser` schema 描述改为 `@chilfish/tweet/internals UserData`（字段不变）。

### C. 解析层

| 文件                                  | 动作                                                                                                                                                                    |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/lib/react-tweet/utils/index.ts`  | 保留 barrel：re-export 包内解析函数 + 本地 `getMediaUrl` / `getMp4Video` / `formatNumber` + `date-utils`                                                                |
| `…/parseTweet.ts`                     | 删除；调用点改 `enrichTweet`                                                                                                                                            |
| `…/entitytParser.ts`                  | 删除；调用点改包内 `getEntities` / `getMediaAltEntities` / `serializeForAI` / `restoreEntities` / `applyAITranslations`                                                 |
| `…/poll.ts`                           | 删除；调用点改 `mapPollCard`                                                                                                                                            |
| `…/space.ts`                          | 删除；调用点改 `mapSpaceDetails` / `resolveSpaceId` / `isSpaceUrl` / `extractSpaceIdFromUrl`                                                                            |
| `…/article.ts`                        | 删除；调用点改 `mapArticle` / `resolveArticleLink` / `isArticleUrl`                                                                                                     |
| `…/organizeTweets.ts`                 | 删除；调用点改 `organizeTweets`                                                                                                                                         |
| `…/date-utils.ts`                     | **保留为 app wrapper**：默认 `yyyy年MM月dd日 HH:mm:ss` + `Asia/Shanghai`；`convertDate` re-export 包实现                                                                |
| `app/lib/article/parse.ts`            | 改为 re-export 包内 `parseContentState` / `collectEmbeddedTweetIds` / `derivePlainText` / `normalizeEntityMap` / `mediaFromRaw`；`translate.ts` / `serialize.ts` 留 app |
| `app/lib/media-url.ts`                | 改为 re-export 包内 `normalizeMediaUrl` / `normalizeProfileImageUrl`（16 个 importer 不动）                                                                             |
| `app/lib/react-tweet/twitter-theme/*` | 保留（Phase 3 再迁）；只做字段改名                                                                                                                                      |

> `formatDate` 不能直接用包默认值：SDK 默认运行时本地时区（Workers = UTC），app 既有 UI 期望北京时间与中文默认格式。

### D. 字段映射

| 旧                   | 新                    | 适用范围                                    |
| -------------------- | --------------------- | ------------------------------------------- |
| `id_str`             | `id`                  | `EnrichedTweet` / `TweetUser` / `SpaceHost` |
| `quoted_tweet_id`    | `quotedTweetId`       | `EnrichedTweet`                             |
| `retweetedOrignalId` | `retweetedOriginalId` | `EnrichedTweet`                             |
| `isInlineMeida`      | `isInlineMedia`       | `EnrichedTweet`                             |
| `user.id_str`        | `user.id`             | `TweetUser`                                 |
| `space.host.id_str`  | `space.host.id`       | `SpaceHost`                                 |

**不要改**：raw fixture / raw response 里的 `legacy.id_str`、`rest_id`、实体 `UserMentionEntity.id_str`（SDK `Entity` 仍用 raw 形状）。

重点文件：

- 服务层：`app/lib/service/{getTweet,getTweet.server,getUser.server,translationSync}.ts`、`app/lib/translation/materialize.ts`。
- 组件：`app/components/tweet/{Tweet,TweetNode,PlainTweet,TweetTextBody,TweetMediaAlt,CommentBranch,AIVisionBlock}.tsx`、`app/components/translation/DownloadMedia.tsx`、`app/lib/react-tweet/twitter-theme/tweet-media.tsx`。
- 路由：`app/routes/{tweet,user,search,list,plain,article}.tsx`。
- hooks / stores：`app/hooks/*`、`app/lib/stores/*`。
- 其他：`app/lib/{AITranslation,llms,markdown,share,ai/request}.ts`。
- stories / fixtures / scripts：`app/stories/*`、`test/fixtures/*`、`scripts/{tmp-dump-article,debug-entity-parser}.ts`。

### E. 测试与验收

| 文件                                                                                                      | 动作                                                                                                                 |
| --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `test/unit/smart-pool.spec.ts`                                                                            | 改从包导入 `RettiwtPool` / `FetcherService`；保留 8 个行为用例；补 `status()` 断言                                   |
| `test/unit/rettiwt-transaction-document.spec.ts`                                                          | 改从包导入 `buildXShellHeaders` / `isUsableXDocument` / `X_SHELL_URLS`                                               |
| `test/unit/{parseTweet,entitytParser,poll-card,carousel-card,jetfuel}.spec.ts`                            | 改包内解析函数；仅改 import 与输出字段                                                                               |
| `test/unit/{article,article-parse,search,space,user}.spec.ts`                                             | raw 类型改 `@chilfish/tweet/internals`；`Extractors` / `TweetFilter` / `Requests` 改 internals                       |
| `test/unit/{getTweet,getLocalTweet,api.tweet-search}.spec.ts`                                             | 改 import 到新 barrel / `twitter.server`                                                                             |
| `test/acceptance/ac-tweet.spec.ts`                                                                        | `RettiwtConfig` / `FetcherService` 改主入口；`IRawAudioSpace` 改 internals                                           |
| `test/acceptance/ac-card.spec.ts`                                                                         | 源码扫描路径从 `app/lib/rettiwt-api/*` 改为 `@chilfish/tweet` 的解析输出或 `app/lib/twitter.server.ts`；保留行为断言 |
| `test/acceptance/ac-obs.spec.ts`                                                                          | P4 扫描目标从 `app/lib/SmartPool.ts` 改为 `app/lib/twitter.server.ts` 的 logger 接线 + 包内事件名                    |
| `test/acceptance/{space-render,article-render,card-render,poll-card-render,carousel-card-render}.spec.ts` | import + 输出字段改名                                                                                                |
| `verify/acceptance-criteria/AC-obs.md`                                                                    | P4 验证对象改成装配层（`SmartPool.ts` 已不存在）；AC 编号不变                                                        |
| `verify/acceptance-criteria/AC-card.md`                                                                   | 若含源码扫描路径，改到包导出/装配层；AC 编号不变                                                                     |

### F. 清理

1. 删除 `app/lib/rettiwt-api`（整目录）、`app/lib/SmartPool.ts`。
2. `eslint.config.mjs` 移除 `'**/app/lib/rettiwt-api/**'` ignore。
3. `package.json` 移除 `linkedom` / `x-client-transaction-id`（确认无直接 import 后）；`axios` 保留。
4. 更新 `docs/INDEX.md`：「推文 SDK 抽离 / 包发布」一行补 Phase 1 文档链接；数据源描述从「内嵌 rettiwt-api」改为 `@chilfish/tweet`。
5. 更新 `docs/planning/backlog.md` 条目状态；`docs/development-log/2026-11-19.md` 记录执行过程与验证结果。

---

## 5. 执行顺序与原子提交

> 大 diff 按关注点拆分；每个提交本地过相关检查，最终一起跑 pre-push 门禁。

| #   | 提交                                              | 内容                                                                   |
| --- | ------------------------------------------------- | ---------------------------------------------------------------------- |
| 1   | `docs(planning): Phase 1 迁移执行方案`            | 本文档 + INDEX / backlog / 开发日志                                    |
| 2   | `chore(deps): 接入 @chilfish/tweet@0.2.2`         | `package.json` / lockfile / 移除直接 `linkedom` 依赖                   |
| 3   | `refactor(twitter): 用 SDK 装配取数层`            | `twitter.server.ts` + 删除 `get-tweet.ts` + 9 个 importer              |
| 4   | `refactor(types): 富化类型改为 SDK 契约`          | `app/types/*` + `RawUser → UserData` + llms schema 描述                |
| 5   | `refactor(parse): 解析层切换为包导出`             | utils barrel / article / media-url / 7 个文件删除                      |
| 6   | `refactor(tweet): 字段命名对齐 SDK`               | `id` / `quotedTweetId` / `retweetedOriginalId` / `isInlineMedia` sweep |
| 7   | `test(verify): 迁移测试与 AC 扫描`                | 20 + 30 个测试 import、fixtures、AC 文档                               |
| 8   | `refactor: 删除 rettiwt-api 内嵌副本与 SmartPool` | 148 文件删除 + eslint ignore 移除                                      |
| 9   | `docs(log): 记录 Phase 1 验证结果`                | 开发日志 + backlog 勾选（+ Phase 1 完成后归档计划）                    |

---

## 6. 门禁与回滚

### 6.1 门禁

```bash
bun run typecheck
bun run lint
bun run test
bun run verify/index.ts --exit-on-fail
bun run build
bun run build-storybook
```

真实 `TWEET_KEYS` 手测五条链路：`get` / `search` / `replies` / Space / Article；重点看 Workers 下 transaction-id、无 Key 的 guest 搜索、`NotSupportedError` 的 403 映射。

### 6.2 回滚

- 包版本锁定 exact；回滚只改 `package.json` 版本号 + `bun install`。
- 代码层回滚：revert 本阶段合并提交；vendor 副本在 git 历史中完整保留。
- 缓存兼容：DB / localCache 中的 `EnrichedTweet` 字段改名后由旧缓存读取路径兜底；不做破坏性迁移。

---

## 7. 风险与待决

| 风险                         | 说明                                               | 缓解                                              |
| ---------------------------- | -------------------------------------------------- | ------------------------------------------------- |
| `RawUser` 语义修正           | 旧类型本来就是 model 形状；DB 行无需迁移           | 只改类型来源；用真实用户页 + DB 缓存回归          |
| raw fixture 的 `id_str` 误改 | 输入 fixture 必须保留 raw 字段                     | 只改 enriched 输出断言；typecheck + test 双重校验 |
| `formatDate` 时区            | SDK 默认运行时本地时区（Workers=UTC）              | 保留 app wrapper（Asia/Shanghai）                 |
| 嵌套类型                     | `quotedTweet` / `comments` 需递归使用 app 扩展类型 | `Omit<Base, …>` 重新声明                          |
| AC 源码扫描                  | `SmartPool.ts` / vendor 路径消失                   | AC 改为装配层/包行为断言；编号不变                |
| Storybook / 截图             | UI 只改字段，不改结构                              | `build-storybook` + 截图 AC                       |
| 单点故障                     | 包坏了两站一起坏                                   | exact version + 发布前消费者冒烟                  |

**待决**：Phase 1 完成后，`app/lib/react-tweet/twitter-theme` 是否随 Phase 3 一次性迁到 `./react`（本阶段不动）。

---

## 8. 完成定义（DoD）

- [x] `app/lib/rettiwt-api` 与 `app/lib/SmartPool.ts` 已删除；`eslint.config.mjs` 无 ignore。
- [x] `app/lib/twitter.server.ts` 是唯一装配层；无业务代码直接 import `@chilfish/tweet` 的底层 resource。
- [x] `app/types` 以包为唯一富化类型源；`RawUser = UserData`。
- [x] 字段 sweep 完成；raw fixture 保留 raw 字段；enriched fixtures 已迁移。
- [x] 20 个 vendor import + 30 个 utils import 全部迁移；AC-OBS / AC-CARD 扫描目标更新。
- [x] `typecheck` / `lint` / `test` / `verify --exit-on-fail` / `build` / `build-storybook` 全绿。
- [ ] 真实 Key 五链路手测（待有 Key 环境执行）；无 Key 的 guest 搜索与 `NotSupportedError` 映射已有单测/集成覆盖。
- [x] 开发日志、backlog、INDEX、ADR-010 状态同步。

---

## 9. 实施结果（2026-11-19）

### 9.1 实际改动

- 依赖：`@chilfish/tweet@0.2.2`（exact）；移除 `x-client-transaction-id`；`linkedom` 仅测试使用。
- 装配：新增 `app/lib/twitter.server.ts`（`createClient` + `env.TWEET_KEYS` + `obsLog` logger），保留 `getTweets` / `resolveSpaceById` / 缓存回填在 app。
- 类型：`app/types` 改为包 re-export；`EnrichedTweet` 只扩展 `autoTranslationEntities` / `visionInfo`，并递归覆盖 `quotedTweet` / `comments`；`RawUser = UserData`。
- 解析：删除 `app/lib/react-tweet/utils` 下 7 个已进包文件；保留 `index.ts`（barrel）与 `date-utils.ts`（`Asia/Shanghai` + 中文格式 wrapper）。
- 字段：`id_str→id`、`quoted_tweet_id→quotedTweetId`、`retweetedOrignalId→retweetedOriginalId`、`isInlineMeida→isInlineMedia`、`user/host.id_str→id`。
- 兼容：新增 `app/lib/tweet-normalize.ts`，在 `getLocalTweet` / `getDBTweet` 读缓存时归一化旧字段；迁移 `test/fixtures/tweets/*` 与 `vision/tweet-multi-photo.json`。
- 本地化：SDK 的 CTA 文案为英文、Space 日期为英文月份；app 在 `localizeCtaLabel` / `formatSpaceDate` wrapper 中转为中文，避免 UI 回归。
- 测试：20 个 vendor import + 30 个 utils import 迁移；`transformUserResponse` / `decodeJetfuelPayload` 未从包导出，相关测试改为经 `enrichTweet` / `parseTrendingCard` 的行为覆盖。
- AC：AC-OBS-001 P4 改为装配层 logger 接线；AC-CARD-001/004 改为请求描述符/回退行为断言；AC-TWEET-011 改为注入 `HttpClient` + `TidProvider`。

### 9.2 门禁结果

| 命令                                     | 结果                                        |
| ---------------------------------------- | ------------------------------------------- |
| `bun run typecheck`                      | ✅                                          |
| `bun run lint`                           | ✅（2 个既有 warning）                      |
| `bun run test`                           | ✅ 665 passed                               |
| `bun run verify/index.ts --exit-on-fail` | ✅ 676 passed / 7 skipped（含 integration） |
| `bun run build`                          | ✅                                          |
| `bun run build-storybook`                | ✅                                          |

### 9.3 遗留

- **真实 Key 手测**：`get` / `search` / `replies` / Space / Article 五链路需在有 `TWEET_KEYS` 的环境执行。
- **SDK fieldToggles**：`@chilfish/tweet@0.2.2` 已修复；临时补丁已删除，AC-TWEET-013 保留为回归防护。
- **Phase 2/3**：`tweets-viewer` 切换与 `./react` 组件不在本阶段范围。
