# 首页验收标准

> 版本：1.1 | 日期：2026-11-18
> 背景：首页精简后只剩输入框，缺少回访入口与产品范围提示。本组 AC 锁定「最近查看 / 继续阅读」本地历史、首页次级入口与本地存储层。
> 关联 Verifier：`test/unit/visited.spec.ts`、`test/unit/storage.spec.ts`、`test/acceptance/home-render.spec.ts`
> 执行命令：`bun verify --module home [--ac AC-HOME-NNN]`

---

## AC-HOME-001：最近查看与继续阅读

- **输入**：`app/lib/visited.ts` 的纯函数、`RecentVisited` / `ContinueReading` 组件
- **预期输出**：按访问时间倒序、按类型去重的本地历史，首页最多展示 5 条
- **Pass 条件**：
  - `pushVisited`：新项置顶；同一 `type + id` 只保留一条并刷新时间戳；上限 `VISITED_LIMIT`
  - `formatVisitedTime`：<1 分钟「刚刚」、<1 小时「N 分钟前」、<24 小时「N 小时前」、<7 天「N 天前」、更早「M月D日」
  - `visitedHref`：tweet → `/tweets/{id}`、ig → `/ins/{id}`、article → `/article/{id}`，id 做 URL 编码
  - `RecentVisited` 渲染为可点击链接，含类型图标、标题、摘要与相对时间；传入空列表时返回空串（不占位）
  - 首页最新一条由 `ContinueReading` 渲染成宽卡，其余进入 `RecentVisited`，同一记录不重复出现
  - 历史只写本机存储，不随请求发送、不上报服务端

## AC-HOME-002：首页搜索入口与能力提示

- **输入**：`TweetInputForm` 与 `CapabilityStrip` 的渲染结果
- **预期输出**：没有现成链接时也能从首页开始，并知道产品能力范围
- **Pass 条件**：
  - 输入卡提供 `/search` 入口（`没有链接？搜索推文`），渲染为可点击链接
  - 外壳不使用通栏 header：全局导航由底部悬浮簇提供（首页 / 搜索推文 / 设置），设置打开现有 `SettingsPanel`
  - 首页标题旁有朱印、输入卡下方有日付线；两者为装饰，朱印 `aria-hidden`，不承载业务数据
  - 能力提示只列真实存在的三项：AI 翻译 / 截图导出 / Markdown，无描述性副标题
  - 提示不使用 `<a>` 包裹无目标项（纯文本标签）

## AC-HOME-003：IndexedDB 本地存储层

- **输入**：`app/lib/storage/{db,visited,dictionary}.ts`
- **预期输出**：按记录读写的 IndexedDB 存储，替代 localStorage 整表重写
- **Pass 条件**：
  - `recordVisited` 按 `type + id` 覆盖写入，`loadRecentVisited` 按时间倒序返回
  - 记录数超过 `VISITED_STORAGE_LIMIT`（200）时按时间淘汰最旧记录
  - 词典按 `id` 单条增删改查，读取按 `createdAt` 倒序
  - 首次启动把 localStorage 中的 `visited-store` / `translation-dictionary-storage` 迁移进 IndexedDB，迁移成功后删除旧键
  - IndexedDB 不可用或打开失败时降级为内存态，不抛错打断渲染

---

## 变更约定

- 新增内容类型（如 List）时，同步 `VisitedItem` 的 `type`、`visitedHref` 与 `test/unit/visited.spec.ts`
- 首页区块顺序固定：输入卡 → 能力提示 → 继续阅读 → 最近查看；新增区块不得插入输入卡之前
