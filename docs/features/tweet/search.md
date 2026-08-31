# 推文搜索 — 实施追踪

> 创建时间：2026-08-31
> 分支：`feat/tweet-search`
> 关联：`docs/planning/backlog.md`（阶段二待办）、`verify/acceptance-criteria/AC-tweet.md`（AC-TWEET-009/010）
> 数据层：`rettiwt-api`（`TweetService.search` 已具备，本任务补齐授权组与 App 接入）

## 目标

打通 Twitter/X 搜索链路：`/search` 页面输入关键词 → BFF `/api/tweet/search` →
`rettiwt-api` `TWEET_SEARCH` 资源 → X `SearchTimeline`，返回推文列表（格式同
`/api/tweet/get` 的 `EnrichedTweet[]`，**目前只返回推文列表，不做分页**）。

## 现状盘点（2026-08-31）

- `rettiwt-api` 底层搜索能力**已完整**：`TweetRequests.search()`（SearchTimeline 请求）、
  `TweetService.search()`（含按时间倒序）、`Extractors.TWEET_SEARCH`（CursoredData 解析）、
  `Requests.TWEET_SEARCH` 映射均已就位，`FetchResourcesGroup` 已包含 `TWEET_SEARCH`。
- **缺口 1（rettiwt-api 层）**：`AllowGuestAuthenticationGroup` 未包含 `TWEET_SEARCH`——
  无 `apiKey` 的 guest 池直接抛 `RESOURCE_NOT_ALLOWED`。补上后无 Key 部署也可尝试 guest 搜索。
- **缺口 2（App 数据层）**：`app/lib/react-tweet/utils/get-tweet.ts` 无搜索 fetch/解析函数。
- **缺口 3（BFF + 前端）**：无 `/api/tweet/search` 路由、无 `/search` 页面、footer 无入口。

## 接口约定

### GET /api/tweet/search?q=<关键词>&type=<top|latest>

- `q`：必填，关键词（等价 `includeWords`，多词空格分词）
- `type`：可选，`top`（热门）| `latest`（最新，默认）
- 返回：`EnrichedTweet[]` —— 与 `GET/POST /api/tweet/get` 相同格式（数组，元素含
  `id_str` / `text` / `entities` / `user`），无分页字段（当前阶段）

## 实施计划

| Phase   | 内容                                                              | 状态 |
| ------- | ----------------------------------------------------------------- | ---- |
| Phase 1 | rettiwt-api：`TWEET_SEARCH` 加入 `AllowGuestAuthenticationGroup` | ⬜ |
| Phase 2 | 数据层：`parseSearchTimeline` 纯函数 + `fetchSearchTweets`（池化） | ⬜ |
| Phase 3 | BFF：`/api/tweet/search` loader + `validations/search.ts` + 路由注册 | ⬜ |
| Phase 4 | 前端：`/search` 页面 + footer 入口                                 | ⬜ |
| Phase 5 | 测试：fixture + 单测 + AC-TWEET-009/010 + 门禁 + 提交 + PR         | ⬜ |

## 技术设计

### Phase 2 — 数据层

`app/lib/react-tweet/utils/get-tweet.ts` 新增：

- `parseSearchTimeline(response: ITweetSearchResponse)` —— **纯函数**：遍历
  `data.search_by_raw_query.search_timeline.timeline.instructions`，只取
  `entryId` 前缀 `tweet-` 且非 `TimelineTimelineCursor` 的 entry，
  提取 `itemContent.tweet_results.result`（`as unknown as RawTweet`），复用
  `getBottomCursor` 取下一页光标（当前阶段不对外暴露）。
- `fetchSearchTweets(query, { type, count, cursor })` —— `twitterPool.run` +
  `fetcher.request(ResourceType.TWEET_SEARCH, { filter: { includeWords: [query], top }, ... })`，
  返回 `parseSearchTimeline` 结果。

> 解析策略对齐 `fetchListTweets`（同款 timeline 结构），避免引入新解析范式，
> 规避 postmortem #001（解析器零测试/多分支漂移）：纯函数直接单测。

### Phase 3 — BFF

- `app/lib/validations/search.ts`：`searchTweetSchema`（`q` trim 1..500、`type` enum、校验失败 400）。
- `app/routes/api/tweet/search.ts`：loader 读 searchParams → `fetchSearchTweets` →
  `enrichTweet` 映射过滤 → 返回 `EnrichedTweet[]`；异常 `data({ error }, { status })`。
- `app/routes.ts`：`prefix('tweet')` 下注册 `route('search', 'routes/api/tweet/search.ts')`。

### Phase 4 — 前端

- `app/routes/search.tsx`：搜索框（Input + 提交）+ Latest/Top 切换 → 导航 `/search?q=&type=`，
  `clientLoader` 拉取列表渲染（复用 `MyTweet` 单推模式，同 `/list/:id`）；meta `noindex`。
- footer「More」区新增内链 `/search`（react-router `Link`，不走外链 `FooterLink`）。

## 验证

- 单测：`parseSearchTimeline`（fixture 提取/光标/容错）+ `/api/tweet/search` 路由
  （缺 q → 400 / 合法 q → 数组 / cursor 透传）
- AC-TWEET-009（离线，fixture 解析回归）
- AC-TWEET-010（集成，`TWEET_KEYS` + server：端点返回 EnrichedTweet[]）