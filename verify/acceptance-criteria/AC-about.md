# 关于页验收标准

> 版本：1.1 | 日期：2026-11-18
> 背景：44469cf 精简外壳时移除了构建信息与部分说明；这些信息归入 `/about`，不回到首页。
> 关联 Verifier：`test/acceptance/about-render.spec.ts`
> 执行命令：`bunx vitest run --project acceptance test/acceptance/about-render.spec.ts`

---

## AC-ABOUT-001：关于页承载功能、数据、构建与接口信息

- **输入**：`app/routes/about.tsx` 的渲染结果
- **预期输出**：一页可查的功能说明、数据与隐私边界、构建信息、机器可读入口与相关链接
- **Pass 条件**：
  - 「能做什么」按事实列出推文 / 长文、Instagram、AI 翻译、导出四类能力，不使用营销式宫格或虚构指标
  - 「数据与隐私」分别说明 IndexedDB 保存的内容、localStorage 保存的内容、服务端只转发而不落盘、以及清除方式
  - 「构建」显示版本（来自 `package.json`）、提交短哈希（链接到 GitHub commit）、提交时间、运行时与技术栈
  - 「机器可读接口」列出 `/llms.txt`、`/openapi.json`、`/skills/anon-tweet/SKILL.md` 三个入口
  - 「相关链接」提供 GitHub 仓库、CHANGELOG、MIT License；页面可从页脚进入
  - 提交不可用（DEV / unknown）时不生成指向 GitHub 的死链

## AC-ABOUT-002：关于页的视觉与响应式约束

- **输入**：`/about` 在 320 / 390 / 1440 宽度下的渲染结果
- **预期输出**：可读的文档式布局，无横向溢出
- **Pass 条件**：
  - 移动端内容保留左右留白（`px-4`），不贴屏幕边缘
  - 长路径与 URL 允许换行，不撑破容器（`min-w-0` + `break-all`）
  - 分区使用实心 `bg-card` 表面 + 分隔线，不使用低对比度半透明卡片
  - 浅色 / 深色模式均使用语义颜色 token，无硬编码颜色

---

## 变更约定

- 构建信息只在 `/about` 与页脚出现，不回到首页首屏
- 新增机器可读端点时同步本页与 `AC-llms.md`
