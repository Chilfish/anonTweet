# Instagram Story 接入验收标准

> 版本：1.1 | 日期：2026-09-12（v1.1：tray / 精选集列表 + URL 识别 + 下载优先列表）
> 关联 Verifier：`test/acceptance/ac-ig-story.spec.ts`
> 执行命令：`bun run verify/index.ts --module ig [--ac AC-IG-STORY-NNN]`
> 关联文档：`docs/features/instagram/instagram-integration.md` · `docs/planning/backlog.md`
> 关联 fixture：`test/fixtures/ig-posts/story-*.json` · `highlight-*.json` · `tray-multi.json`

> **输入形态与 canonical id**（单段，`~` 分隔；URL path 与 Windows 文件名都合法）
>
> | 输入                         | canonical id     | SDK 源 URL                   |
> | ---------------------------- | ---------------- | ---------------------------- |
> | `…/p/{sc}/`、`…/reel/{sc}/`  | `{sc}`           | `…/p/{sc}/`                  |
> | `…/stories/{u}/{m}/`         | `story~{u}~{m}`  | `…/stories/{u}/{m}/`         |
> | `…/stories/{u}/`             | `stories~{u}`    | `…/stories/{u}/`             |
> | `…/stories/highlights/{id}/` | `highlight~{id}` | `…/stories/highlights/{id}/` |
>
> 旧版单条 story id `{u}/{m}` 含 `/`，既命中不了 `/ins/:id`、`/api/ig/get/:id` 单段路由，
> 也会在 FS 缓存写出非法文件名 —— v1.0 的 story 实际上从未真正跑通，v1.1 一并修正。

> ⚠️ **数据来源限制（如实标注）**：001/002 的 fixture 是按 SDK `Message` / `ParsedPost` /
> `ParsedMedia` 类型契约构造的**合成消息流**（沙箱无 `INS_COOKIES` 时的离线回归；真实上游
> payload 已用 dotenv cookie 实测核对结构）。它验证的是**上游消息 → `IGPost[]` 的映射行为**，
> 不证明上游字段未漂移；真实上游链路仍由集成层 `AC-IG-008`（需 cookies）把关。

---

## AC-IG-STORY-001：Story 提取（消息流 → 纯函数标准化）

- **输入**：`story-with-link.json`（单条 story）· `highlight-with-title.json`（单条 highlight）·
  `tray-multi.json`（1 directory + 2 媒体 + 1 音频-only）
- **验证对象**：`normalizeIGPosts()` / `normalizeIGPost()`（`app/lib/ig/normalizeIGPost.ts`，纯函数）
- **预期输出**：`IGPost[]`
- **Pass 条件**：
  - 单条 story/highlight → 1 项：`type` 正确、`expires` / `storyLink` / `highlight_title` 映射、
    `description === ''`
  - **tray 扇出**：`tray-multi.json` → **2 项**（音频-only 消息被过滤，不产生伪 media）；
    每项 `media.length === 1`，`media[0].media_id` 与 `id` 分别对应两条媒体
  - 每项 `id` 为 canonical 缓存键（`story~chilfish~{media_id}`），`expires` / `created_at` 取该 item
- **验证方法**：行为断言（fixture 作**输入** → 调真实纯函数 → 断言产出）

---

## AC-IG-STORY-002：Story / 列表渲染（renderToString 行为断言）

- **输入**：AC-IG-STORY-001 的标准化产出 + 普通 post fixture（反证）
- **验证对象**：`PlainIGPost`（单卡）+ `IGStoryList`（tray / 精选集）
- **Pass 条件**：
  - story 卡**不渲染**互动栏（HTML 无 `aria-label="点赞"`）；渲染链接贴纸（`href` + 文案）
  - highlight 卡渲染 `highlight_title`
  - **列表**：`IGStoryList` 传 2 张 story → 工具栏含「条快拍 / 全选 / 下载选中 / 全部下载」，
    每卡 1 个勾选框（默认不选）+ 1 个单条下载按钮（`aria-label="下载该快拍"`）
  - **快拍列表只保留下载**：HTML 无 `aria-label="点赞"` / `更多选项` / `截图`
  - **反证**：普通 post 卡仍渲染互动栏
- **验证方法**：行为断言（真实渲染 HTML）

---

## AC-IG-STORY-003：缓存 / 持久化键一致性（服务层行为断言）

- **背景缺陷**：缓存读键为请求标识、写键曾用 `post.id`；对 post 两键恰好相等而掩盖，
  story 则 DB 缓存永久未命中。v1.0 已修（写读同键）。
- **Pass 条件**（打桩 `~/lib/localCache` 与 `~/lib/database/db.server`）：
  - 单帖路径：`getCachedIGPost(requestKey, getter)` 写 DB 的 `postShortcode === requestKey`
  - **列表路径**：`getIGPostList(getter)` 对**每个 item** 以**自身 canonical id** 写
    localCache + DB（`postShortcode === item.id`），保证 per-card 翻译端点
    （`/api/ig/translate/{post.id}`）能解析到该条目
  - 列表 item 若已有 `captionTranslation` 缓存 → 合并返回（不丢翻译）
- **验证方法**：行为断言（stub 边界，断言服务层写入的关键字段）

---

## AC-IG-STORY-004：Story URL 识别与源 URL 往返（纯函数）

- **输入**：各类 Instagram URL
- **验证对象**：`extractIGId()` / `isIGListId()` / `igIdToSourceUrl()`（`app/lib/url-detect.ts`）
- **Pass 条件**：
  - `…/stories/{u}/` → `stories~{u}`，`isIGListId === true`
  - `…/stories/highlights/{id}/` → `highlight~{id}`，`isIGListId === true`
  - `…/stories/{u}/{m}/` → `story~{u}~{m}`，`isIGListId === false`
  - `igIdToSourceUrl` 把三种 canonical id 还原成对应源 URL（往返一致）
  - **反证**：`…/p/{sc}/` 与 `…/reel/{sc}/` 仍返回 shortcode 且 `isIGListId === false`
- **验证方法**：行为断言（纯函数）

---

## AC-IG-STORY-005：下载项提取（纯函数）

- **输入**：AC-IG-STORY-001 的 tray 产出（1 图 + 1 视频）
- **验证对象**：`extractIGStoryDownloadItems()`（`app/lib/igDownloader.ts`）
- **Pass 条件**：
  - 每条 story 媒体 1 个下载项；文件名 `ig-{username}-story-{media shortcode}.{ext}`
    （不带 canonical id 的 `~`），视频取 `video_url`、扩展名 `mp4`
  - media 无可下载 url 时该条被跳过（不产出空 url 项）
- **验证方法**：行为断言（纯函数）

---

## 总计：5 条 AC

| AC              | 分类        | 依赖 INS_COOKIES | 依赖 AI | 依赖 server |
| --------------- | ----------- | ---------------- | ------- | ----------- |
| AC-IG-STORY-001 | 纯函数/离线 | 否               | 否      | 否          |
| AC-IG-STORY-002 | 渲染/离线   | 否               | 否      | 否          |
| AC-IG-STORY-003 | 服务层/离线 | 否               | 否      | 否          |
| AC-IG-STORY-004 | 纯函数/离线 | 否               | 否      | 否          |
| AC-IG-STORY-005 | 纯函数/离线 | 否               | 否      | 否          |
