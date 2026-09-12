# Backlog 归档：Instagram Story 接入（2026-09-12）

> **状态**：已完成（AC-IG-STORY-001~003 落地，门禁全绿）
> **来源**：`docs/planning/backlog.md`「下一阶段候选」原条目
> **实施记录**：`docs/development-log/2026-09-12.md`；**功能文档**：`docs/features/instagram/instagram-integration.md` §Story 支持
>
> 原条目：「[ux] Instagram Story 接入（关联：review-2026-08-17 不做清单末行；文件：`app/routes/api/ig/get.ts`
> 扩展、`IGCaption`/`PlainIGPost` 渲染；前置：SDK `@chilfish/gallery-dl-instagram` 已验证；先写
> `AC-IG-STORY` + fixture 再实现；风险：中，上游接口漂移需 fixture 维护余量）」

## 完成内容

- [x] `AC-IG-STORY-001~003` + 独立 AC 文档 `verify/acceptance-criteria/AC-ig-story.md`（先写 AC 后实现）
- [x] 合成消息流 fixture：`test/fixtures/ig-posts/story-with-link.json` / `highlight-with-title.json`
- [x] `normalizeIGPost()` 下沉 `app/lib/ig/normalizeIGPost.ts`（纯函数），`api/ig/get.ts` 与 `plain-ig.tsx`
      共用；新增 `expires` / `highlight_title` / `storyLink` / `resharedFrom` 映射与 `IGStoryLink` 类型
- [x] `IGStoryMeta` 组件 + `PlainIGPost`/`InstagramPostCard` story 分支（无帖子互动栏）
- [x] 缓存键一致性缺陷修复：`insertToIGPostDB` 统一用读取请求键；`ins.tsx` 翻译回写按单帖 map
- [x] 验证：`typecheck` / `lint` / `test` 378 / `verify --exit-on-fail`（386 passed）/ `build-storybook` 全绿

## 剩余（如实登记）

- **真实上游录制复核**：离线 fixture 为按 SDK 类型契约构造的**合成输入**（沙箱无 `INS_COOKIES`），
  真实链路由集成层 `AC-IG-008`（需 cookies）把关；上游 IG 改版时需同步更新 fixture 与映射
  （即原条目标注的「上游接口漂移需 fixture 维护余量」）。
