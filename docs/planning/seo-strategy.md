# SEO 策略与现状审计

**最后更新**: 2026-11-18 | **状态**: metadata 管道修复已完成（动态页不收录）；内容与运营项待排期

> 结论先行：本站的 SEO 问题**不是缺 metadata，而是缺可索引的正文**。现有 OG / canonical / JSON-LD 写得比多数同类站完整，但线上 HTML 里同一页面出现两个 `<title>`、推文页服务端只输出骨架屏，等于把排序资格让给了别人。
>
> **已裁决（2026-11-18）**：动态生成页（推文 / IG / List / 用户资料 / 长文 / 搜索）一律 `noindex, follow`，不为它们做 SSR 正文改造；只保留工具页（`/`、`/about`）可索引。本轮先修 metadata 管道（单份 title/description、noindex、sitemap/robots 对齐），见 §四。

---

## 一、项目性质判定（决定策略的前提）

| 维度     | 事实                                                                                                 | SEO 含义                                                                   |
| -------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 产品形态 | 工具站（读取 / 翻译 / 导出推文与 IG）                                                                | 目标词是**工具意图**（「推特翻译」「推特怎么看」「推文截图」），不是内容词 |
| 内容来源 | X / Instagram 第三方内容，非原创                                                                     | 属于转载/镜像内容，Google 明确不欢迎重复内容，且有 UGC 滥用政策约束        |
| 页面结构 | 三类：固定页（/、/about）、少量长文页（/article）、无限动态页（/tweets、/ig、/list、/user、/search） | 无限动态页是抓取预算黑洞，必须分级对待                                     |
| 渲染     | React Router v8 SSR                                                                                  | 技术上完全可索引，问题在组件分支，不在框架                                 |
| 语言     | 中文为主，内容语言随推文变化                                                                         | 单语站，不需要 hreflang；但 `html lang` 不应恒为 zh                        |

**据此的策略基调**：

1. **主战场是工具页与长文页**，不是「几百万条推文」的程序化页面。
2. **动态页默认保守**（noindex, follow），按 Search Console 实测数据再逐步放开，而不是先全量索引再收。
3. **不追求用 llms.txt 换排名**：Google 2026-06 已明确说明 Search（含生成式 AI 搜索）不使用 llms.txt 决定展示或排名。它保留是给 agent 用的，不算 SEO 项目。
4. **不做**伪造 FAQ、关键词堆砌、AI 批量生成落地页——直接踩 `scaled content abuse` 和 UGC spam 两条线。

---

## 二、现状审计

### P0 — 直接抵消当前所有 SEO 投入

1. **每个页面有两个 `<title>` 和两个 `<meta description>`**
   `app/root.tsx` 的 `Layout` 里写死了 `<title>Anon Tweet — 匿名推文浏览器</title>` 和一段静态 description，随后才渲染 `<Meta />`。线上 HTML 实测：

   ```html
   <title>Anon Tweet — 匿名推文浏览器</title>
   <meta name="description" content="Anon Tweet — 第三方 Twitter/X 推文浏览器…" />
   …
   <title>小日向美香 @kohinatamika on X: "…" | Anon Tweet</title>
   <meta name="description" content="本日お誕生日を迎えました…" />
   ```

   结果：Google 看到的标题是那份笼统的兜底标题，`tweet.tsx` / `article.tsx` 精心拼的标题形同虚设；description 同理。**这是当前性价比最高的一处修复。**

2. **推文页服务端只渲染骨架屏，正文不在 HTML 里**
   `app/routes/tweet.tsx` 的 loader 已经拿到 `tweet`，但组件第一道分支是 `if (isLoading || isRetweet || !isStoreReady)`，而 `isStoreReady` 的 server snapshot 恒为 `false` → SSR 永远走 `TweetSkeleton`。线上 HTML 内确认只有骨架，没有推文文本，`TweetStructuredData`（JSON-LD）也不在 SSR 输出中。**元数据齐全但正文为空，等于只给了搜索引擎一个标题。**

