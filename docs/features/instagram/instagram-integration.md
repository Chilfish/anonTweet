# Instagram 解析集成 — 实施追踪

> 创建时间：2026-05-31
> 分支：`integrate-instagram-parsing`

## 总览

将 `@chilfish/gallery-dl-instagram` SDK 集成到 Anon Tweet 中，实现类似 Twitter 推文的完整管线：输入 IG 链接 → 提取元数据 → AI 翻译 → 渲染（支持多图轮播）→ 截图/下载。

## 实施计划

| Phase   | 内容                                       | 状态    |
| ------- | ------------------------------------------ | ------- |
| Phase 1 | 类型定义 + URL 识别 + 路由框架             | ✅ 完成 |
| Phase 2 | API 层（SDK 集成 + BFF 路由）              | ✅ 完成 |
| Phase 3 | UI 组件（多图轮播 + 主贴卡片 + /ins 页面） | ✅ 完成 |
| Phase 4 | 翻译 + 截图 + 下载 接入                    | ✅ 完成 |
| Phase 5 | 纯文本路由 + 截图导出                      | ✅ 完成 |

## Phase 1 任务清单

- [x] `app/types/ins.ts` — IGPost / IGMedia 类型定义
- [x] `app/lib/utils.ts` — 新增 `extractIGId()` + `detectInputType()`
- [x] `app/components/tweet/TweetInputForm.tsx` — URL 类型识别 + IG 跳转
- [x] `app/routes/ins.tsx` — /ins/:id 路由（含 skeleton / not found）
- [x] `app/components/ins/` IGMediaCarousel + IGPostCard 组件
- [x] 类型检查 / lint（已有问题为项目预存，非本次引入）

## Phase 2 任务清单

- [x] `app/routes/api/ig/get.ts` — POST/GET API 路由 + normalizeIGPost()
- [x] `app/lib/env.server.ts` — 新增 `INS_COOKIES` 环境变量
- [x] `app/lib/localCache.ts` — CacheType 新增 `ig-post`
- [x] 依赖安装：`@chilfish/gallery-dl-instagram@0.2.2`
- [ ] `.env` 手动添加 `INS_COOKIES`（用户操作）

## Phase 3 任务清单

- [x] `app/components/ins/IGMediaCarousel.tsx` — 多图轮播（scroll-snap + 圆点指示器 + 左右箭头 + 移动端触控）
- [x] `app/components/ins/IGPostCard.tsx` — 主贴卡片（头像 + 媒体 + caption + 互动数据）
- [x] `app/routes/ins.tsx` — SWR 数据获取 + Skeleton/NotFound/正常 三态渲染
- [x] 移动端适配（scroll-snap 天然支持触控滑动）

## Phase 4 任务清单

- [x] `app/lib/translateIGCaption.ts` — IG caption AI 翻译（简化版，无实体占位符）
- [x] `app/hooks/use-ig-screenshot-action.ts` — modern-screenshot 截图 hook
- [x] `app/lib/igDownloader.ts` — extractIGDownloadItems 媒体下载提取器（复用 downloader.ts）

## Phase 5 任务清单

- [x] `app/routes/plain-ig.tsx` — SSR loader + Await 渲染（无 Layout chrome）
- [x] `app/components/ins/PlainIGPost.tsx` — 纯文本 IGPost 组件（头像 + 媒体 + caption）

## 变更文件总览

```
新增:
  app/types/ins.ts
  app/routes/ins.tsx
  app/routes/plain-ig.tsx
  app/routes/api/ig/get.ts
  app/components/ins/IGMediaCarousel.tsx
  app/components/ins/IGPostCard.tsx
  app/components/ins/PlainIGPost.tsx
  app/lib/translateIGCaption.ts
  app/hooks/use-ig-screenshot-action.ts
  docs/features/instagram/instagram-integration.md

修改:
  app/types/index.ts
  app/lib/utils.ts
  app/lib/env.server.ts
  app/components/tweet/TweetInputForm.tsx
  .env.example
```

## 日志

### 2026-05-31

- **14:25** 开始 Phase 1：类型定义 + URL 识别 + 路由框架
- **14:27** Phase 1 完成 ✅
  - 新增 `app/types/ins.ts` (IGPost / IGMedia 类型)
  - 新增 `app/lib/utils.ts` (`extractIGId` / `detectInputType`)
  - 改造 `TweetInputForm.tsx` 支持 IG URL 识别跳转
  - 新增 `app/routes/ins.tsx` (骨架 / Not Found 状态)
  - 新增 `app/components/ins/IGMediaCarousel.tsx` (scroll-snap 轮播)
  - 新增 `app/components/ins/IGPostCard.tsx` (头像 + 媒体 + caption)
  - 更新 `app/types/index.ts` 导出 IG 类型
