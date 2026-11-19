# Instagram 集成验收标准

> 版本：1.6 | 日期：2026-11-19（v1.6：新增 AC-IG-011 IG caption 一律翻译；v1.5：新增 AC-IG-010 单图占位比例；v1.4：AC-IG-003 单条 story id 改为 canonical `story~{user}~{media}`，
> 列表型 tray/精选集见 [AC-ig-story.md](AC-ig-story.md)；v1.3：Story 接入 AC 单列；v1.2：F8 去 fixture 自证）
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
  - `extractIGId("https://www.instagram.com/stories/testuser/12345/")` 返回 canonical `"story~testuser~12345"`
  - 由 `igIdToSourceUrl()` 生成的 URL 为 `https://www.instagram.com/stories/testuser/12345/`
- **备注**：v1.4 起单条 story id 由 `username/story_id` 改为单段 canonical id（含 `/` 的旧值
  命中不了 `/ins/:id`、`/api/ig/get/:id` 单段路由）；用户级 tray / 精选集列表见 `AC-IG-STORY-004`

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
  - 中文 caption → 同样返回译文（IG 不做中文跳过）
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

## AC-IG-010：单图媒体占位比例（骨架 / 加载失败不塌陷）

- **输入**：`test/fixtures/ig-posts/post-with-media.json` 的首条 media（1440×1920）
- **验证对象**：`IGMediaGrid` 单图分支（`renderToString`）
- **背景**：单图没有网格格子兜底，容器高度此前取决于 `<img>` 固有尺寸——图片未就绪时约等于一行文字高，骨架塌成一条细灰带；加载完成后才撑开，卡片整体跳动
- **预期输出**：单图容器在图片就绪前就按 `width / height` 锁定 `aspect-ratio`
- **Pass 条件**：
  - 单图渲染含 `aspect-ratio: 0.75`（1440/1920）
  - 单图加载态仍渲染 `data-slot="skeleton"`
  - 多图网格不套用单图比例（仍为 `aspect-square` 格子）
- **备注**：`width` 优先、缺失时回退 `width_original`；两者都缺失时保持原有（自然比例）行为

---

## AC-IG-011：IG caption 一律翻译（不做中文跳过检测）

- **输入**：`post-with-media.json`，caption 分别改为纯汉字日文 `本日発売`、纯中文 `这是中文说明`、空串
- **验证对象**：`translateIGCaption()`（LLM 边界打桩）
- **背景**：旧实现用汉字比例判断「已是中文」并跳过翻译，但纯汉字日文（本日発売 / 新曲公開）
  会被误判为中文——直接返回空串、一次请求都不发，调用方再把空结果当成失败
  （`Translation returned empty`）。实际场景中 IG 帖子一律需要翻译，该启发式只会误伤
- **预期输出**：有 caption 就调用模型；只有无 caption 才返回空串且不发请求
- **Pass 条件**：
  - 纯汉字日文 → 调用 `generateText` 并返回译文
  - 纯中文 → 同样调用 `generateText` 并返回译文
  - 空 caption → 返回 `''`，且 `generateText` 未被调用
- **备注**：`isChinese()` 仍保留给视觉 OCR 使用（含假名即判为日文），不再参与 IG 翻译

---

## 总计：11 条 AC

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
| AC-IG-010 | 渲染/离线   | 否                 | 否            | 否          |
| AC-IG-011 | 纯函数/离线 | 否                 | 否（打桩）    | 否          |
