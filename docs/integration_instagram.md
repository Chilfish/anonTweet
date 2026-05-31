# Instagram 解析集成 — 实施追踪

> 创建时间：2026-05-31
> 分支：`integrate-instagram-parsing`

## 总览

将 `@chilfish/gallery-dl-instagram` SDK 集成到 Anon Tweet 中，实现类似 Twitter 推文的完整管线：输入 IG 链接 → 提取元数据 → AI 翻译 → 渲染（支持多图轮播）→ 截图/下载。

## 实施计划

| Phase | 内容 | 状态 |
|-------|------|------|
| Phase 1 | 类型定义 + URL 识别 + 路由框架 | ✅ 完成 |
| Phase 2 | API 层（SDK 集成 + BFF 路由） | 🔄 进行中 |
| Phase 3 | UI 组件（多图轮播 + 主贴卡片 + /ins 页面） | ⬜ 待开始 |
| Phase 4 | 翻译 + 截图 + 下载 接入 | ⬜ 待开始 |
| Phase 5 | 纯文本路由 + 截图导出 | ⬜ 待开始 |

## Phase 1 任务清单

- [x] `app/types/ins.ts` — IGPost / IGMedia 类型定义
- [x] `app/lib/utils.ts` — 新增 `extractIGId()` + `detectInputType()`
- [x] `app/components/tweet/TweetInputForm.tsx` — URL 类型识别 + IG 跳转
- [x] `app/routes/ins.tsx` — /ins/:id 路由（含 skeleton / not found）
- [x] `app/components/ins/` IGMediaCarousel + IGPostCard 组件
- [x] 类型检查 / lint（已有问题为项目预存，非本次引入）

## Phase 2 任务清单

- [ ] `app/routes/api/ig/get.ts` — POST API 路由
- [ ] `normalizeIGPost()` — SDK 消息 → IGPost 标准化
- [ ] `.env` 新增 `INS_COOKIES`
- [ ] `app/lib/env.server.ts` 暴露环境变量
- [ ] 依赖安装：`@chilfish/gallery-dl-instagram`
- [ ] 类型检查 + lint 通过

## Phase 3 任务清单

- [ ] `app/components/ins/IGMediaCarousel.tsx` — 多图轮播（scroll-snap + 圆点指示器）
- [ ] `app/components/ins/IGPostCard.tsx` — 主贴卡片（头像 + caption + 媒体）
- [ ] `app/routes/ins.tsx` — 完整页面（SWR 数据获取 + 渲染）
- [ ] 移动端适配
- [ ] 类型检查 + lint 通过

## Phase 4 任务清单

- [ ] `app/lib/translateIGCaption.ts` — IG caption AI 翻译
- [ ] `app/hooks/use-ig-screenshot-action.ts` — 截图 hook
- [ ] IG 媒体下载（复用 downloader.ts）
- [ ] 类型检查 + lint 通过

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
- **14:28** 进入 Phase 2：API 层集成