- **14:28** Phase 2 完成 ✅
  - 安装 `@chilfish/gallery-dl-instagram@0.2.2`
  - 新增 `app/routes/api/ig/get.ts` (POST/GET + normalizeIGPost)
  - `env.server.ts` 新增 `INS_COOKIES`
  - `localCache.ts` 新增 `ig-post` 缓存类型
- **14:30** Phase 3 完成 ✅
  - `app/routes/ins.tsx` 接入 SWR → API → IGPostCard 完整数据流
  - Skeleton / NotFound / 正常三态渲染
- **14:31** Phase 4 完成 ✅
  - `app/lib/translateIGCaption.ts` — caption AI 翻译（无实体占位符简化版）
  - `app/hooks/use-ig-screenshot-action.ts` — modern-screenshot 截图
  - `app/lib/igDownloader.ts` — 媒体下载提取器
- **14:32** Phase 5 完成 ✅
  - `app/routes/plain-ig.tsx` — SSR 纯文本路由
  - `app/components/ins/PlainIGPost.tsx` — 纯净截图组件
- **14:32** 🎉 全部 5 个 Phase 完成
- **15:00** 🔄 设计大改：复用 UI 组件库 + 透卡相框风格 + Apple 折叠宫格
  - 19 files, +1097/-18
  - 0 lint errors, 所有 commit 通过 pre-commit hook
- **15:02** 设计重构完成 ✅
  - 删除 `IGPostCard` / `IGMediaCarousel`（自造轮子）
  - 新增 `IGCardHeader`（复用 Avatar）、`IGMediaGrid`（复用 MediaImage/MediaVideo）、`IGCaption`
  - 新增 `IGPhotoCard`（复用 Card）— 透卡相框整体
  - 更新 `PlainIGPost` 复用新子组件
  - 纯 shadcn/ui 体系，0 处自研 UI 原语
- **15:25** 🍎 精修第二轮：InsLogo + 圆点指示器 + 图标对齐 + 红心 + 时间格式
- **15:45** 🚀 PR 已创建 → https://github.com/Chilfish/anonTweet/pull/12
  - 九宫格 `grid-cols-3 gap-[1px]`（不再轮播）
  - `IGCardHeader` — 蓝勾认证 + 三点菜单（lucide-react）
  - `IGActionBar` — Heart/Comment/Share/Bookmark（outline 图标）
  - `IGCaption` — 始终展开 + `translatedText` 独立 prop（原文 black / 译文 gray）
  - `InstagramPostCard` — 主导出组件，透视卡相框 + 模糊互动层
  - Storybook: 14 个 story（单图到 12 图折叠、各子组件独立测试）
  - 全部 24 files, +1470/-18, 7 commits

## Story 支持（2026-09-12）

Story（`/stories/{username}/{id}/`）与 Highlight 的识别、抓取早已可用（URL 解析在三类 pattern 内，
路由按 `igId.includes('/')` 构造 stories URL），本轮补齐**标准化映射、专属渲染与缓存键一致性**：

- **提取下沉为纯函数**：`normalizeIGPost()` 从 `app/routes/api/ig/get.ts` 抽到
  `app/lib/ig/normalizeIGPost.ts`，`plain-ig.tsx` 的不完整副本（缺 audio/avatar/coauthors）删除并复用，
  消除两份映射漂移；新增 story 字段映射：`expires`、`highlight_title`、`storyLink`（`story_link_*`
  链接贴纸）、`resharedFrom`（`tagged_username`）。
- **渲染**：新增 `IGStoryMeta`（链接贴纸 / 精选标题 / 转发来源）；`PlainIGPost` 与
  `InstagramPostCard` 对 `type === 'story' | 'highlight'` **不渲染帖子互动栏**（点赞/评论/收藏），
  改渲染 Story 元信息。
- **缓存键一致性（缺陷修复）**：story 的请求键是 `username/story_id`，与 SDK `post.id`（shortcode）
  不同；此前 `insertToIGPostDB` 写 `post.id`、读取用请求键 → story/highlight 的 DB 缓存永久未命中。
  现统一以读取键写入；`ins.tsx` 的翻译回写也不再按 `p.id === igId` 匹配（单帖路由，改用 map）。
- **验收**：`AC-IG-STORY-001~003`（`test/acceptance/ac-ig-story.spec.ts`），AC 文档
  [`verify/acceptance-criteria/AC-ig-story.md`](../../../verify/acceptance-criteria/AC-ig-story.md)。

