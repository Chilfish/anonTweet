# X Article（长文）解析 · 渲染 · 分块翻译 — 实施追踪

> 状态：🚧 进行中（2026-09-27）— §A 纯文本修复 ✅ / §B 富文本块文档 + 阅读页 ✅ / §C 分块翻译 ✅ 端到端已接线 + 真机解析失败修复
> AC：[`verify/acceptance-criteria/AC-tweet.md`](../../../verify/acceptance-criteria/AC-tweet.md)（AC-TWEET-012~020）
> 关联：`docs/development-log/2026-09-27.md`（调查链）、`docs/planning/backlog.md`（未决条目）、ADR-009
> Fixtures：`test/fixtures/articles/*.json`（真实上游抓取）

---

## 1. 问题

文章型推文（`https://x.com/<user>/article/<id>`）经 `/api/tweet/get` 过去只返回正文里的一条
t.co 裸链接，标题与正文全丢。触发样例：

| 推文 id               | 文章 id               | 形态                                           |
| --------------------- | --------------------- | ---------------------------------------------- |
| `2104058634452005231` | `2104009234858024962` | 纯段落 + hashtag span + 行内粗体               |
| `2103576349499855160` | `2103535187426709504` | header / 7 张图片 / 无序列表                   |
| `2099885132379500562` | `2099881096674721793` | GFM **表格**（MARKDOWN 实体）/ 链接 / @mention |

## 2. 关键结论（实测，非推测）

### 2.1 根因两层

1. **请求侧**：文章全文需 `fieldToggles`，而 `TweetRequests.details()` 过去完全没带；即便按
   `User.ts` 的写法传**对象**，axios 会序列化成 `fieldToggles[withArticlePlainText]=true`（实测
   `axios.getUri`），而 X 只认 `fieldToggles={"withArticlePlainText":true}` 这种 JSON 字符串
   （对齐 `variables`/`features`）。**对象写法会被 X 静默忽略**——这是「有 metadata 没全文」的隐蔽坑。
2. **解析/渲染侧**：`enrichTweet` 从未读取 `article` 节点，`EnrichedTweet` 也无承载字段。

### 2.2 富文本字段是现成的

`replies()` 早已带 `fieldToggles: {"withArticleRichContentState":true,...}`（`requests/Tweet.ts:350`），
说明 `content_state` 是存在的字段——`details()` 补同款 toggle 即可拿到完整块文档。

### 2.3 `TweetResultByRestId` 的 `article` 节点实测结构

```jsonc
article.article_results.result = {
  id, rest_id, title, preview_text, plain_text,          // 文本层
  content_state: {
    blocks: [
      { key, text, type, data, entityRanges: [{ key, offset, length }], inlineStyleRanges: [{ offset, length, style }] }
    ],
    entityMap: [ { key: "0", value: { type, mutability, data } } ]   // 也见过 Record 形态
  },
  media_entities: [ { id, media_id, media_key, media_info: { original_img_url, original_img_width, original_img_height } } ],
  cover_media: { ...同上 },
  metadata: { first_published_at_secs }
}
```

- **block.type**：`unstyled` / `header-one/two/three` / `unordered-list-item` / `ordered-list-item` /
  `blockquote` / `atomic`
- **inlineStyleRanges.style**：`Bold` / `Italic`（首字母大写）
- **entityMap value.type**：`LINK{url}` / `MARKDOWN{markdown}` / `MEDIA{mediaItems[{localMediaId,mediaCategory,mediaId}]}` /
  `DIVIDER` / `TWEET{tweetId}`（读取侧为 camelCase `mediaItems`；发布侧 API 为 snake_case `media_items`）
- **`@mention` / `#hashtag` 不走 entityMap**：在 `block.data.mentions` / `block.data.hashtags` 的
  `{ fromIndex, toIndex, text }` span 里（与 entityRanges/inlineStyleRanges 同一套 UTF-16 偏移）

### 2.4 「表格」「代码」= `MARKDOWN` 实体

