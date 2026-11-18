# 浏览历史页与详情快照缓存

> 状态：已实现（2026-11-18）
> 关联：`app/lib/visited.ts`、`app/lib/visited-analytics.ts`、`app/lib/storage/{db,visited,snapshots}.ts`、`app/routes/history.tsx`、`app/components/history/*`
> 设计规范：[ui-design/README.md](../ui-design/README.md)、[ui-design/INFORMATION-DENSITY.md](../ui-design/INFORMATION-DENSITY.md)

## 1. 要解决的问题

1. 首页目前是「1 条继续阅读 + 3 条最近查看」，`ContinueReading` 把最新一条单独放大，信息密度低且和列表重复。**删除该组件**，首页只保留 3 条最近查看 + 一个进入完整历史的入口。
2. IndexedDB 的 `visited` 只存标题 / 摘要 / 缩略图这类列表摘要，重新打开详情页仍要走 `/api/tweet/get` 或 `/api/ig/get`。**新增 `snapshots` store 存完整详情**（推文线程、译文、文章译文、IG 帖子），命中且未过期时直接渲染，不再发请求。

## 2. 页面：`/history`

**谁打开它、想知道什么、下一步做什么**：回访用户想找回之前看过的内容，同时快速判断自己最近在看谁、看得是否频繁。

### 2.1 结构

```
标题行   ← 返回 + 「浏览历史」+ 导出 JSON（图标）+ 清空（危险，二次确认）
内容面   ← 单层 grouped surface（bg-card + hairline border，无阴影）
  ├ 总览     ← 记录 / 浏览 / 作者 / 活跃天数 + 连续天数、活跃日均、类型分布
  ├ 活动     ← 全历史日历热力图（周一起始，今天描边，超出宽度横向滚动）
  ├ 偏好     ← 常看作者 Top 5（点击筛选）+ 24 小时时段分布
  └ 记录     ← 搜索 + 轻量筛选胶囊 + 视图切换 + 分组/排序 + 分页 + 列表/表格
空态        ← 无记录 → 去首页；筛选无结果 → 清除筛选
```

- **只做一层 surface**：页面底色与内容面分层，但内容面内部不重复套卡片；区块用 hairline 分隔线和留白建立节奏。
- 总览数字用 `tabular-nums`；热力图与直方图统一 `primary` 色相，靠透明度分层，不引入类型专用色。
- 热力图：本地周一为列、7 天为行，覆盖全部历史（最多 260 周）；小屏用 8px 格子、桌面 10px，超出容器时 `overflow-x-auto` + `touch-pan-x` 横向滚动。
- 筛选控件是轻量胶囊（`bg-muted/55`、无边框、28px 高），移动端单行横向滚动；不再使用整行全宽 Select。
- 列表行高约 60–80，行间用 `border-b border-border/40` 分隔；标题换行不截断，摘要 `line-clamp-2`。
- 表格视图用于高密度浏览：内容 / 作者 / 类型 / 浏览次数 / 最近访问，移动端横向滚动。
- 移除按钮独立于链接（不嵌套交互元素），`aria-label="移除 <标题>"`。

### 2.2 交互与状态

| 状态             | 位置                                   | 理由                                                               |
| ---------------- | -------------------------------------- | ------------------------------------------------------------------ |
| 搜索关键词 `q`   | URL `?q=`                              | 可回退、可分享（[ui-design/README.md §5](../ui-design/README.md)） |
| 类型筛选 `type`  | URL `?type=tweet\|article\|ig`         | 改变结果集，写 URL                                                 |
| 时间范围 `range` | URL `?range=today\|7d\|30d`            | 与类型同级的结果集筛选                                             |
| 作者 `author`    | URL `?author=@handle`                  | 常看作者点击、作者 Select 共用同一个稳定键                         |
| 分组 / 排序      | URL `?group=date\|author`、`?sort=...` | 列表按日期或作者；表格支持最近/最多/最早                           |
| 分页             | URL `?page=`、`?per=20\|50\|100`       | 每页默认 20，只在列表上方出现一次                                  |
| 输入框即时值     | 组件 state，250ms 防抖后写 URL         | 避免每个击键一段历史                                               |

- 数据来源：`loadVisitedHistory()`（上限 1000）+ `loadVisitEvents()`（上限 5000）；总览/热力图/时段用事件日志，作者与类型用去重记录。
- 总览基于全量历史，不受列表筛选影响，避免仪表盘数字随表格筛选跳动。
- 三种状态齐全：加载（`Skeleton` 内容面）、空（`Empty`：还没有记录 → 去首页）、筛选空（`Empty`：清除筛选）。
- 导出：`serializeVisitedExport` 生成 `{ version: 2, exportedAt, count, items, events }` JSON，浏览器下载，不经过服务端。
- 历史只存本机，不上报服务端；页面 `noindex`。

## 3. 快照缓存（IndexedDB `snapshots`）

