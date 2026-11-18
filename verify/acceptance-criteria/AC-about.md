# 关于页验收标准

> 版本：1.0 | 日期：2026-11-18
> 背景：44469cf 精简外壳时移除了构建信息与部分说明；这些信息归入 `/about`，不回到首页。
> 关联 Verifier：`test/acceptance/about-render.spec.ts`
> 执行命令：`bun verify --module about [--ac AC-ABOUT-NNN]`

---

## AC-ABOUT-001：关于页承载构建、数据与接口信息

- **输入**：`app/routes/about.tsx` 的渲染结果
- **预期输出**：一页可查的构建信息、数据说明与机器可读入口
- **Pass 条件**：
  - 显示版本（来自 `package.json`）、提交短哈希（链接到 GitHub commit）与构建时间
  - 说明本地数据边界：最近查看 / 词典在 IndexedDB，设置与 Key 在 localStorage，不上传
  - 列出 `/llms.txt`、`/openapi.json`、`/skills/anon-tweet/SKILL.md` 三个机器可读入口
  - 提供 GitHub 仓库与 CHANGELOG 链接；不出现营销式功能宫格或虚构指标
  - 页面可从页脚进入

---

## 变更约定

- 构建信息只在 `/about` 与页脚出现，不回到首页首屏
- 新增机器可读端点时同步本页与 `AC-llms.md`
