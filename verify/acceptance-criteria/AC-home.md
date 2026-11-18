# 首页验收标准

> 版本：1.3 | 日期：2026-11-18
> 背景：首页精简后只剩输入框，缺少回访入口与产品范围提示。本组 AC 锁定「最近查看」本地历史、`/history` 完整历史页、详情快照缓存与本地存储层。
> 关联 Verifier：`test/unit/visited.spec.ts`、`test/unit/storage.spec.ts`、`test/unit/visited-store.spec.ts`、`test/acceptance/home-render.spec.ts`
> 执行命令：`bun verify --module home [--ac AC-HOME-NNN]`

---

## AC-HOME-001：最近查看

- **输入**：`app/lib/visited.ts` 的纯函数、`RecentVisited` 组件
- **预期输出**：按访问时间倒序、按类型去重的本地历史，首页最多展示 3 条并提供进入完整历史的入口
- **Pass 条件**：
  - `pushVisited`：新项置顶；同一 `type + id` 只保留一条并刷新时间戳，同时累计 `visits`、保留 `firstTs`；存储上限 `VISITED_LIMIT`（1000）
  - `formatVisitedTime`：<1 分钟「刚刚」、<1 小时「N 分钟前」、<24 小时「N 小时前」、<7 天「N 天前」、更早「M月D日」
  - `visitedHref`：tweet → `/tweets/{id}`、ig → `/ins/{id}`、article → `/article/{id}`，id 做 URL 编码
  - `RecentVisited` 渲染为可点击链接，含类型图标、标题、摘要与相对时间；传入空列表时返回空串（不占位）
  - 水合中（`loading`）按 `HOME_RECENT_LIMIT` 条渲染行骨架并带 `aria-busy`，不给出「全部」入口与记录链接
  - 首页取 `HOME_RECENT_LIMIT`（3）条，同一记录不重复出现；头部「全部」链接指向 `/history`
  - store 水合无论成功、读写异常还是 IndexedDB 不可用，`_hasHydrated` 都必须置 true（不允许停在骨架态）
  - 原「继续阅读」宽卡已移除，最新一条不再单独放大
  - 历史只写本机存储，不随请求发送、不上报服务端

## AC-HOME-002：首页入口与装饰外壳

- **输入**：`TweetInputForm`、`HankoMark`、`Dateline` 的渲染结果
- **预期输出**：没有现成链接时也能从首页开始，外壳有可辨认的身份但不遮挡内容
- **Pass 条件**：
  - 输入卡底部一行同时提供 `/search` 与「设置」入口；设置打开现有 `SettingsPanel`
  - 不设常驻导航：页脚默认收起，关于 / GitHub / 搜索入口放在展开后的页脚
  - 首页标题旁有朱印；Hero 与日付线由 Layout 渲染，在所有视图固定出现，朱印 `aria-hidden`
  - 不使用渐变文字或大面积渐变光斑；项目说明保留在 PageHeader，不另加功能宫格

## AC-HOME-003：IndexedDB 本地存储层

- **输入**：`app/lib/storage/{db,visited,dictionary}.ts`
- **预期输出**：按记录读写的 IndexedDB 存储，替代 localStorage 整表重写
- **Pass 条件**：
  - `recordVisited` 按 `type + id` 覆盖写入，累计 `visits` 并保留 `firstTs`；同一事务写入一条 `visits` 访问事件
  - `visits` store（DB v4）保存 `ts / type / targetId`，索引 `ts` 与 `typeId`；超过 `VISIT_EVENT_LIMIT`（5000）按时间淘汰
  - 记录数超过 `VISITED_STORAGE_LIMIT`（1000）时按时间淘汰最旧记录；v3 → v4 升级把已有记录的 `ts` 回填成一条事件
  - `loadRecentVisited` / `loadVisitedHistory` 按时间倒序返回；`loadVisitEvents` 按时间倒序返回访问事件
  - 单条移除同时删除对应 snapshot 与该记录的访问事件；清空同时清空 `visited` / `snapshots` / `visits`
  - 词典按 `id` 单条增删改查，读取按 `createdAt` 倒序
  - 首次启动把 localStorage 中的 `visited-store` / `translation-dictionary-storage` 迁移进 IndexedDB，迁移成功后删除旧键
  - IndexedDB 不可用或打开失败时降级为内存态，不抛错打断渲染

## AC-HOME-004：浏览历史页 `/history`

