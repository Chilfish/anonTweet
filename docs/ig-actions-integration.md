# Instagram 操作区 + DB 缓存 — 实施追踪

> 创建时间：2026-05-31
> 基于分支：`integrate-instagram-parsing`

## 总览

将 Twitter 推文页面已有的操作区（翻译、截图、下载、设置、复制文本、DB 缓存）完整移植到 Instagram 帖子页面。

## 当前状态

Twitter 的 `tweet.tsx` 在页面顶部有 `TweetHeader` 操作栏：

- `BackButton` — 返回首页
- `FilterUnrelatedToggle` — 评论筛选（IG 暂无评论区，不移植）
- "加载评论" 按钮 — （IG 暂无评论 API，不移植）
- `ToggleTransButton` — 翻译模式切换
- `SaveAsImageButton` — 截图导出
- `TweetOptionsMenu` — 设置/下载/复制 MD/复制文本/布局切换

IG 的 `ins.tsx` 只有 `InstagramPostCard`，缺少全部操作入口。但基础设施已在 Phase 4 实现：

- `translateIGCaption.ts` — 翻译管线 ✅（未接入 API）
- `use-ig-screenshot-action.ts` — 截图 hook ✅（未接入 UI）
- `igDownloader.ts` — 下载提取器 ✅（未接入 UI）
- `plain-ig.tsx` — 纯文本路由 ✅（无触发入口）

## 实施计划

| Phase   | 内容                                                | 状态    |
| ------- | --------------------------------------------------- | ------- |
| Phase 1 | IGHeader 组件 + useIGOperations hook + ins.tsx 接入 | ✅ 完成 |
| Phase 2 | DB 缓存（ig_post 表 + 服务层）                      | ✅ 完成 |
| Phase 3 | API 层翻译接入 + AI 翻译管线打通                    | ✅ 完成 |
| Phase 4 | typecheck / lint / 精修                             | ✅ 完成 |

## Phase 1 任务清单

- [x] `app/hooks/use-ig-operations.ts` — IG 操作 hook（截图/下载/复制文本/复制 MD）
- [x] `app/components/ins/IGHeader.tsx` — 页面顶部操作栏
- [x] `app/components/ins/IGOptionsMenu.tsx` — 三点菜单（设置/下载/复制）
- [x] `app/components/ins/IGTranslateToggle.tsx` — 翻译模式切换按钮
- [x] `app/components/ins/IGScreenshotButton.tsx` — 截图按钮
- [x] `app/routes/ins.tsx` — 接入 IGHeader（覆盖所有渲染状态）
- [x] `app/components/ins/InstagramPostCard.tsx` — forwardRef + translationMode prop

## Phase 2 任务清单

- [x] `app/lib/database/schema.ts` — 新增 `ig_post` 表
- [x] `drizzle/0001_fluffy_amphibian.sql` — 迁移 SQL（自动生成）
- [x] `app/lib/service/getIGPost.server.ts` — DB 缓存层（三层：localCache → DB → SDK）

## Phase 3 任务清单

- [x] `app/routes/api/ig/get.ts` — 接入 DB 缓存 + AI 翻译管线
- [x] `app/routes/ins.tsx` — 客户端翻译状态管理 + translationMode prop

## Phase 4 任务清单

- [x] `bun run typecheck` — 新代码零类型错误（全部预存问题）
- [x] `bun run lint` — 修复 `_error` unused 警告
- [x] `drizzle-kit generate` — 迁移文件生成

## 变更文件总览

```
新增:
  app/hooks/use-ig-operations.ts
  app/components/ins/IGHeader.tsx
  app/components/ins/IGOptionsMenu.tsx
  app/components/ins/IGTranslateToggle.tsx
  app/components/ins/IGScreenshotButton.tsx
  app/lib/service/getIGPost.server.ts
  app/routes/api/ig/translate.ts
  docs/ig-actions-integration.md

修改:
  app/routes/ins.tsx
  app/routes/api/ig/get.ts
  app/lib/database/schema.ts
  app/components/ins/InstagramPostCard.tsx  (截图 ref + 翻译 props 透传)
  app/components/ins/IGCaption.tsx  (翻译按钮)
```

## 日志

### 2026-05-31

- **16:50** 分析现状，确认 Phase 4 已有基础设施（翻译/截图/下载）未接入 UI
- **16:53** 创建 `docs/ig-actions-integration.md` 实施追踪文档
- **16:54** Phase 1 完成 ✅ — IGHeader + 4 个子组件 + useIGOperations hook + InstagramPostCard ref + ins.tsx 全状态接入
- **16:55** Phase 2 完成 ✅ — `ig_post` DB 表 + 迁移 SQL + `getIGPost.server.ts` 三层缓存
- **16:56** Phase 3 完成 ✅ — API 路由接入 DB 缓存 + AI 翻译管线（ProviderStrategy）
- **16:57** Phase 4 完成 ✅ — typecheck 零新错误 + lint 修复 + drizzle-kit generate
- **17:00** 拆分 commit：Phase 1 UI + Phase 2/3 缓存翻译，Conventional Commits 规范
- **17:19** Phase 5：IGCaption 内联翻译按钮 + AI 翻译管线 + DB 写回
  - `app/components/ins/IGCaption.tsx` — 新增 `Languages` 图标按钮（loading spinner / 重新翻译）
  - `app/routes/api/ig/translate.ts` — 新增翻译端点（读缓存 → 翻译 → 写回 DB + localCache）
  - `app/lib/service/getIGPost.server.ts` — 新增 `updateIGPostTranslation`
  - `app/routes/ins.tsx` — `useAIConfig` hook + `handleTranslateCaption` + SWR mutate 本地缓存更新
  - `app/components/ins/InstagramPostCard.tsx` — 透传 `isTranslatingCaption` / `onTranslateCaption`
- **17:20** commit: `feat(ins): add inline translate button with AI translation and DB cache write-back`
