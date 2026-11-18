# 首页验收标准

> 版本：1.2 | 日期：2026-11-18
> 背景：首页精简后只剩输入框，缺少回访入口与产品范围提示。本组 AC 锁定「最近查看」本地历史、`/history` 完整历史页、详情快照缓存与本地存储层。
> 关联 Verifier：`test/unit/visited.spec.ts`、`test/unit/storage.spec.ts`、`test/acceptance/home-render.spec.ts`
> 执行命令：`bun verify --module home [--ac AC-HOME-NNN]`

---

## AC-HOME-001：最近查看

- **输入**：`app/lib/visited.ts` 的纯函数、`RecentVisited` 组件
- **预期输出**：按访问时间倒序、按类型去重的本地历史，首页最多展示 3 条并提供进入完整历史的入口
- **Pass 条件**：
  - `pushVisited`：新项置顶；同一 `type + id` 只保留一条并刷新时间戳；存储上限 `VISITED_LIMIT`（200）
  - `formatVisitedTime`：<1 分钟「刚刚」、<1 小时「N 分钟前」、<24 小时「N 小时前」、<7 天「N 天前」、更早「M月D日」
  - `visitedHref`：tweet → `/tweets/{id}`、ig → `/ins/{id}`、article → `/article/{id}`，id 做 URL 编码
  - `RecentVisited` 渲染为可点击链接，含类型图标、标题、摘要与相对时间；传入空列表时返回空串（不占位）
  - 首页取 `HOME_RECENT_LIMIT`（3）条，同一记录不重复出现；头部「全部」链接指向 `/history`
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
  - `recordVisited` 按 `type + id` 覆盖写入，`loadRecentVisited` / `loadVisitedHistory` 按时间倒序返回
  - 记录数超过 `VISITED_STORAGE_LIMIT`（200）时按时间淘汰最旧记录
  - 词典按 `id` 单条增删改查，读取按 `createdAt` 倒序
  - 首次启动把 localStorage 中的 `visited-store` / `translation-dictionary-storage` 迁移进 IndexedDB，迁移成功后删除旧键
  - IndexedDB 不可用或打开失败时降级为内存态，不抛错打断渲染

## AC-HOME-004：浏览历史页 `/history`

- **输入**：`app/routes/history.tsx`、`app/components/history/HistoryList.tsx`、`app/lib/visited.ts` 的 `filterVisited` / `groupVisitedByDay`
- **预期输出**：本机全部浏览记录（上限 200）的列表页，支持搜索、类型筛选、按日期分组与单条移除
- **Pass 条件**：
  - 关键词匹配标题与摘要、忽略大小写；类型筛选支持 全部 / 推文 / 长文 / IG；两者可叠加
  - 结果按 `今天 / 昨天 / 更早` 分组，空分组不渲染；组内保持访问时间倒序
  - 每行是链接（复用 `visitedHref`），带类型图标、标题、摘要与相对时间；移除按钮独立于链接，`aria-label` 含记录标题
  - 加载态用骨架；无记录与「筛选无结果」各自给空态与下一步；空列表组件返回空串
  - 搜索与类型写入 URL（`?q=`、`?type=`），来源不写客户端状态之外的副本
  - 清空需二次确认（`AlertDialog`），页面 `noindex`

## AC-HOME-005：详情快照缓存

- **输入**：`app/lib/snapshot.ts`、`app/lib/storage/snapshots.ts`、`app/lib/snapshot-restore.ts`、`app/hooks/use-persist-snapshot.ts`
- **预期输出**：IndexedDB `snapshots` store 保存完整详情，未过期时详情页跳过重复请求
- **Pass 条件**：
  - 主键与摘要一致（`${type}:${id}`），索引 `savedAt`；推文快照含 `tweets` + `translations`（+ 文章译文 / embeds），IG 快照含 `posts`
  - `isSnapshotFresh`：`savedAt` 在 `SNAPSHOT_TTL`（24h）内视为命中，过期视为未命中
  - 快照数量超过 `SNAPSHOT_LIMIT`（100）时按 `savedAt` 淘汰最旧
  - 摘要被淘汰、单条移除或清空时，同事务删除对应快照；`clearSnapshots` 不动摘要
  - `/tweets/:id` 与 `/ins/:id` 的客户端取数先读快照，命中即返回；恢复推文快照时同时回填 `tweets`、逐条译文与文章译文

---

## 变更约定

- 新增内容类型（如 List）时，同步 `VisitedItem` 的 `type`、`visitedHref` 与 `test/unit/visited.spec.ts`
- 首页区块顺序固定：输入卡 → 最近查看；新增区块不得插入输入卡之前
- 新增可缓存的详情类型时，同步 `SnapshotRecord` 联合类型与 `AC-HOME-005` 的字段清单
