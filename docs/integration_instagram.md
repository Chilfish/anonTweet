# Instagram 解析集成 — 实施追踪

> 创建时间：2026-05-31
> 分支：`integrate-instagram-parsing`

## 总览

将 `@chilfish/gallery-dl-instagram` SDK 集成到 Anon Tweet 中，实现类似 Twitter 推文的完整管线：输入 IG 链接 → 提取元数据 → AI 翻译 → 渲染（支持多图轮播）→ 截图/下载。

## 实施计划

| Phase | 内容 | 状态 |
|-------|------|------|
| Phase 1 | 类型定义 + URL 识别 + 路由框架 | ✅ 完成 |
| Phase 2 | API 层（SDK 集成 + BFF 路由） | ✅ 完成 |
| Phase 3 | UI 组件（多图轮播 + 主贴卡片 + /ins 页面） | ✅ 完成 |
| Phase 4 | 翻译 + 截图 + 下载 接入 | ✅ 完成 |
| Phase 5 | 纯文本路由 + 截图导出 | ⬜ 待开始 |

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

- [ ] `app/routes/plain-ig.tsx` — 纯文本路由
- [ ] `app/components/ins/PlainIGPost.tsx` — 纯文本组件
- [ ] 类型检查 + lint 通过

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
  docs/integration_instagram.md

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
