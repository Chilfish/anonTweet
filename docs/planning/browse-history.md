# 浏览历史页与详情快照缓存

> 状态：实施中（2026-11-18）
> 关联：`app/lib/visited.ts`、`app/lib/storage/{db,visited,snapshots}.ts`、`app/routes/history.tsx`
> 设计规范：[ui-design/patterns.md](../ui-design/patterns.md)、[ui-design/INFORMATION-DENSITY.md](../ui-design/INFORMATION-DENSITY.md)

## 1. 要解决的问题

1. 首页目前是「1 条继续阅读 + 3 条最近查看」，`ContinueReading` 把最新一条单独放大，信息密度低且和列表重复。**删除该组件**，首页只保留 3 条最近查看 + 一个进入完整历史的入口。
2. IndexedDB 的 `visited` 只存标题 / 摘要 / 缩略图这类列表摘要，重新打开详情页仍要走 `/api/tweet/get` 或 `/api/ig/get`。**新增 `snapshots` store 存完整详情**（推文线程、译文、文章译文、IG 帖子），命中且未过期时直接渲染，不再发请求。

## 2. 页面：`/history`

**谁打开它、想知道什么、下一步做什么**：回访用户想找回之前看过的内容，扫一眼列表，点进去接着看。

### 2.1 结构

```
标题行   ← 标题「浏览历史」+ 条数 + 清空（次要，危险色）
工具栏   ← 搜索（InputGroup）+ 类型筛选（ToggleGroup：全部/推文/长文/IG）
列表     ← 按 今天 / 昨天 / 更早 分组；行 = 缩略图 + 标题 + 摘要 + 类型/时间 + 移除按钮
空态     ← 无记录 / 筛选无结果 两种文案，各自给一个下一步
```

- 沿用列表页骨架（[patterns.md §2](../ui-design/patterns.md)），内容区在 Layout 内，移动端单列、`md` 以上不变成表格。
- 标题用 `h2`（`h1` 已被 Layout 的 Hero 占用，不跳级）；条数 `tabular-nums`，只出现一次。
- 行高 56–80，行间用 `border-b border-border/40` 分隔，不套卡片；hover 只改背景。
- 标题换行不截断；摘要 `line-clamp-2`（列表摘要本身已是 90 字截断结果）。
- 移除按钮独立于链接（不嵌套交互元素），`aria-label="移除 <标题>"`。
- 清空使用 `AlertDialog` 二次确认；单条移除不需要确认。

### 2.2 交互与状态

| 状态            | 位置                           | 理由                                                               |
| --------------- | ------------------------------ | ------------------------------------------------------------------ |
| 搜索关键词 `q`  | URL `?q=`                      | 可回退、可分享（[interaction.md §3](../ui-design/interaction.md)） |
| 类型筛选 `type` | URL `?type=tweet\|article\|ig` | 改变结果集，写 URL                                                 |
| 输入框即时值    | 组件 state，250ms 防抖后写 URL | 避免每个击键一段历史                                               |

- 数据来源：`loadVisitedHistory()` 直接读 IndexedDB（上限 200），页面本地 state 持有全量；删除/清空同时写库并更新首页 store。
- 三种状态齐全：加载（`Skeleton` 行）、空（`Empty`：还没有记录 → 去搜索）、筛选空（`Empty`：清除筛选）。
- 历史只存本机，不上报服务端；页面 `noindex`。

## 3. 快照缓存（IndexedDB `snapshots`）

### 3.1 Schema（DB v3）

```ts
interface SnapshotBase { key: `${type}:${id}`; type: VisitedType; id: string; savedAt: number }

TweetSnapshot  = SnapshotBase & {
  type: 'tweet' | 'article'
  tweets: TweetData                       // store 形态（已剥离 entities 译文）
  translations: Record<string, Entity[] | null>  // 手动 / AI 译文
  articleTranslation?: ArticleTranslation | null
  embeds?: Record<string, EnrichedTweet | null>  // 文章内嵌推文
}

IgSnapshot = SnapshotBase & { type: 'ig'; posts: IGPostData }
```

- 主键 `key = visitedKey(item)`，与 `visited` 记录一一对应；索引 `savedAt`。
- **单独一个 store 而不是塞进 `visited`**：`visited` 每次水合要读 20 条摘要，塞入完整线程会让首页启动变重；快照按需读取。
- 容量：`SNAPSHOT_LIMIT = 100`（摘要 200 条，只有最近 100 条带快照），超出按 `savedAt` 淘汰。
- 生命周期与摘要绑定：摘要被淘汰 / 单条移除 / 清空时，同事务删掉对应快照，避免孤儿数据。
- 过期：`SNAPSHOT_TTL = 24h`。未过期直接用；过期后走一次请求并用新结果覆盖。

### 3.2 读写边界

- `app/lib/storage/snapshots.ts`：`putSnapshot` / `getSnapshot` / `deleteSnapshot` / `clearSnapshots`，只碰 IDB，不 import store。
- `app/lib/snapshot.ts`：纯函数 `snapshotKey` / `isSnapshotFresh` / 常量。
- `app/lib/snapshot-restore.ts`：把快照灌回 `useTranslationStore`（`setAllTweets` + 逐条 `setTranslation` + `setArticleTranslation`）。
- 写入统一走 `usePersistSnapshot(record)`：依赖稳定的 store 引用，800ms 防抖，卸载时 flush。

### 3.3 各页接入

| 页面           | 读                                                                  | 写                                     |
| -------------- | ------------------------------------------------------------------- | -------------------------------------- |
| `/tweets/:id`  | SWR fetcher 先读快照；命中未过期 → 恢复 store 并直接返回，不发 POST | store 的 `tweets` + `translations`     |
| `/ins/:id`     | `getIGPost` 先读快照，命中直接返回                                  | SWR `posts`（含 `captionTranslation`） |
| `/article/:id` | 客户端读取快照，loader 没有译文时用快照译文补位                     | `[tweet]` + `embeds` + 文章译文        |

SSR loader 不受影响（服务端没有 IndexedDB）；快照只消除客户端重复请求。

## 4. 验收

- AC-HOME-001（改）：首页 3 条最近查看 +「全部」入口，继续阅读卡移除。
- AC-HOME-004（新）：`/history` 列表、筛选、分组、空态、移除。
- AC-HOME-005（新）：快照写入 / 读取 / TTL / 淘汰 / 与摘要同生命周期。

执行：`bun run test`、`bun run typecheck`、`bun run verify/index.ts --module ui`。