3. **IG 页完全没有 loader，List 页用 clientLoader**
   `ins.tsx` 没有任何服务端 loader，数据全靠 SWR 客户端拉取；`list.tsx` 用 `clientLoader`，SSR 阶段无数据。这两类页面对不执行 JS 的爬虫是纯空壳页。

4. **所有页面共用同一个 H1**
   `PageHeader` 的品牌 Hero（`<h1>あのん Tweet</h1>` + 同一段介绍）在 Layout 里对每个视图渲染。详情页没有自己的 H1，全站 H1 与首段文字完全重复，削弱主体性判断。2026-11-18 日志里写过「Hero 只在 / 渲染」，但后来改成「全站固定」，这条要重新裁决。

5. **sitemap 只有一条 URL**
   `app/routes/sitemap.xml.ts` 的 `staticPages` 只有 `/`，没有 `/about`、没有按策略应收录的长文页，也没有 `lastmod`。

6. **不该被索引的页面没有防护**
   - `/plain-tweet/:id`、`/plain-ins/:id`：与详情页同内容，截图用，未 noindex、robots 未屏蔽
   - `/bili`：隐藏自用入口，未 noindex
   - 404 页：无 `noindex`（虽有 404 状态码兜底）
   - `/search?q=*`：页面已带 noindex ✅，但 robots 又 `Allow: /search`，规则自相矛盾

### P1 — 结构性问题

7. **无限动态页没有索引分级**：`/tweets/:id`、`/ins/:id`、`/list/:id` 默认 `index, follow`，等于邀请 Google 抓取一个无限集合的第三方转载内容，抓取预算与重复内容风险双高。
8. **metadata 实现重复且不完整**：`tweet.tsx` 手写 20 余个标签，`article.tsx` 另写一份；IG 页只有 title/description，无 OG/canonical；全站没有默认 `og:image`（1200×630）；`og:locale` 只在推文页设置。
9. **结构化数据单薄**：只有推文页的 `SocialMediaPosting`，且只在客户端渲染；缺 `WebSite` + `SearchAction`（站点搜索框）、`Article`（长文页）、`BreadcrumbList`。
10. **`html lang="zh"` 恒定**：日文/英文推文页的语言声明错误，影响语言相关性判断与屏幕阅读器。
11. **内链主要藏在默认收起的页脚里**：页脚用 `max-h-0 opacity-0` 折叠，链接虽在 DOM 中但视觉不可见，权重传递弱；详情页之间没有相关推荐/面包屑。

### P2 — 收益递减

12. 字体重复加载：`root.tsx` 的 `links` 里两次请求 Noto Sans SC（两份 Google Fonts URL），且同时使用 `@fontsource-variable/noto-sans`。自托管可去掉第三方字体阻塞。
13. 无图片 sitemap / 视频 sitemap；推文图很多，可选。
14. 缺少 Search Console / Bing Webmaster 验证与 sitemap 提交的固定流程（代码里无验证 meta）。

---

## 三、页面分级（策略落地表）

| 页面                     | 索引            | canonical | 说明                                                        |
| ------------------------ | --------------- | --------- | ----------------------------------------------------------- |
| `/`                      | index           | 自身      | 工具主入口，补齐真实说明与用法（不堆词）                    |
| `/about`                 | index           | 自身      | 唯一能讲清「这是什么/数据边界/隐私」的页面，应作为信任锚点  |
| `/tweets/:id`            | noindex, follow | —         | 第三方转载 + 无限集合，不做 SSR 正文改造（2026-11-18 裁决） |
| `/ins/:id`、`/list/:id`  | noindex, follow | —         | 同上                                                        |
| `/user/:username`        | noindex, follow | —         | 用户资料同样来自第三方，且页面集合无限                      |
| `/article/:id`           | noindex, follow | —         | 长文页同样是动态生成页；若日后重开索引，仅此页值得单独立项  |
| `/search`（含 `?q=`）    | noindex, follow | —         | 结果随查询串变化且无服务端正文                              |
| `/plain-*`、`/bili`、404 | noindex, follow | —         | 同内容/隐藏/无价值                                          |

