# 截图导出验收标准

> 版本：1.2 | 日期：2026-08-17
> 对应 Postmortem：005 (Media), 008 (Fonts & Rendering)
> 关联 Verifier：`verify/modules/screenshot.verifier.ts`
> 执行命令：`bun verify --module screenshot [--ac AC-SHOT-NNN]`
>
> v1.1 修订：端点路径对齐 `app/routes.ts` 实际路由（`/plain` → `/plain-tweet/:id`，`/plain-ig` → `/plain-ins/:id`，query → 路径参数）；AC-SHOT-003 验证对象改为截图 hook 源码扫描。
> v1.2 修订：新增 AC-PERF-001（阶段二任务 2，review P1-2/P5 性能预算）——截图渲染性能基线 × 回归阈值，长链/大量媒体不 eager 加载全量图。

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

## AC-PERF-001：截图渲染性能基线 × 回归阈值（长链/大量媒体）

- **背景**：长链推文（15+ 条线程）与大量媒体是截图最重的输入；截图等待
  （`waitForRenderReady`）按视口内图片就绪判定，因此媒体/头像必须懒加载，
  长链不得并发 eager 拉取全量图（review P1-2/P5 性能预算）。
- **验证对象**：`app/components/tweet/PlainTweet.tsx`（plain 渲染路径）、
  `app/lib/react-tweet/twitter-theme/tweet-media.tsx`（媒体图）、
  `tweet-header.tsx`（头像）、`test/acceptance/ac-perf.spec.ts`
- **基线（2026-08-17 实测，Win 开发机）**：15 条长链线程 `renderToString` 中位 ~20ms
  （HTML 约 130KB）、单推 ~1ms。回归阈值 = 基线 × 5，另设绝对兜底（线程 500ms / 单推 150ms），
  慢机/CI 冷 JIT 可容忍，只拦截「跑飞级」回归。
- **Pass 条件**：
  - **P1 结构预算（离线确定性）**：长链 fixture（15 条，含多图/引推）plain 渲染输出
    HTML ≤ 1MB；所有 `<img>` 均带 `loading="lazy"`；无 `<script src>` 注入。
  - **P2 渲染时长（回归阈值）**：长链与单推的 `renderToString` 中位数（5 次）
    ≤ max(绝对兜底, 记录基线 × 5)。
  - **P3 源码扫描**：媒体 `<img>` 与头像组件携带 `loading="lazy"`（`decoding="async"`）。

---

## 总计：5 条 AC

| AC          | 分类                | 依赖外部服务 |
| ----------- | ------------------- | ------------ |
| AC-SHOT-001 | 集成                | 是 (Twitter) |
| AC-SHOT-002 | 集成                | 是 (IG)      |
| AC-SHOT-003 | 静态代码检查        | 否           |
| AC-SHOT-004 | 静态代码检查        | 否           |
| AC-PERF-001 | 静态代码检查 + 性能 | 否           |
