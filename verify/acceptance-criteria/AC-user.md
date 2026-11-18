# 用户资料页验收标准

> 版本：1.0 | 日期：2026-11-18
> 背景：main 分支只有 `/api/user/*` 接口，没有可访问的用户资料页；补页面时同时约束移动端与开关行为。
> 关联 Verifier：`test/acceptance/user-profile-render.spec.ts`
> 执行命令：`bunx vitest run --project acceptance test/acceptance/user-profile-render.spec.ts`

---

## AC-USER-001：资料卡内容

- **输入**：`ProfileCard` 的渲染结果
- **预期输出**：一屏可读的身份、简介、元信息与公开计数
- **Pass 条件**：
  - 展示封面、头像、显示名、`@用户名` 与认证标识（`isVerified`）
  - 头像 URL 去掉 X 的尺寸后缀（`_normal` / `_bigger` / `_mini` / `_400x400`），显示原始图；头像不被封面层级遮住
  - 简介保留换行（`whitespace-pre-wrap`）且不截断；`#话题` 与 `@用户` 解析为站内链接（`/search?q=%23…`、`/user/…`），外链可点击
  - 展示所在地、加入月份与「正在关注 / 关注者 / 帖子」三项计数，计数使用千分位
  - 提供「在 X 查看」外链，不冒充站内操作

## AC-USER-002：路由、状态与布局

- **输入**：`/user/:username` 页面与 `app/routes.ts`
- **预期输出**：可从首页输入 / 推文作者进入；资料 / 时间线状态明确；移动端无横向溢出
- **Pass 条件**：
  - 路由注册 `/user/:username`，保持 `noindex, follow`
  - 首页输入支持 `@用户名`、裸用户名与 `x.com/{username}` / `twitter.com/{username}` 链接；X 保留路径不误判
  - 输入去掉前导 `@`，只接受 `[A-Za-z0-9_]{1,15}`；非法或不存在时展示空态与返回入口
  - 资料加载失败展示原因与「重试」（`useRevalidator`）
  - 时间线受 `ENABLE_TIMELINE` 控制：关闭时明确提示「未开启用户时间线」，不发请求；开启时包含「帖子 + 回复」，逐条标注「转推自 @…」/「回复 @…」
  - 时间线展示已加载条数；有 `nextCursor` 时提供「加载更多」，追加去重；失败可重试或提示
  - 页面主体 `max-w-[600px]` + 移动端 `px-3`，推文卡片与资料卡同宽

---

## 变更约定

- 用户资料来自服务端 loader（DB 缓存 → 上游），动态页不写本地快照，不进 sitemap
- 时间线接口默认关闭的裁决不变，页面只做状态提示，不绕过开关