### 3.1 Schema（DB v4）

```ts
interface SnapshotBase { key: `${type}:${id}`; type: VisitedType; id: string; savedAt: number }

TweetSnapshot  = SnapshotBase & {
  type: 'tweet' | 'article'
  tweets: TweetData                       // store 形态（已剥离 entities 译文）
  translations: Record<string, Entity[] | null>  // 手动 / AI 译文
  commentIds?: string[]                   // 已加载评论
  articleTranslation?: ArticleTranslation | null
  embeds?: Record<string, EnrichedTweet | null>  // 文章内嵌推文
}

IgSnapshot = SnapshotBase & { type: 'ig'; posts: IGPostData }
```

- 主键 `key = visitedKey(item)`，与 `visited` 记录一一对应；索引 `savedAt`。
- **单独一个 store 而不是塞进 `visited`**：`visited` 每次水合要读 20 条摘要，塞入完整线程会让首页启动变重；快照按需读取。
- 容量：`SNAPSHOT_LIMIT = 100`（摘要 1000 条，只有最近 100 条带快照），超出按 `savedAt` 淘汰。
- 生命周期与摘要绑定：摘要被淘汰 / 单条移除 / 清空时，同事务删掉对应快照；单条移除还会删除该记录的访问事件。
- **本地优先，无 TTL**：命中完整快照即直接使用，不再按时间过期；`savedAt` 只用于淘汰排序。推文快照额外保存 `commentIds`，恢复后评论区结构一致。

### 3.1.1 访问事件（`visits`）

```ts
interface VisitEvent { id?: number; ts: number; type: VisitedType; targetId: string }
```

- 主键自增；索引 `ts` 与 `typeId: [type, targetId]`；上限 `VISIT_EVENT_LIMIT = 5000`，超出按 `ts` 淘汰最旧。
- 每次 `recordVisited` 与摘要写入同事务追加一条事件；v3 → v4 升级时把已有摘要的 `ts` 各回填一条，热力图上线即有历史。
- 热力图、时段分布、连续天数使用事件日志（真实访问次数）；作者、类型分布使用去重后的摘要记录。

### 3.2 读写边界

- `app/lib/storage/snapshots.ts`：`putSnapshot` / `getSnapshot` / `deleteSnapshot` / `clearSnapshots`，只碰 IDB，不 import store。
- `app/lib/snapshot.ts`：`snapshotKey` 与 `SNAPSHOT_LIMIT`（不再有 TTL / `isSnapshotFresh`）。
- `app/lib/snapshot-restore.ts`：`loadTweetSnapshot` / `loadIgSnapshot` 本地优先读取；`restoreTweetSnapshot` 把 `tweets` + 逐条译文 + 文章译文 + `commentIds` 灌回 `useTranslationStore`。
- `app/lib/snapshot-flush.ts`：按快照 key 注册立即写入函数；截图、手动翻译、文章翻译、IG caption 翻译保存后 `flushSnapshot(key)`。
- 写入统一走 `usePersistSnapshot(record)`：依赖稳定的 store 引用，800ms 防抖，卸载时 flush；每次写入刷新 `savedAt`。

### 3.3 各页接入

| 页面           | 读                                                                | 写                                                |
| -------------- | ----------------------------------------------------------------- | ------------------------------------------------- |
| `/tweets/:id`  | `clientLoader` 先读快照；SWR fetcher 再兜底，命中直接恢复 store   | store 的 `tweets` + `translations` + `commentIds` |
| `/ins/:id`     | `getIGPost` 先读快照，命中直接返回                                | SWR `posts`（含 `captionTranslation`）            |
| `/article/:id` | `clientLoader` 先读快照（含文章译文 / embeds），未命中才走 server | `[tweet]` + `embeds` + 文章译文                   |

搜索 / 列表 / 时间线（`/search`、`/list`、`/api/user/timeline`）只走请求，不写本地快照；本地缓存仅由详情页、截图与翻译保存维护。SSR loader 不受影响（服务端没有 IndexedDB）；客户端导航优先读快照，命中即不发请求。

## 4. 验收

- AC-HOME-001（改）：首页 3 条最近查看 +「全部」入口；`VisitedItem` 累计 `visits` / `firstTs`。
- AC-HOME-003（改）：IndexedDB v4，新增 `visits` 事件 store、v3 回填、1000 条摘要 / 5000 条事件上限。
- AC-HOME-004（新）：`/history` 单层 surface、全历史热力图、作者洞察、筛选/分组/表格/排序/分页/导出。
- AC-HOME-005（改）：完整快照、无 TTL 本地优先、`commentIds`、`SNAPSHOT_LIMIT` 淘汰与 flush。
- AC-HOME-006（新）：详情页 `clientLoader` 本地优先；search / list / timeline 不写缓存；截图/翻译保存 flush。

执行：`bun run test`、`bun run typecheck`、`bun run verify/index.ts --module ui`。