> ⚠️ **验证边界**：离线 fixture（`test/fixtures/ig-posts/story-*.json`）为按 SDK 类型契约构造的
> **合成输入**（沙箱无 `INS_COOKIES`，无法录制真实 payload），验证的是标准化映射行为，不代表上游
> 字段未漂移；真实链路仍由集成层 `AC-IG-008`（需 cookies）把关，上游改版时需同步更新 fixture。

## Story 列表：tray / 精选集（2026-09-12）

输入框此前只认 `/stories/{user}/{mediaId}/`，而且返回的 id 含 `/`，单段路由（`/ins/:id`、
`/api/ig/get/:id`）根本命中不了——单条 story 实际从未跑通。本轮把三种输入统一为**单段 canonical id**
（`~` 分隔，URL path 与 Windows 文件名都安全），并把列表型输入展开成**每个 item 一张卡**：

| 输入                         | canonical id     | 结果                             |
| ---------------------------- | ---------------- | -------------------------------- |
| `…/p/{sc}/`、`…/reel/{sc}/`  | `{sc}`           | 单卡（多图收进一张）             |
| `…/stories/{u}/{m}/`         | `story~{u}~{m}`  | 单卡                             |
| `…/stories/{u}/`             | `stories~{u}`    | **N 张卡**（该用户当前全部快拍） |
| `…/stories/highlights/{id}/` | `highlight~{id}` | **N 张卡**（精选集全部条目）     |

- **提取扇出**：`normalizeIGPosts()` 对 `story`/`highlight` 逐 `url` 消息产出一张 `IGPost`
  （`id` 即该 item 的 canonical 缓存键，`expires`/`created_at`/链接贴纸取该 item）；仅含音频的消息
  不再变成伪 media。普通 post/reel 行为不变。
- **取数**：`getIGPostList()` 每次新鲜拉取（列表本身不缓存——故事 24h 变化、也避免翻译后列表陈旧），
  但**每个 item 以自身 id 落 localCache + DB**，使每张卡可独立寻址。代价：每次列表访问一次 SDK
  `reels_media`。
- **渲染（下载优先）**：快拍/精选集用 `IGStoryList`——顶部「共 N 条 · 全选 · 下载选中(n) · 全部下载
  （带进度）」，每卡勾选框（**默认不选**）+ 媒体 + 链接贴纸/精选标题 + 时间 + 单条下载；快拍只保留
  下载，不套用帖子的截图/翻译/更多菜单（`IGHeader` 传 `storyMode` 后只留返回）。普通 post/reel 仍走
  `IGPostList` 单卡 + `IGHeader` 全套操作（行为不变）。下载文件名
  `ig-{username}-story-{media shortcode}.{ext}`（`extractIGStoryDownloadItems`）。
- **验收**：`AC-IG-STORY-001~005`（`test/acceptance/ac-ig-story.spec.ts`），文档
  [`verify/acceptance-criteria/AC-ig-story.md`](../../../verify/acceptance-criteria/AC-ig-story.md)。

> 需求口径（所有者）：快拍主要就是拿来**下载图片/视频**，翻译或截图不是需求点 → 列表只保留下载，
> 默认不勾选、手动选择后「下载选中」或直接「全部下载」。

> 未纳入本轮：列表级缓存（短 TTL）、`{username}/highlights/`（用户全部精选集）与 legacy base64 精选集 URL。

## Story 列表：网格相册与全屏查看器（2026-09-12）

上一轮的列表是 `flex flex-col gap-4` 的**竖排卡片**（每条一张 468px 卡 + 勾选框 + 页脚下载按钮）。
实测两个问题：**几十条快拍时一屏一条**，扫视性为零也不像「相册」；**loading 时闪的是帖子骨架**
（`IGPostSkeleton` 九宫格 + 点赞/评论/收藏 + caption 行），与快拍内容完全不匹配。

本轮按「Explore（浏览）+ 一次批量动作（下载）」的工作模式重排：**缩略图网格负责扫视，全屏查看器
负责细看与精确下载**，批量选择收敛为显式选择模式。

- **网格（`IGStoryGrid`）**：`grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1` 方图缩略图（吃满
  `Layout` 的 `max-w-3xl` 内容列）。格子是 `<button>`：浏览态 `aria-label="查看第 k 条快拍"`（点击
  开查看器），选择态 `选择第 k 条快拍` / `取消选择第 k 条快拍` + `aria-pressed` + `data-selected`。
  视频角标 `Play`，含 `storyLink` 的格子带「含链接贴纸」标记。缩略图复用 `IGMediaGrid` 导出的
  `getImageFitClass`（同一套「竖构图偏上裁切、不砍头」逻辑，避免两份漂移）。
