# 列表页验收标准

> 版本：1.0 | 日期：2026-11-18
> 背景：`/list/:id` 只有裸输入框与推文列表，移动端贴边，失败与空态没有出口。
> 关联 Verifier：`test/acceptance/list-page-render.spec.ts`
> 执行命令：`bunx vitest run --project acceptance test/acceptance/list-page-render.spec.ts`

---

## AC-LIST-001：列表输入、状态与布局

- **输入**：`app/routes/list.tsx` 的渲染结果与 `extractListId()`
- **预期输出**：可用列表 ID 或链接进入；成功 / 空 / 失败三态清楚；移动端无横向溢出
- **Pass 条件**：
  - 接受纯数字列表 ID、`x.com/i/lists/{id}` 与 `twitter.com/i/lists/{id}` 链接；无法识别时留在表单内报错，不发起跳转
  - 首页输入识别 list 链接并跳转 `/list/{id}`（纯数字仍优先判为推文 ID）
  - 输入、说明与提交按钮位于单张 `bg-card` 实心卡片内；页面主体 `max-w-[600px]` + 移动端 `px-3`
  - 加载成功后展示「列表推文」与总条数；空列表展示空态；失败展示原因与「重试」
  - 不再使用人为延时；`clientLoader` 捕获请求异常并转为页面可展示的错误
  - 推文卡片的作者链接指向站内 `/user/{username}`

---

## 变更约定

- 列表 ID 的解析只接受数字段，忽略查询参数与尾斜杠
- 该页保持 `noindex, follow`，不进 sitemap
