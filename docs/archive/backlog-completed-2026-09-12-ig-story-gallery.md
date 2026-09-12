# Backlog 归档：Instagram Story 列表 → 网格相册 + 全屏查看器 2026-09-12

> **状态**：已完成（AC-IG-STORY-002 修订 + 006/007 新增，门禁全绿）
> **来源**：所有者实测反馈（几十条快拍竖排「一屏一条」，且 loading 闪的是帖子骨架）
> **实施记录**：`docs/development-log/2026-09-12.md`；**功能文档**：`docs/features/instagram/instagram-integration.md`
> §Story 列表：网格相册与全屏查看器
>
> 承接 [backlog-completed-2026-09-12-ig-story-list.md](backlog-completed-2026-09-12-ig-story-list.md)
> （列表型输入 + 下载优先列表），本轮把「竖排卡片」改成相册形态，并补上快拍专属骨架屏与移动端适配。

## 完成内容

- [x] `AC-IG-STORY-006`（网格浏览/选择态结构 + 骨架屏 + `isIGStoryLikeId`）+
      `AC-IG-STORY-007`（查看器导航/选择纯逻辑，unit 层）；`AC-ig-story.md` v1.2（002 修订为网格形态）
- [x] `IGStoryGrid`：`grid-cols-3 sm:grid-cols-4 md:grid-cols-5` 方图缩略图；浏览态点格开查看器、
      选择态点格勾选（`aria-pressed` + `data-selected`）；视频 Play 角标、链接贴纸标记；复用
      `IGMediaGrid` 导出的 `getImageFitClass`（一套竖构图裁切逻辑）
- [x] `IGStoryViewer`：全屏遮罩（组合 `DialogPrimitive`，不复用 `DialogPopup`）；`i / N` + 选择 + 关闭；
      `object-contain` 媒体；底栏元信息（`tone="overlay"`）+ 时间 + 下载；**三通道切条**
      （左右按钮 / 触屏横滑 / ←→ 键）末条 ↔ 首条环形；相邻条目预热
- [x] 显式选择模式：浏览态「共 N 条快拍 · 选择 · 全部下载（进度）」→ 选择态「已选 n/N · 全选 ·
      下载选中(n) · 取消」，退出清空；沿用 owner 口径（默认不选、手动选择）
- [x] `IGStoryListSkeleton`：与加载后同形（工具栏占位 + 12 方图 + 同列数断点），消除加载完成跳动；
      `ins.tsx` 用 `isIGStoryLikeId()` 在**请求发出前**选定骨架与 `storyMode`
- [x] 纯逻辑下沉 `app/lib/ig/storyViewer.ts`（`stepViewerIndex` / `clampViewerIndex` /
      `storySelectionReducer`）——node 验收层无 DOM，交互组件只做调用，逻辑真源可离线断言
- [x] 移动端：工具栏**贴底**（拇指区）+ `env(safe-area-inset-*)` + `h-[100dvh]` + `overscroll-contain`；
      触屏横滑与纵向滚动不抢手势
- [x] 门禁：`typecheck` / `lint` / `test` 396 / `verify --module ig` / `build-storybook` 全绿；
      **SSR 冒烟双向对照**（story URL 出网格骨架、post URL 仍出帖子骨架）

## 关键决策

- **网格 + 全屏查看器**（而非保留竖排卡片或改成横向 story 条）：工作模式是 Explore（扫视）+ 一次批量
  动作（下载）——网格负责扫视，查看器负责细看与精确下载。
- **显式选择模式**（iOS 相册式）而非每格常驻勾选框：浏览态格子保持干净，且「点击是打开还是勾选」无歧义。
- **保留组件名 `IGStoryList`**：它仍是该 surface 的入口；改名会牵动 AC/测试/story 的追溯链，收益不足。
- **单条快拍保留自然比例单卡**：一个孤零零的方图缩略图不成相册，单卡 + 查看器更合理。

## 已知取舍 / 剩余

- **不做虚拟滚动**：30~60 条方图 + `MediaImage` 原生 `loading="lazy"` 足够；出现 200+ 条再议。
- **不做按天分组 / 时间轴**：额外信息噪音，与「克制」口径冲突。
- **`viewport-fit=cover` 未补**：`app/root.tsx` 的 viewport meta 没有它 → `env(safe-area-inset-*)`
  在真机恒为 0，本轮的 safe-area padding 目前是 no-op（与既有 `ui/drawer.tsx` 同样的待生效状态）。
  补它是**全站布局**变更（内容会顶到刘海区，需逐页确认 padding），要真机验收，待有设备时单独处理。
- **查看器左右切条按钮在触屏保留**：它是触屏读屏用户唯一可达的切条入口，故不按指针类型隐藏
  （代价：视觉上压在图上）。
- **真实链路仍由 `AC-IG-008` 把关**（需 cookies）：合成 fixture 只证明映射与渲染行为，不代表上游未漂移。
