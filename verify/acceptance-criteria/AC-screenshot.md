# 截图导出验收标准

> 版本：1.0 | 日期：2026-07-04
> 对应 Postmortem：005 (Media), 008 (Fonts & Rendering)
> 关联 Verifier：`verify/modules/screenshot.verifier.ts`
> 执行命令：`bun verify --module screenshot [--ac AC-SHOT-NNN]`

---

## AC-SHOT-001：Tweet 截图端点可达

- **输入**：`GET /plain?tweetId=...`
- **预期输出**：返回 HTML 页面（用于截图渲染）
- **Pass 条件**：
  - HTTP 状态码 200
  - Content-Type 包含 `text/html`
  - 响应体包含 `<!DOCTYPE html>` 或 `<html`

---

## AC-SHOT-002：IG 截图端点可达

- **输入**：`GET /plain-ig?igId=...`
- **预期输出**：返回 HTML 页面
- **Pass 条件**：
  - HTTP 状态码 200
  - Content-Type 包含 `text/html`
  - 响应体包含 IG 帖子的关键内容

---

## AC-SHOT-003：截图组件使用 waitForRenderReady

- **验证对象**：`app/routes/plain.tsx` 和 `app/routes/plain-ig.tsx`
- **预期内容**：组件代码中包含 `waitForRenderReady` 或等效渲染就绪信号
- **Pass 条件**：
  - Tweet 截图组件使用 `waitForRenderReady`
  - IG 截图组件使用 `waitForRenderReady`
  - 渲染完成后发送 `render-ready` 信号

---

## AC-SHOT-004：字体加载不阻塞截图

- **验证对象**：截图组件中的字体加载策略
- **预期行为**：`app/fonts.css` 中的字体使用 `font-display: swap` 或等效策略
- **Pass 条件**：
  - 截图页面在无字体加载时仍可渲染
  - 使用 `font-display: swap`（或测试中 mock 字体加载失败后仍可截图）

---

## 总计：4 条 AC

| AC          | 分类         | 依赖外部服务 |
| ----------- | ------------ | ------------ |
| AC-SHOT-001 | 集成         | 是 (Twitter) |
| AC-SHOT-002 | 集成         | 是 (IG)      |
| AC-SHOT-003 | 静态代码检查 | 否           |
| AC-SHOT-004 | 静态代码检查 | 否           |
