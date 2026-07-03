# Instagram 集成验收标准

> 版本：1.0 | 日期：2026-07-04
> 对应 Postmortem：007 (Instagram Integration)
> 关联 Verifier：`verify/modules/ig.verifier.ts`
> 执行命令：`bun verify --module ig [--ac AC-IG-NNN]`

---

## AC-IG-001：Post 类型解析完整性

- **输入**：`verify/fixtures/ig-posts/post-with-media.json`
- **验证对象**：`normalizeIGPost()` 函数
- **预期输出**：`IGPost` 结构包含所有核心字段
- **Pass 条件**：
  - `id`（shortcode）非空
  - `username` 非空
  - `description` 非空
  - `media` 数组长度 ≥ 1
  - `type` 为 `'post'`
  - `likes` ≥ 0

---

## AC-IG-002：Media 数组结构正确

- **输入**：同上 fixture
- **预期输出**：每条 `IGMedia` 结构正确
- **Pass 条件**：
  - 每条 media 有 `display_url`
  - `type` 为 `'photo'` 或 `'video'`
  - 视频类型的 media 有 `video_url`
  - `width > 0 && height > 0`

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

- **输入**：IG post fixture
- **验证对象**：翻译后 `post.description` 不变，`post.captionTranslation` 存放译文
- **Pass 条件**：
  - 翻译前后 `post.description` 不变
  - 翻译成功后 `post.captionTranslation` 非空
  - `captionTranslation !== description`

---

## 总计：6 条 AC

| AC        | 分类        | 依赖 INS_COOKIES | 依赖 AI |
| --------- | ----------- | ---------------- | ------- |
| AC-IG-001 | 纯函数/离线 | 否               | 否      |
| AC-IG-002 | 纯函数/离线 | 否               | 否      |
| AC-IG-003 | 纯函数      | 否               | 否      |
| AC-IG-004 | 纯函数      | 否               | 否      |
| AC-IG-005 | 纯函数      | 否               | 否      |
| AC-IG-006 | 集成        | 否（fixture）    | 是      |