X Article **没有** table / code 块类型。作者写的 GFM（含 `| a | b |` 表格、` ` ``` 代码块）
原样存在 `entityMap[].value.data.markdown` 里。样例 `2099885132379500562` 的实体 key `5` 就是一张
Markdown 表格。→ 渲染 `MARKDOWN` 必须走 **markdown 渲染器**（本项目此前无任何 markdown 渲染器/依赖）。

### 2.5 富文本只在 `details` 路径取

`search` / `list` / `user-timeline` 不带 `withArticleRichContentState`，其 `article` 节点可能缺失。
故设计为：**仅 `get` + `replies` 取富文本**；其它路径由 `resolveArticleLink(entities)` 给出
「仅链接」的最小卡片入口，进入 `/article/:id` 后再拉全文（避免逐条放大 payload / 429）。

## 3. 数据链

```
/enrichTweet (parseTweet.ts)
   └─ mapArticle(rawTweet.article?.article_results?.result, entities)   (lib/react-tweet/utils/article.ts)
        ├─ parseContentState(result.content_state, result.media_entities)  (lib/article/parse.ts)
        │     → ArticleBlock[]（paragraph/heading/list-item/quote/markdown/divider/image/embed-tweet/link/unknown）
        ├─ mediaFromRaw(cover_media) → coverImage
        └─ metadata.first_published_at_secs → publishedAt(ms)
   → EnrichedTweet.article: TweetArticle { id,url,title,previewText,plainText,format,coverImage,publishedAt,blocks }

