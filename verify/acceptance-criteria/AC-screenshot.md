# 截图导出验收标准

> 版本：1.1 | 日期：2026-08-09
> 对应 Postmortem：005 (Media), 008 (Fonts & Rendering)
> 关联 Verifier：`verify/modules/screenshot.verifier.ts`
> 执行命令：`bun verify --module screenshot [--ac AC-SHOT-NNN]`
>
> v1.1 修订：端点路径对齐 `app/routes.ts` 实际路由（`/plain` → `/plain-tweet/:id`，`/plain-ig` → `/plain-ins/:id`，query → 路径参数）；AC-SHOT-003 验证对象改为截图 hook 源码扫描。

---

## AC-SHOT-001：Tweet 截图端点可达

- **输入**：`GET /plain-tweet/:id`
- **预期输出**：返回 HTML 页面（用于截图渲染）
- **Pass 条件**：
  - HTTP 状态码 200
  - Content-Type 包含 `text/html`
  - 响应体包含 `<!DOCTYPE html>` 或 `<html`

---

## AC-SHOT-002：IG 截图端点可达

- **输入**：`GET /plain-ins/:id`
- **预期输出**：返回 HTML 页面
- **Pass 条件**：
  - HTTP 状态码 200
  - Content-Type 包含 `text/html`
  - 响应体包含 `<!DOCTYPE html>` 或 `<html`（配置 `INS_COOKIES` 时额外验证帖子关键内容）

---

## AC-SHOT-003：截图组件使用 waitForRenderReady

- **验证对象**：`app/hooks/use-screenshot-action.ts`（Tweet）和 `app/hooks/use-ig-screenshot-action.ts`（IG）源码扫描
- **预期内容**：截图流程调用 `waitForRenderReady` 等渲染就绪信号
- **Pass 条件**：
  - `waitForRenderReady` 在 `app/lib/utils.ts` 中定义
  - Tweet 截图 hook 使用 `waitForRenderReady`
  - IG 截图 hook 使用 `waitForRenderReady`

---

## AC-SHOT-004：字体加载不阻塞截图

- **验证对象**：`app/fonts.css` 字体加载策略
- **预期行为**：`app/fonts.css` 中的字体使用 `font-display: swap` 或等效策略
- **Pass 条件**：
  - 截图页面在无字体加载时仍可渲染
  - `app/fonts.css` 含 `font-display: swap`

---

## 总计：4 条 AC

| AC          | 分类         | 依赖外部服务 |
| ----------- | ------------ | ------------ |
| AC-SHOT-001 | 集成         | 是 (Twitter) |
| AC-SHOT-002 | 集成         | 是 (IG)      |
| AC-SHOT-003 | 静态代码检查 | 否           |
| AC-SHOT-004 | 静态代码检查 | 否           |