> 索引进 sitemap 的只有 `/` 与 `/about`；`sitemap.xml` 与页面 robots 必须一致。
> 动态页仍允许抓取（页面自带 noindex），这样 Search Console 能正确看到信号。

---

## 四、改动清单

### 已完成（2026-11-18）

1. 新增 `app/lib/seo.ts`：`buildMeta()` 统一输出 title / description / robots / OG / Twitter Card / canonical；`clampDescription()`、`ogLocale()`。
2. `root.tsx` 删除 `<head>` 里写死的 `<title>` / description / robots / OG / Twitter Card，改为 root `meta()` 兜底。React Router 只渲染最深匹配路由的 meta，因此不再出现两份标签。
3. 全部动态路由改为 `noindex, follow`：`tweet` / `article` / `ins` / `list` / `user` / `search` / `plain` / `plain-ig` / `bili` / `not-found`。
4. `/`、`/about` 保留可索引并输出绝对 canonical；首页与关于页的 loader 返回 `baseUrl`。
5. sitemap 只保留 `/` 与 `/about`，移除未使用的 news/image/video 命名空间。
6. robots 增加 `Disallow: /plain-tweet/`、`/plain-ins/`、`/bili`，保留只读接口白名单。

### 暂不做（本轮范围外）

7. 动态页 SSR 正文（推文 / IG / List）：既然不收录，投入产出不成立；若日后重开索引再评估。
8. 每页唯一 H1（Hero 全站固定）：属布局改动，与本轮 metadata 修复解耦。
9. `/about` 扩写为落地页、Search Console 接入：属内容与运营工作，待决定推进节奏后再做。
10. JSON-LD（`WebSite` / `Article` / `BreadcrumbList`）：不收录动态页后收益有限，暂缓。
11. 字体自托管、图片 sitemap、`llms-full.txt`：P2，按需再做。

---

## 五、验收标准

已落地为 `verify/acceptance-criteria/AC-seo.md` + `test/unit/seo.spec.ts`：

- **AC-SEO-001**：`buildMeta()` 每页只有一份 title / description / robots / og:title / og:image / twitter:card；root 兜底不再输出静态标签。
- **AC-SEO-002**：可索引页输出绝对 canonical 与 `og:url`；`noindex` 页只输出 `noindex, follow` 且不带 canonical。
- **AC-SEO-003**：10 个动态路由均声明 `noindex: true`；sitemap 只含 `/` 与 `/about`；robots 屏蔽截图与自用入口。

验证方式：单测直接调用 `sitemap.xml` / `robots.txt` 的 loader 断言输出，并对 `buildMeta()` 做纯函数断言（不依赖浏览器）。
线上额外人工核对过：`/`、`/about`、`/search`、`/tweets/:id`、`/plain-tweet/:id`、`/bili`、404 的 HTML 均只有 1 个 `<title>`，robots 与预期一致。

---

## 六、风险与不做

| 项                    | 判断                                                                |
| --------------------- | ------------------------------------------------------------------- |
| 索引第三方内容        | 转载/镜像内容有重复内容与 UGC spam 风险；当前裁决为动态页全部不收录 |
| 全量索引推文页        | 抓取预算浪费、质量信号稀释；不做                                    |
| 用 llms.txt 冲排名    | Google 已明确不使用；保留仅服务 agent                               |
| 伪造 FAQ / 关键词堆砌 | 违反 spam policies；不做                                            |
| 现在做多语言 hreflang | 单语站，无收益；不做                                                |

---

## 参考

- [Google 搜索垃圾内容政策](https://developers.google.com/search/docs/essentials/spam-policies)
- [Google 关于生成式 AI 内容的说明](https://developers.google.com/search/docs/fundamentals/using-gen-ai-content)
- [网址规范化（canonical）](https://developers.google.com/search/docs/crawling-indexing/canonicalization)
- [llms.txt 与 Google 搜索（2026-06 官方说明的解读）](https://www.zheshantech.com/zheshantech-google-seo/llms-txt-google-ai-search-seo-guide/)
- [UGC 指南更新与分享页索引控制（2026-10）](https://auspia.ai/zh-hans/blog/google-ugc-spam-guidance-share-pages-indexing)
