# Instagram 集成验收标准

> 版本：1.2 | 日期：2026-08-09（v1.2 2026-09-12：F8 去 fixture 自证）
> 对应 Postmortem：007 (Instagram Integration)
> 关联 Verifier：`test/acceptance/ac-ig.spec.ts`（离线）/ `test/integration/api.ig.spec.ts`（集成）
> 执行命令：`bun run verify/index.ts --module ig [--ac AC-IG-NNN]`
>
> v1.1 修订（S9）：端点路径对齐真实路由 —— IG 帖子/故事统一走 `POST /api/ig/get/:id`（action handler 内置 stories 分支，无独立 stories 路由）；新增 AC-IG-007（Posts 端点集成）、AC-IG-008（Stories 端点集成）、AC-IG-009（未配置 cookies → 500）；AC-IG-006 语义与 next-steps 的「翻译 caption 不丢失」合并保留。
>
> v1.2 修订（F8，review-2026-09-11 P2-1）：AC-IG-006 改为**真实调用 `translateIGCaption`**
> （LLM 边界打桩），断言返回译文且不改写 `post.description`（原实现从不调用该函数）；
> AC-IG-001 增加 `extractIGId(url) === id` 交叉校验。AC-IG-001/002 的其余字段检查为
> **fixture 快照辅助检查**（真实 IG 解析在上游 SDK，离线无本地解析器可调），已如实标注。

---

## AC-IG-001：Post 类型解析完整性（fixture 快照 + URL 交叉校验）

- **输入**：`test/fixtures/ig-posts/post-with-media.json`
- **验证对象**：`extractIGId()` + fixture 结构
- **预期输出**：`IGPost` 结构包含所有核心字段，且 URL 可被解析回同一 shortcode
- **Pass 条件**：
  - `id`（shortcode）非空
  - `username` 非空
  - `description` 非空
  - `media` 数组长度 ≥ 1
  - `type` 为 `'post'`
  - `likes` ≥ 0
  - `extractIGId(post.url) === post.id`（真实纯函数交叉校验）
- **备注**：字段检查为**快照辅助检查**（上游 SDK 解析不在本仓库离线可测范围内）

---

## AC-IG-002：Media 数组结构正确（fixture 快照辅助检查）

- **输入**：同上 fixture
- **预期输出**：每条 `IGMedia` 结构正确
- **Pass 条件**：
  - 每条 media 有 `display_url`
  - `type` 为 `'photo'` 或 `'video'`
  - 视频类型的 media 有 `video_url`
  - `width > 0 && height > 0`
- **备注**：**fixture 快照辅助检查**，非解析器行为断言

---

## AC-IG-003：Stories URL 解析

- **输入**：stories 格式 ID `"username/story_id"`
- **验证对象**：`extractIGId()` + API 路由 URL 构造
- **预期输出**：生成正确的 stories URL
- **Pass 条件**：
  - `extractIGId("username/story_id")` 返回 `"username/story_id"`
  - 生成的 URL 为 `https://www.instagram.com/stories/username/story_id/`

---

## AC-IG-004：普通 Post URL 解析

- **输入**：普通 IG shortcode 如 `"DWlr-eBgVfR"`
- **验证对象**：`extractIGId()` + URL 构造
- **预期输出**：生成正确的 post URL
- **Pass 条件**：
  - `extractIGId("DWlr-eBgVfR")` 返回 `"DWlr-eBgVfR"`
  - 生成的 URL 为 `https://www.instagram.com/p/DWlr-eBgVfR/`

---

## AC-IG-005：时间格式化正确

- **输入**：IG post 的 `created_at` ISO 字符串
- **验证对象**：`formatIGTime(iso, 'card')` 和 `formatIGTime(iso, 'plain')`
- **预期输出**：两种模式返回不同格式
- **Pass 条件**：
  - 两种模式都返回非空字符串
  - `'card'` 格式 ≠ `'plain'` 格式
  - `'plain'` 格式包含年份数字

---

## AC-IG-006：Caption 翻译不破坏原文

- **输入**：IG post fixture（+ 中文 caption / 空 caption 变体）
- **验证对象**：`translateIGCaption()`（`app/lib/translateIGCaption.ts`，LLM 边界打桩）
- **预期输出**：返回译文串；`post.description` 全程不被改写
- **Pass 条件**：
  - 非中文 caption → 返回译文（`generateText` 打桩）
  - 已是中文 caption → 跳过翻译返回 `''`
  - 空 caption → 返回 `''`
  - 三种路径下 `post.description` 均保持不变

---

## AC-IG-007：Posts 端点集成（需 INS_COOKIES）

- **输入**：`POST /api/ig/get/:id`（真实 IG shortcode，如 fixture 的 `DWlr-eBgVfR`）
- **预期输出**：返回标准化的 IGPost 数组
- **Pass 条件**（集成，需 `--server` + `INS_COOKIES`）：
  - HTTP 状态码 200
  - 返回数组含 1 个 post，`id` 非空
  - `username` 非空、`media.length ≥ 1`
- **无 cookies / 无 server**：SKIP

---

## AC-IG-008：Stories 端点集成（需 INS_COOKIES）

- **输入**：`POST /api/ig/get/:username/:story_id`（stories 格式，action handler 构造 `/stories/…/…/` URL）
- **预期输出**：返回 `type: 'story'` 的 IGPost
- **Pass 条件**（集成，需 `--server` + `INS_COOKIES`）：
  - HTTP 状态码 200
  - 返回 post 的 `type` 为 `'story'`
- **无 cookies / 无 server**：SKIP

---

## AC-IG-009：未配置 cookies 返回 500

- **输入**：`POST /api/ig/get/:id`（`INS_COOKIES` 未配置的环境）
- **预期输出**：显式错误响应（不是静默 200 也不是崩溃）
- **Pass 条件**（集成，需 `--server`）：
  - HTTP 状态码 500
  - 响应体含 `INS_COOKIES` 相关错误信息
- **已配置 `INS_COOKIES`**：SKIP（该 AC 的前提不成立）

---

## 总计：9 条 AC

| AC        | 分类        | 依赖 INS_COOKIES   | 依赖 AI       | 依赖 server |
| --------- | ----------- | ------------------ | ------------- | ----------- |
| AC-IG-001 | 纯函数/离线 | 否                 | 否            | 否          |
| AC-IG-002 | 纯函数/离线 | 否                 | 否            | 否          |
| AC-IG-003 | 纯函数      | 否                 | 否            | 否          |
| AC-IG-004 | 纯函数      | 否                 | 否            | 否          |
| AC-IG-005 | 纯函数      | 否                 | 否            | 否          |
| AC-IG-006 | 纯函数/离线 | 否                 | 否（fixture） | 否          |
| AC-IG-007 | 集成        | 是                 | 否            | 是          |
| AC-IG-008 | 集成        | 是                 | 否            | 是          |
| AC-IG-009 | 集成        | 否（需无 cookies） | 否            | 是          |