TweetNode / PlainTweet → TweetArticleCard（紧凑卡，Link → /article/:tweetId）
/routes/article.tsx → ArticleBody(blocks)（阅读页）
```

## 4. 已确认的产品决策（owner 2026-09-27）

| 决策     | 选择                                                                         |
| -------- | ---------------------------------------------------------------------------- |
| 呈现     | **独立阅读页 `/article/:id`**；推文内保持紧凑卡（线程不铺长文）              |
| 翻译     | **分块双语**（标题 + 正文各块；代码/图片/嵌入帖不译）                        |
| 取数范围 | **仅 get + replies**；search/list/timeline 只给仅链接卡片入口                |
| 嵌入帖   | **真实推文渲染**（loader 并行取回，取数失败回退紧凑链接卡）                  |
| 翻译开关 | **保留「原文 / 译文 / 双语」三态**，文章页同样可切；截图选「仅译文」控制长度 |

## 5. 实现落点（当前工作区）

| 层             | 文件                                                                                                           | 说明                                                                                                      | 状态 |
| -------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---- |
| 请求           | `app/lib/rettiwt-api/requests/Tweet.ts`                                                                        | `details()` fieldToggles = `{withArticleRichContentState:true, withArticlePlainText:true}`（JSON 字符串） | ✅   |
| 原始类型       | `app/lib/rettiwt-api/types/raw/tweet/Details.ts`                                                               | `Result.article` 节点 + `RawArticle*` 接口                                                                | ✅   |
| 领域类型       | `app/types/article.ts` · `app/types/index.ts`                                                                  | `TweetArticle`（含 `format` 判别）/`ArticleBlock`/`ArticleRun`/`ArticleMedia`；`EnrichedTweet.article`    | ✅   |
| 解析（纯）     | `app/lib/article/parse.ts`                                                                                     | `parseContentState` / `derivePlainText` / `normalizeEntityMap` / `mediaFromRaw`                           | ✅   |
| 映射（纯）     | `app/lib/react-tweet/utils/article.ts`                                                                         | `mapArticle` / `isArticleUrl` / `extractArticleIdFromUrl` / `resolveArticleId` / `resolveArticleLink`     | ✅   |
| 挂载           | `app/lib/react-tweet/utils/parseTweet.ts`                                                                      | `enrichTweet` 产出 `article`                                                                              | ✅   |
| 回填           | `app/lib/service/getTweet.server.ts`                                                                           | `backfillArticleDetails` 判据改 `format==='rich'`（flat 缓存读时升级）                                    | ✅   |
| 渲染           | `app/components/article/*`（`ArticleBody`·`ArticleRuns`·`ArticleMarkdown`·`ArticleImage`·`ArticleEmbedTweet`） | 块 → 组件；markdown 走 react-markdown + remark-gfm                                                        | ✅   |
| 内嵌推文       | `app/routes/article.tsx` · `ArticleEmbeddedTweet.tsx` · `ArticleBody.renderEmbed` · `collectEmbeddedTweetIds`  | loader 并行取回内嵌推文 → 注入只读推文组件渲染；取数失败回退链接卡（AC-019）                              | ✅   |
| 卡片           | `app/components/tweet/TweetArticleCard.tsx`                                                                    | 封面 + 标题 + 摘要 + 「阅读全文」→ `/article/:tweetId`                                                    | ✅   |
| 挂载           | `TweetNode.tsx` · `PlainTweet.tsx` · `tweet-body.tsx`                                                          | 卡片挂载 + 正文重复链接去重                                                                               | ✅   |
| 路由           | `app/routes/article.tsx` · `app/routes.ts`                                                                     | 阅读页（SSR loader → `getTweets(id, getLocalTweet)`）                                                     | ✅   |
| 依赖           | `package.json`                                                                                                 | `react-markdown` + `remark-gfm`（MARKDOWN 实体渲染）                                                      | ✅   |
| 翻译（服务端） | `app/lib/article/translate.ts`                                                                                 | `autoTranslateArticle` 按块分批 + 占位符校验                                                              | ✅   |
| 翻译（端点）   | `app/routes/api/ai/ai-translation.ts`                                                                          | 新增 `type:'article'` 分支                                                                                | ✅   |
| 翻译（校验）   | `app/lib/validations/tweet.ts`                                                                                 | `AITranslationSchema` 增 `article` 变体；`tweetSchema` 增 `updateArticleTranslations` intent              | ✅   |
| 翻译（状态）   | `app/lib/stores/translation.ts` · `hooks.ts`                                                                   | `articleTranslations` / `articleTranslationStatus` + selectors                                            | ✅   |
| 翻译（触发）   | `app/hooks/use-auto-translate-article.ts`                                                                      | 每篇触发一次（loader 已回填则跳过），写 store + best-effort 落库                                          | ✅   |
| 翻译（持久化） | `app/lib/database/schema.ts` · `drizzle/0002_*`                                                                | `tweet_article_translations(tweetId unique, translations json)` + migration                               | ✅   |
| 翻译（同步）   | `app/lib/service/articleTranslationSync.ts` · `getTweet.server.ts`                                             | POST `/api/tweet/set` intent `updateArticleTranslations`；`getArticleTranslation` 回填                    | ✅   |
| 翻译（渲染）   | `app/components/article/{ArticleTranslatedText,ArticleTranslateToggle}.tsx` · `routes/article.tsx`             | 占位符还原 + 原文/双语/仅译文三态开关 + 标题三态                                                          | ✅   |

## 6. 分块翻译设计（重点）

现有推文实体管线（`AITranslation.ts`）假设**单块文本 + 占位符集合精确相等 + 位置游标回填**：
长文会超 token、占位符易丢、位置一乱就**静默错位**。故文章另起按 **块 key** 对齐的管线：

```
autoTranslateArticle(article, { modelInstance, modelName, thinkingLevel, translationGlossary })
  1. 收集可译块（paragraph/heading/list-item/quote）+ title；跳过 markdown/image/embed-tweet/divider
  2. 块内 link/mention/hashtag → 占位符 <<__LINK_n__>>（n = 该块内非文本 run 序号，从 0 起）
  3. 按字符预算（~2600）分批；每批一次 generateText（Output.object）
       schema: { title?: string, blocks: Record<blockKey, string> }
       输入以 { 块key: 原文 } **对象**喂入，与输出同构（数组输入会让模型把每个元素当独立对象，
       逐块多打一个 `}`，整段 JSON 无法解析）
  4. 逐块校验占位符集合是否精确相等；不通过 → 仅重试该批（≤2 次），仍失败则丢弃该块（不写脏数据）
       generateText 抛错（AI_NoObjectGeneratedError）同样走重试，不再中断整篇
  5. 跳过已是中文的块（含 CJK 且无假名）；返回 { title?, blocks }
       整篇一块都没翻出来时抛错，不以 success 返回空译文
```

**为什么结构只能靠 prompt 约束**：`@ai-sdk/openai-compatible` 的 `supportsStructuredOutputs` 默认
`false`，SDK 只发 `response_format: {"type":"json_object"}` 并告警，zod schema **不会下发给模型**。
因此 prompt 里把「一个 `blocks` 对象含全部 key、禁止中途闭合」写成硬约束，输入也改成与输出同构的对象。

**渲染还原**：`ArticleBody` 按原 run 顺序把译文里的 `<<__LINK_n__>>` 还原为第 n 个非文本 run 的
可点击元素（链接/mention/hashtag），译文空格与标点原样保留。

**三态显示**（`ArticleBody mode`）：

- `original`：仅原文；`translation`：仅译文；`bilingual`：原文 + 其下译文（次级色 + 左侧竖线）
- 截图选 `translation`（仅译文）即得短图——**直接复用现有开关**，无需新 UI

**存储**：客户端 `articleTranslations[tweetId]`（会话级）；服务端 `tweet_article_translations`
表（jsonb，按 tweetId 唯一）。**不能**放进 `tweet.jsonContent`——它会被上游结果整条 upsert 覆盖。

## 7. 缓存与回填

三层缓存（memory LRU / FS `cache/*.json` / DB `jsonContent`）都存**无版本**的 `EnrichedTweet`。
`article.format`（`plain`→`rich`）作为结构判别：`getLocalTweet` 出口发现旧 flat 缓存（或缺失）
且正文含文章链接时，重抓一次上游并用 `format==='rich'` 结果 best-effort 写回两层缓存
（`setLocalCache` + `insertToTweetDB`）。取数失败（429/网络）保持原样，不伪造。

## 8. 验收标准（AC）

`AC-tweet.md` v1.7：AC-TWEET-012（文章解析/URL 判别）、013（`details()` fieldToggles 序列化，JSON 字符串不变量）、
014（`content_state` → 块文档）、015（flat→rich 回填）、016（`ArticleBody` 真实渲染）、
017（分块翻译离线契约：占位符序列化 + 中文跳过 + 落库 intent 校验）、018（三态渲染 + 占位符还原）、
019（内嵌推文 id 收集 + 阅读页注入真实推文渲染 / 回退链接卡）、
020（解析失败重试/降级 + 送入模型的输入形态）。

## 9. 当前状态与未完成（诚实清单）

**✅ 已可用（本地实测）**：`/api/tweet/get/2103576349499855160` 返回 `article.format=rich`、81 块
（11 heading / 7 image / 13 list-item / 50 paragraph）+ 封面；`/article/2103576349499855160` SSR 200，
渲染标题 / `<h2>` / 图片。

**✅ Phase C 分块翻译已端到端接线**：migration `drizzle/0002_*`；`/api/tweet/set` intent
`updateArticleTranslations` + `getArticleTranslation` 回填；阅读页 `useAutoTranslateArticle` + 三态开关
（原文/双语/仅译文，标题与正文同步）+ loader 回填持久化译文；AC-017/018；`llms.ts` / OpenAPI 快照 / SKILL.md
补 `article`。

**✅ UX 精修（owner 反馈，同日）**：

- **数据瘦身**：`format==='rich'` 时不再冗余存 `plainText`（blocks 已覆盖全文）——`articleFromRawResult` 仅在无块文档时保留。
- **译文双层缓存**：`CacheType` 增 `article-translation`；`getArticleTranslation` 走 localCache → DB，
  `updateArticleTranslation` 同时写两层——DB 关闭（或本地开发）时译文也不丢，重访不再重翻。
- **工具栏对齐推文页**：新增 `ArticleToolbar`（返回 / 三态开关 / 重试翻译 / 一键截图）+ `ArticleOptionsMenu`
  （设置 / 分享 / 复制正文 / 复制 Markdown / 下载图片）；翻译失败可手动重试（`useAutoTranslateArticle` 现返回 `translate(force)`）。
- **导出**：`app/lib/article/markdown.ts`（`articleToText` / `articleToMarkdown` / `articleBlocksToMarkdown`）。
- **视觉**：阅读内容改为 `bg-card` 卡片（`rounded-2xl border bg-card p-4 sm:p-6`），截图捕获该卡片节点。
- **内嵌推文真实渲染**：loader 收集 `TWEET` 实体 id 并用 `getTweets(id, getLocalTweet)` **并行**取回（缓存链），
  经 `ArticleBody.renderEmbed` 注入复用只读推文组件 `MyPlainTweet`；推文自身时间戳已链接 X 原帖，故去掉
  「在 X 查看」；取数失败/删除降级回原链接卡（AC-019）。

**剩余（非阻塞）**：

1. **DB migration 未执行**：`drizzle/0002_*` 已生成，但**未对线上库 `db:migrate`**（需 owner 在部署环境执行）。
2. **可选**：文章页截图路由 `plain-article/:id`（若需对阅读页无头截图）。
3. **未提交**：全部改动仍在工作区，未 commit（建议按 §11 拆分）。
4. **LLM 端到端**：真实 DeepSeek 端点已复现并修复「模型输出非法 JSON → 整篇 500」（2026-09-27，见开发日志）；
   日常回归走 `ai/test` 假模型驱动真实 `generateText`（AC-TWEET-020），不触网、无需 apiKey。
5. **旧缓存残留**：已缓存的 rich 文章仍带旧 `plainText` 直到缓存过期；新抓取即瘦身。

## 10. 已知限制 / 风险

- `content_state` 字段名随上游可能演化（`entityMap` 数组 vs Record 两种形态解析器均已兼容；未知块降级为段落）。
- MARKDOWN 实体依赖 `react-markdown` + `remark-gfm`（新增运行时依赖，约 40 个传递包）；react-markdown 不用
  `dangerouslySetInnerHTML`，无 XSS 面。
- search/list/timeline **只有仅链接卡片**（无正文），进 `/article/:id` 才拉全文——有意为之。
- 极少数文章需登录态；取不到时降级为 flat 卡片。
- 阅读页路由按**推文 id**（`/article/:tweetId`），不是文章 id（`/i/article/<articleId>`）——两者不同。
- 文档级集成：篇幅 / 嵌套 markdown 仍以「可读」为准；翻译占位符校验失败的块会被丢弃（宁缺勿脏）。

## 11. 建议提交拆分（Conventional Commits）

1. `fix(tweet): parse X article plain text`（请求 toggle + 类型 + mapArticle + 回填 + AC-012/013）
2. `feat(article): parse Draft.js content_state into a block document`（解析器 + 模型 + fixture + 单测 + AC-014）
3. `feat(article): render articles on a dedicated reader page`（组件 + `/article/:id` + 紧凑卡 + 截图补齐 + AC-015/016）
4. `feat(article): block-level bilingual translation`（migration + intent + 阅读页三态接线 + 组件整理 + AC-017/018）
5. `fix(article): retry and degrade on unparseable translation output`（输入改对象 + prompt 硬约束 + 解析失败重试/降级 + `normalizeAIError` 补 generatedText/finishReason + AC-020）
6. `docs(article): sync llms/OpenAPI/skill + feature doc + dev log`

## 12. 变更文件清单

**新增**：`app/types/article.ts` · `app/lib/article/{parse,translate,markdown,index}.ts` · `app/components/article/*`（含 `ArticleEmbeddedTweet`）·
`app/routes/article.tsx` · `app/hooks/use-auto-translate-article.ts` · `app/lib/service/articleTranslationSync.ts` ·
`drizzle/0002_greedy_omega_red.sql` · `test/fixtures/articles/*.json`（含内嵌推文样例 `2104076282107723935.json`）·
`test/unit/{article-parse,article-translate,article-markdown,article}.spec.ts` · `test/acceptance/article-render.spec.ts` · 本文件。

**修改**：`app/lib/rettiwt-api/requests/Tweet.ts` · `app/lib/rettiwt-api/types/raw/tweet/Details.ts` ·
`app/types/index.ts` · `app/lib/react-tweet/utils/{article,parseTweet,index}.ts` ·
`app/lib/service/getTweet.server.ts` · `app/lib/localCache.ts`（`CacheType` 增 `article-translation`）·
`app/lib/react-tweet/twitter-theme/tweet-body.tsx` ·
`app/components/tweet/{TweetArticleCard,index,TweetNode,PlainTweet}.tsx` · `app/routes.ts` ·
`app/routes/api/{ai/ai-translation,tweet/set}.ts` · `app/lib/validations/tweet.ts` · `app/lib/stores/{translation,hooks}.ts` ·
`app/lib/database/schema.ts` · `app/lib/obs-log.ts` · `app/lib/ai-error.ts` · `app/lib/llms.ts` · `eslint.config.mjs` · `package.json` · `bun.lock` ·
`.agents/skills/anon-tweet/{SKILL.md,references/anon-tweet-openapi.json}` ·
`test/unit/{article,getLocalTweet,ai-error}.spec.ts` · `verify/acceptance-criteria/AC-tweet.md` · `docs/development-log/2026-09-27.md`。

**不改**：`app/lib/AITranslation.ts`（高危，保持零改动）、`app/lib/localCache.ts` 核心机制、DB `tweet.jsonContent` 结构、
`routes/api/tweet/{get,search,replies,list}.ts` 响应形态（`article` 自然透传）。