- **输入**：`app/routes/history.tsx`、`app/components/history/{HistoryOverview,HistoryActivity,HistoryInsights,HistoryToolbar,HistoryList,HistoryTable,HistoryPagination}.tsx`、`app/lib/visited.ts`、`app/lib/visited-analytics.ts`
- **预期输出**：本机全部浏览记录（上限 1000）的 dashboard：单层 grouped surface、全历史统计与热力图、作者洞察、列表/表格双视图、分页与导出
- **Pass 条件**：
  - 整体只使用一层无阴影的内容 surface（`bg-card` + hairline border），区块之间用分隔线/留白，不给每个区块套卡片
  - 总览：记录数 / 浏览次数 / 作者数 / 活跃天数；副行给出当前连续、最长连续、活跃日均与类型分布；统计基于全部历史，不受列表筛选影响
  - 热力图：`buildVisitedHeatmap` 以本地周一为列、7 天为行，覆盖全部历史（最多 260 周），超出容器时横向滚动；今天高亮，空格子不占位
  - 常看作者：按累计浏览次数取前 5，点击写入 `?author=`；时段分布给出 24 小时直方图
  - 筛选：关键词匹配标题/摘要/作者；类型（全部/推文/长文/IG）、时间范围（全部/今天/近 7 天/近 30 天）、作者可叠加；筛选控件为轻量胶囊，移动端单行横向滚动
  - 分组：列表视图按日期或作者分组（日期跨年补 `YYYY年`），作者组按浏览次数排序；表格视图提供内容/作者/类型/浏览/最近列
  - 排序：最近浏览 / 浏览最多 / 最早浏览；列表视图切回时恢复最近浏览
  - 分页：每页 20（可选 50/100），只在列表上方出现一次；`?page=`、`?per=` 写入 URL，筛选/排序变化重置页码
  - 每行/表格行是链接（复用 `visitedHref`），移除按钮独立于链接；空态给「去首页 / 清除筛选」
  - 导出 JSON v2（`version / exportedAt / items / events`）；清空需二次确认并同时清空记录、事件与快照；页面 `noindex`
  - 移动端无横向溢出；统计 2×2、筛选 chips 横向滚动、分页在 390px 宽下完整可用

## AC-HOME-005：详情快照缓存

- **输入**：`app/lib/snapshot.ts`、`app/lib/storage/snapshots.ts`、`app/lib/snapshot-restore.ts`、`app/lib/snapshot-flush.ts`、`app/hooks/use-persist-snapshot.ts`
- **预期输出**：IndexedDB `snapshots` store 保存完整详情，详情页命中本地快照即跳过 API
- **Pass 条件**：
  - 主键与摘要一致（`${type}:${id}`），索引 `savedAt`；推文快照含 `tweets` + `translations` + `commentIds`（+ 文章译文 / embeds），IG 快照含 `posts`
  - 本地优先：`loadTweetSnapshot` / `loadIgSnapshot` 只判断数据是否完整，不再用 TTL 拒绝旧快照；`savedAt` 仅用于 `SNAPSHOT_LIMIT`（100）淘汰
  - 快照数量超过 `SNAPSHOT_LIMIT`（100）时按 `savedAt` 淘汰最旧
  - 摘要被淘汰、单条移除或清空时，同事务删除对应快照；`clearSnapshots` 不动摘要
  - `/tweets/:id`、`/article/:id` 的 `clientLoader` 与 `/ins/:id` 的客户端取数先读快照，命中即返回；恢复推文快照时同时回填 `tweets`、逐条译文、文章译文与评论 id
  - 快照写入时刷新 `savedAt`；截图成功、手动翻译保存、文章翻译保存、IG caption 翻译保存后通过 `flushSnapshot(key)` 立即落盘

## AC-HOME-006：本地优先读取与缓存边界

- **输入**：`app/routes/{tweet,article,ins,search,list}.tsx`、`app/routes/api/{tweet/search,tweet/list,user/timeline}.ts`、截图与翻译保存 hooks
- **预期输出**：详情页本地优先；search / list / timeline 只走请求，不写本地详情快照
- **Pass 条件**：
  - `/tweets/:id`、`/article/:id` 导出 `clientLoader`：先按 id 读 IndexedDB 快照，命中时直接返回并恢复 store，未命中才 `serverLoader()`
  - `/ins/:id` 的 `getIGPost` 先 `loadIgSnapshot(id)`，未命中才请求 `/api/ig/get`
  - `search.tsx` / `list.tsx` 不引用 `usePersistSnapshot`、`putSnapshot`、`recordVisited`
  - `api/tweet/search`、`api/tweet/list`、`api/user/timeline` 不写 `insertToTweetDB` / `setLocalCache` / `putSnapshot` / `recordVisited`
  - 截图（推文 / IG）与翻译保存（手动、文章、IG caption）调用 `flushSnapshot`，把当前完整数据同步回本地快照
  - `snapshot-restore` 不依赖 `SNAPSHOT_TTL` / `isSnapshotFresh` 做命中判断

---

## 变更约定

- 新增内容类型（如 List）时，同步 `VisitedItem` 的 `type`、`visitedHref` 与 `test/unit/visited.spec.ts`
- 首页区块顺序固定：输入卡 → 最近查看；新增区块不得插入输入卡之前
- 新增可缓存的详情类型时，同步 `SnapshotRecord` 联合类型与 `AC-HOME-005` 的字段清单
