# SEO 元信息与页面分级验收标准

> 版本：1.0 | 日期：2026-11-18（新增 AC-SEO-001/002/003）
> 关联策略：`docs/planning/seo-strategy.md`
> 关联 Verifier：`test/unit/seo.spec.ts`（verify 套件 Vitest 三层架构）
> 执行命令：`bun verify --module seo [--ac AC-SEO-NNN]`

---

## AC-SEO-001：每页只有一份 title / description / robots

- **输入**：`buildMeta()` 产物（`app/lib/seo.ts`）
- **预期输出**：标题、描述、robots、OG、Twitter Card、canonical 每个键只出现一次
- **验证方法**：`bun verify --ac AC-SEO-001`
- **Pass 条件**：
  - 任一页面 meta 数组中 `<title>` 恰好 1 个，`name=description` 恰好 1 个
  - `robots` / `og:title` / `og:image` / `twitter:card` 各恰好 1 个
  - 根级兜底 meta（`root.tsx`）不再输出静态 `<title>` / description；无自己 meta 的路由继承这份兜底
  - 传参标题/描述覆盖站点默认值

---

## AC-SEO-002：canonical 与 noindex 语义正确

- **输入**：`buildMeta({ canonicalPath, baseUrl, noindex })`
- **预期输出**：可索引页有绝对 canonical 与 `og:url`；noindex 页只有 `noindex, follow`
- **验证方法**：`bun verify --ac AC-SEO-002`
- **Pass 条件**：
  - canonical 与 `og:url` 由 `baseUrl` 拼成绝对地址
  - `noindex: true` 时不输出 canonical / `og:url`
  - `image: null` 时 `twitter:card` 降级为 `summary`，不输出 `og:image`
  - `clampDescription()` 截断到 160 字符；`ogLocale()` 正确映射 zh/ja/en

---

## AC-SEO-003：动态页不收录，sitemap / robots 与页面策略一致

- **输入**：动态详情路由源码 + `/sitemap.xml` + `/robots.txt`
- **预期输出**：动态页全部 `noindex, follow`；sitemap 只含可索引静态页；robots 屏蔽截图与自用入口
- **验证方法**：`bun verify --ac AC-SEO-003`
- **Pass 条件**：
  - `tweet / article / ins / list / user / search / plain / plain-ig / bili / not-found` 路由 meta 均含 `noindex: true`
  - sitemap 含 `/` 与 `/about`，不含 `/tweets`、`/ins`、`/list`、`/user`、`/article`、`/search`、`/plain-tweet`
  - robots.txt 含 `Disallow: /plain-tweet/`、`Disallow: /plain-ins/`、`Disallow: /bili`，并声明 sitemap

---

## 变更约定

- 新增页面路由时，必须在 `meta()` 中显式指定 `noindex`：动态内容页一律 `noindex, follow`；
  只有工具页（`/`、`/about`）可索引并进 sitemap。
- 新增可索引页时同步：`app/routes/sitemap.xml.ts` 的 `pages` 清单 + 本文件 AC-SEO-003。
- 禁止在 `root.tsx` 的 `<head>` 里写静态 `<title>` / description / robots，否则会与 `<Meta />` 重复。