- **全屏查看器（`IGStoryViewer`）**：受控遮罩层，直接组合 `DialogPrimitive.Portal/Backdrop/Popup`
  （**不复用** `DialogPopup`：它强制 `max-w-lg` + 圆角 + `row-start-2`，不是全屏形态）。顶栏
  `i / N` + 选择 + 关闭，主体 `object-contain` 全屏媒体（视频 `controls/playsInline/muted/autoPlay`），
  底栏 `IGStoryMeta`（`tone="overlay"`）+ 时间 + 下载。切条三通道：左右 44px 按钮、触摸横滑
  （|Δx|>40 且 |Δx|>|Δy|）、`←/→` 键；末条 ↔ 首条**环形**。相邻条目用隐藏 `<img>` 预热 CDN。
- **选择模式（`IGStoryList`）**：浏览态工具栏「共 N 条快拍 · 选择 · 全部下载（带进度）」；点「选择」
  进入多选，工具栏变「已选 n / N · 全选 ⇄ 取消全选 · 下载选中(n) · 取消」，退出时清空选择。工具栏
  `sticky top-0` + 背景模糊，长列表滚动时操作不丢。沿用 owner 口径：**默认不选、手动选择**。
- **快拍骨架（`IGStoryListSkeleton`）**：与加载后同形（工具栏占位 + 12 个方图 `Skeleton`，列数断点
  一致），消除加载完成时的布局跳动。`ins.tsx` 用纯函数 `isIGStoryLikeId()`（`url-detect.ts`，
  快拍族 = 单条 `story~` / tray `stories~` / 精选集 `highlight~`）在**请求发出前**判定骨架与
  `IGHeader` 的 `storyMode`，不再等数据回来才切换（也就不会有帖子操作按钮的闪现）。
- **纯逻辑下沉**：环形步进 `stepViewerIndex`、夹取 `clampViewerIndex`、选择 reducer
  `storySelectionReducer` 收敛到 `app/lib/ig/storyViewer.ts`。验收层是 node 环境 + `renderToString`
  （无 `@testing-library/react` / DOM 环境），交互组件只做调用，逻辑真源可离线断言。
- **移动端**：工具栏在手机上**贴底**（`order-last` + `sticky bottom-0`，拇指区，iOS 相册式），`sm` 起
  回到贴顶；上下栏留 `env(safe-area-inset-*)`，避免刘海 / Home 指示条压住序号与下载按钮；查看器
  `h-[100dvh]` 规避地址栏抖动并 `overscroll-contain`。切条在触屏走横滑（|Δx|>40 且 |Δx|>|Δy|，避免与
  纵向滚动抢手势），左右按钮保留给键盘/桌面 —— 它也是触屏读屏用户唯一可达的切条入口，故不按指针
  类型隐藏。
- **背景滚动锁交给 base-ui Dialog**（`useScrollLock`，含 iOS overlay-scrollbar 与滚动位置还原）：
  查看器内**不要**自行设 `body.overflow` —— base-ui 检测到页面已被作者锁住会主动退让（MutationObserver
  等待），反而在关闭之后才接管锁。该约束已内联在 `IGStoryViewer` 的注释里。
- **验收**：AC-IG-STORY-002（修订为网格形态）+ AC-IG-STORY-006（网格/骨架结构 + id 判定）+
  AC-IG-STORY-007（查看器导航与选择纯逻辑，unit 层）。

> ⚠️ **已知缺口（本次未处理）**：`app/root.tsx` 的 viewport meta 仍是 `width=device-width, initial-scale=1`，
> 没有 `viewport-fit=cover` —— 于是 `env(safe-area-inset-*)` 在真机上恒为 0，上面那些 safe-area padding
> 目前是 no-op（写法与既有 `ui/drawer.tsx` 一致，那里同样待生效）。补 `viewport-fit=cover` 是**全站布局**
> 变更（内容会顶到刘海区，需逐页确认 padding），要真机验收，不适合顺手改 —— 待有设备时单独处理。

> 明确非目标：不做虚拟滚动（30~60 条方图 + `MediaImage` 原生 `loading="lazy"` 足够，出现 200+ 条再议）；
> 不做按天分组/时间轴（额外信息噪音）；不引入 carousel 等新 UI 依赖。组件名保留 `IGStoryList`
> （仍是该 surface 入口，改名会牵动 AC/测试/story 的追溯链）。
