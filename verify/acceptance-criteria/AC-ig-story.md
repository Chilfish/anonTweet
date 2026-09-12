# Instagram Story 接入验收标准

> 版本：1.0 | 日期：2026-09-12
> 关联 Verifier：`test/acceptance/ac-ig-story.spec.ts`
> 执行命令：`bun run verify/index.ts --module ig [--ac AC-IG-STORY-NNN]`
> 关联文档：`docs/features/instagram/instagram-integration.md` · `docs/planning/backlog.md`
> 关联 fixture：`test/fixtures/ig-posts/story-*.json`

> ⚠️ **数据来源限制（如实标注）**：AC-IG-STORY-001 的 fixture 是**按 SDK
> `@chilfish/gallery-dl-instagram` 的 `Message` / `ParsedPost` / `ParsedMedia` 类型契约构造的
> 合成消息流**（开发/沙箱环境无 `INS_COOKIES`，无法录制真实上游 payload）。因此它验证的是
> **上游消息 → `IGPost` 的标准化映射行为**，**不**证明上游字段未漂移。真实上游链路仍由
> 集成层 `AC-IG-008`（需 cookies，`POST /api/ig/get/:username/:story_id`）把关；上游改版时
> 需同步更新 fixture（维护成本见 backlog 风险备注）。

---

## AC-IG-STORY-001：Story 提取（合成消息流 → 纯函数标准化）

- **输入**：`test/fixtures/ig-posts/story-with-link.json`（1 条 `directory` + 1 条 `url` 的 SDK 消息流）
- **验证对象**：`normalizeIGPost()`（`app/lib/ig/normalizeIGPost.ts`，纯函数）
- **预期输出**：`IGPost` 结构，`type === 'story'`，story 专属字段被映射
- **Pass 条件**：
  - `type === 'story'`，`media.length === 1`，media `display_url` 非空
  - `expires` 非空（取自 directory 元数据 `expires`）
  - `description === ''`（story 通常无 caption，不得被改写为其他值）
  - `storyLink.url` / `storyLink.title` 非空（取自 url 消息的 `story_link_*`）
  - `highlight_title` 为 `undefined`（仅 highlight 有）
- **highlight 变体**：`highlight-with-title.json` → `type === 'highlight'` 且 `highlight_title` 非空
- **验证方法**：行为断言（fixture 作**输入** → 调真实纯函数 → 断言产出），非 fixture 快照自证

---

## AC-IG-STORY-002：Story 渲染（renderToString 行为断言）

- **输入**：AC-IG-STORY-001 的标准化产出（story / highlight）+ 普通 post fixture 作反证
- **验证对象**：`PlainIGPost`（`renderToString`）
- **预期输出**：story 卡按 Story 语义渲染，不套用帖子专属互动区
- **Pass 条件**：
  - story 卡**不渲染**互动栏（HTML 无 `aria-label="点赞"`）
  - story 卡渲染链接贴纸（`href` 指向 `story_link_url`，含 `story_link_title` 文案）
  - highlight 卡渲染 `highlight_title` 文案
  - **反证**：普通 post 卡**仍渲染**互动栏 —— 证明分支真实存在，而非恒真/恒假断言
- **验证方法**：行为断言（真实渲染 HTML）

---

## AC-IG-STORY-003：Story 缓存键一致性（服务层行为断言）

- **输入**：`getCachedIGPost('username/story_id', getter)`，getter 返回的 story `id`（SDK shortcode）与请求键**不一致**
- **背景缺陷**：缓存读键为 URL 标识 `username/story_id`，而 DB 写入键此前用 `post.id`
  （story 的 SDK shortcode）→ story/highlight 的 DB 缓存**永久未命中**（post 因两键恰好相等而掩盖）
- **预期输出**：DB upsert 的 `postShortcode` === 请求键
- **Pass 条件**（打桩 `~/lib/localCache` 与 `~/lib/database/db.server`）：
  - 缓存未命中时 getter 被调用，且 DB upsert 收到 `postShortcode === 'username/story_id'`
  - **反证**：普通 post（请求键 === `post.id`）写入键仍等于 `post.id`（行为不回归）
- **验证方法**：行为断言（stub 边界，断言服务层写入的关键字段）

---

## 总计：3 条 AC

| AC              | 分类        | 依赖 INS_COOKIES | 依赖 AI | 依赖 server |
| --------------- | ----------- | ---------------- | ------- | ----------- |
| AC-IG-STORY-001 | 纯函数/离线 | 否               | 否      | 否          |
| AC-IG-STORY-002 | 渲染/离线   | 否               | 否      | 否          |
| AC-IG-STORY-003 | 服务层/离线 | 否               | 否      | 否          |
