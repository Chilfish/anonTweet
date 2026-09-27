# Tweet API 验收标准

> 版本：1.6 | 日期：2026-09-27（新增 AC-TWEET-019 内嵌推文真实渲染；1.5 为 AC-TWEET-017/018）
> 对应 Postmortem：001 (Tweet Parsing), 005 (Media)
> 关联 Verifier：`verify/modules/tweet.verifier.ts`
> 执行命令：`bun verify --module tweet [--ac AC-TWEET-NNN]`

---

## AC-TWEET-001：普通推文基本解析不丢实体

- **输入**：`verify/fixtures/tweets/normal-ja.json`（普通日文推文，含 mention、hashtag、media）
- **预期输出**：`EnrichedTweet` 的 `entities` 数组长度 ≥ 2，至少包含 `mention` 和 `hashtag` 类型
- **验证方法**：`bun verify --ac AC-TWEET-001`
- **Pass 条件**：
  - `entities.length >= 2`
  - 至少一条 `entity.type === 'mention'`
  - 至少一条 `entity.type === 'hashtag'`
  - 所有 entity 的 `index` 字段非负且在文本长度范围内

---

## AC-TWEET-002：带 Card 推文解析完整性

- **输入**：`verify/fixtures/tweets/with-card-ja.json`（12 个 entities，含 card）
- **预期输出**：entities 中包含 `url` 类型和 `card` 字段
- **验证方法**：`bun verify --ac AC-TWEET-002`
- **Pass 条件**：
  - `entities` 中包含至少一条 `url` 类型
  - `tweet.card` 不为空
  - 所有 URL entity 的 `href` 字段非空

---

## AC-TWEET-003：Quoted Tweet 的嵌套实体

- **输入**：`verify/fixtures/tweets/with-quoted-ja.json`（含 quoted_tweet）
- **预期输出**：主推文和引用推文的 entities 均被解析
- **验证方法**：`bun verify --ac AC-TWEET-003`
- **Pass 条件**：
  - `tweet.quotedTweet` 不为空
  - `tweet.quotedTweet.entities` 不为空数组
  - 主推文和引用推文的 entity index 互不重叠

---

## AC-TWEET-004：推文文本显示范围正确

- **输入**：`verify/fixtures/tweets/normal-ja.json`
- **预期输出**：`tweet.text` 的第一个字符不是无意义空格，且最后字符有意义
- **验证方法**：`bun verify --ac AC-TWEET-004`
- **Pass 条件**：
  - `tweet.text.trimStart().length > 0`
  - 文本以可见字符开头（排除前导空白和零宽字符）
  - 文本以可见字符结尾

---

## AC-TWEET-005：API 端点 POST /api/tweet/get 返回数据结构

- **输入**：合法的 `tweetId` 字符串（无需 AI 翻译）
- **预期输出**：返回 `EnrichedTweet[]` 数组，至少一个元素
- **验证方法**：`bun verify --ac AC-TWEET-005`
- **前置条件**：`TWEET_KEYS` 已配置，测试服务器运行中
- **Pass 条件**：
  - HTTP 状态码 200
  - 返回体为数组，长度 ≥ 1
  - 数组元素含 `id_str`、`text`、`entities`、`user` 字段

---

## AC-TWEET-006：错误的 tweetId 返回空

- **输入**：不存在的 `tweetId` 字符串
- **预期输出**：返回空数组或 404 状态
- **验证方法**：`bun verify --ac AC-TWEET-006`
- **Pass 条件**：
  - HTTP 状态码为 200（空数组）或 404
  - 不崩溃、不返回 500

---

## AC-TWEET-007：Entity 解析无重复

- **输入**：`verify/fixtures/tweets/with-card-ja.json`
- **预期输出**：无重复 entity（同一 index 同一 type 的 entity 只出现一次）
- **验证方法**：`bun verify --ac AC-TWEET-007`
- **Pass 条件**：
  - 按 `(entity.type, entity.index)` 去重后，数量不减少
  - 没有两条 mention 指向同一 `screen_name` 且 index 相同

---

## AC-TWEET-008：GET loader 返回数据一致性

- **输入**：有效 tweetId，分别通过 POST 和 GET 获取
- **预期输出**：两次获取的 tweet 核心字段相同（id_str、text、user.screen_name）
- **验证方法**：`bun verify --ac AC-TWEET-008`
- **Pass 条件**：
  - POST 和 GET 返回的 `id_str` 相同
  - `text` 相同（忽略尾部空格）
  - `user.screen_name` 相同

---

## AC-TWEET-009：搜索响应解析不丢推文与光标（离线）

- **输入**：`test/fixtures/search/search-tweets.json`（SearchTimeline 原始响应，
  含 2 条推文 entry + Top/Bottom 光标 entry）
- **预期输出**：`parseSearchTimeline` 提取出 2 条原始推文；`entryId` 前缀非 `tweet-`
  或 `TimelineTimelineCursor` 的 entry 被排除；Bottom 光标值被提取
- **验证方法**：`bun verify --ac AC-TWEET-009`（vitest `-t` 过滤）或
  `bun run verify/index.ts --module tweet`
- **Pass 条件**：
  - 提取的推文数量 = fixture 中推文 entry 数量
  - 无任何 `TimelineTimelineCursor` 混入推文列表
  - `nextCursor` 与 fixture 的 Bottom 光标 `value` 一致；畸形响应（空对象）不抛错

---

## AC-TWEET-010：搜索端点返回推文列表（集成）

- **输入**：合法关键词（如 `q=twitter`）请求 `GET /api/tweet/search`
- **预期输出**：返回 `{ tweets: EnrichedTweet[], nextCursor: string | null }`
  （分页形态对齐 `/api/tweet/replies`；推文元素格式同 `/api/tweet/get`）
- **验证方法**：`bun verify --ac AC-TWEET-010`
- **前置条件**：`TWEET_KEYS` 已配置，测试服务器运行中
- **Pass 条件**：
  - HTTP 状态码 200
  - `tweets` 为数组（允许为空——搜索无结果时返回空数组，不 500）
  - `nextCursor` 为 `string | null`（有更多结果时非空，供翻页）
  - 非空时数组元素含 `id_str`、`text`、`entities`、`user` 字段

---

## AC-TWEET-011：外壳请求携带登录 cookie（回归防护）

- **输入**：`FetcherService`（`apiKey` = base64(`auth_token=…;ct0=…;twid=u%3D…;`)）；`axios.get` 被 spy，
  返回可用的 legacy 外壳 HTML（含 site verification meta + `ondemand.s`）
- **预期输出**：解析 transaction 文档时，对 X 外壳 URL 发出的请求头附带**解码后的 cookie**；
  未配置 `apiKey` 时不带 cookie
- **验证方法**：`bun run verify/index.ts --ac AC-TWEET-011`
- **前置条件**：无（mock，离线，不触网）
- **Pass 条件**：
  - 首个请求 URL 为 `https://x.com/home`（`X_SHELL_URLS[0]`）
  - `config.headers.cookie` 等于解码后的 cookie 字符串
  - 未配置 `apiKey` 时请求头不含 `cookie` 键
- **回归来源**：上游 Rettiwt #885 曾以「抓外壳时附 cookie」修好同一错误，被 #888 合并时丢失。
  本 AC 锁住「外壳请求必须带 cookie」这一不变量（见 [postmortem 013](../../docs/postmortem/013-upstream-frontend-drift.md)）

---

## AC-TWEET-012：文章型推文（X Article）解析出标题与正文（离线）

- **输入**：`TweetResultByRestId` 的 `article.article_results.result` 节点
  （含 `rest_id` / `title` / `preview_text`；开启 `withArticlePlainText` 时含 `plain_text`）
- **预期输出**：`EnrichedTweet.article` 为 `{ id, url, title, previewText, plainText }`；
  无 article 节点（仅正文里一条 `x.com/i/article/…` 链接）时 `article` 为 undefined
- **验证方法**：`bun run verify/index.ts --ac AC-TWEET-012`
- **前置条件**：无（纯函数，离线）
- **Pass 条件**：
  - `mapArticle` 由原始节点映射出 `title`（去首尾空白）与 `plainText`
  - `isArticleUrl` 命中 `x.com/i/article/<id>` 与 `x.com/<user>/article/<id>`，不误伤 Space / 外链
  - 无 metadata 时不构造空卡片（返回 null，正文裸链接照常渲染，优雅降级）

---

## AC-TWEET-013：`TweetResultByRestId` 携带文章全文 field toggle（离线）

- **输入**：`TweetRequests.details(id)`
- **预期输出**：`params.fieldToggles` 为 JSON 字符串 `{"withArticlePlainText":true}`
- **验证方法**：`bun run verify/index.ts --ac AC-TWEET-013`
- **前置条件**：无（纯函数，离线）
- **Pass 条件**：
  - `fieldToggles` 为字符串且 `JSON.parse` 后等于 `{ withArticlePlainText: true }`
    （对象形式会被 axios 序列化成 `fieldToggles[withArticlePlainText]=true`，X 忽略之——
    这正是文章全文长期缺失的根因）

---

## AC-TWEET-014：文章富文本 `content_state` 解析为块文档（离线）

- **输入**：`test/fixtures/articles/*.json`（`article.article_results.result`，真实上游抓取）
- **预期输出**：`parseContentState` 产出 `ArticleBlock[]`（段落 / 标题 / 列表 / 引用 / markdown / 图片 / 嵌入帖 / 分隔线）
- **验证方法**：`bun run verify/index.ts --ac AC-TWEET-014`
- **前置条件**：无（纯函数，离线）
- **Pass 条件**：
  - 段落块携带行内 run（LINK 实体、`data.mentions/hashtags` span、Bold/Italic 样式）
  - 行内样式只作用于其区间：Bold/Italic 的起止也是 run 切分点，不整段误加粗
    （回归样例 `test/fixtures/articles/2103463356913098908.json` 的段首 Bold）
  - `MARKDOWN` 实体 → markdown 块（GFM 表格原样保留）
  - `MEDIA` 实体经 `media_entities` 解析为图片块；`header-*`/list 块映射为对应类型
  - entityMap 的数组与 Record 两种形态均可解析；无块时返回空数组

---

## AC-TWEET-015：旧 flat 文章缓存回填升级为富文本（离线）

- **输入**：缓存中的推文 `article.format === 'plain'`（仅 `plainText`）+ 正文里的文章链接实体
- **预期输出**：`getLocalTweet` 重抓一次上游，替换为 `format === 'rich'` 的块文档并 best-effort 写回缓存
- **验证方法**：`bun run verify/index.ts --ac AC-TWEET-015`
- **前置条件**：无（mock 缓存层与上游取数，离线）
- **Pass 条件**：
  - flat 缓存触发 `getEnrichedTweet` 重抓，`article.format` 变为 `rich`
  - 已是 rich 的缓存直接返回，不重抓、不写回
  - 无文章链接的推文不触发重抓

---

## AC-TWEET-016：文章块文档真实渲染（离线）

- **输入**：`ArticleBody` + 由 fixture 解析出的块文档
- **预期输出**：标题 / 段落 / 列表 / GFM 表格 / 图片 / 嵌入帖均渲染为对应 HTML
- **验证方法**：`bun run verify/index.ts --ac AC-TWEET-016`
- **前置条件**：无（`renderToString`，离线）
- **Pass 条件**：
  - markdown 表格渲染为 `<table>`；链接渲染为 `<a target="_blank" rel="noopener noreferrer">`
  - 图片块渲染 `<img>`；嵌入帖渲染指向 `x.com/i/status/<id>` 的链接
  - 有序/无序列表渲染为 `<ol>`/`<ul>`；标题渲染为 `h2/h3/h4`

---

## AC-TWEET-017：文章分块翻译离线契约（离线）

- **输入**：含 link / mention 锚点的段落块；已中文 / 含假名 / 纯英文文本；`tweetSchema` 的
  `updateArticleTranslations` 变体
- **预期输出**：`serializeArticleBlock` 把块内非文本 run 按序换成 `<<__LINK_n__>>`；
  `looksLikeChinese` 对「含 CJK 且无假名」判真；持久化 intent 校验通过/拒绝非法载荷
- **验证方法**：`bun run verify/index.ts --ac AC-TWEET-017`
- **前置条件**：无（纯函数，离线；不调 LLM）
- **Pass 条件**：
  - `serializeArticleBlock` 的 `text` 与 `placeholders` 按 run 出现顺序编号（从 0 起）
  - `looksLikeChinese('这是一段中文')` / `'中文 mixed with English'` 为真；日文、纯英文为假
  - `tweetSchema.safeParse` 接受 `{ blocks: Record<string,string> }`，拒绝非字符串块值

---

## AC-TWEET-018：文章块翻译三态渲染 + 占位符还原（离线）

- **输入**：含标题 + 段落（段内一个 link 锚点）的块文档，`translations` 用 `<<__LINK_0__>>`
  锚定该链接
- **预期输出**：`ArticleBody` 按 `mode` 渲染原文 / 仅译文 / 双语；译文里的占位符还原为原
  run 的可点击元素
- **验证方法**：`bun run verify/index.ts --ac AC-TWEET-018`
- **前置条件**：无（`renderToString`，离线）
- **Pass 条件**：
  - `original`：仅原文可见，译文串不出现
  - `translation`：仅译文可见，原文不出现；`<<__LINK_0__>>` 不再出现且还原出链接 `href`
  - `bilingual`：原文与译文同时出现

---

## AC-TWEET-019：内嵌推文渲染（离线）

- **输入**：含 `embed-tweet` 块的文章（真实样例 `test/fixtures/articles/2104076282107723935.json`，
  4 个 `TWEET` 实体）；`ArticleBody` 的 `renderEmbed` 注入渲染器（有值 / 无值）
- **预期输出**：`collectEmbeddedTweetIds` 按序去重提取内嵌推文 id；`renderEmbed` 有值时委派给注入的
  真实推文渲染（不再产出「在 X 查看」链接卡），无值（取数失败/离线）时回退轻量链接卡
- **验证方法**：`bun run verify/index.ts --ac AC-TWEET-019`
- **前置条件**：无（纯函数 + `renderToString`，离线）
- **Pass 条件**：
  - 真实样例解析出的内嵌推文 id 为 `[2103032879496540640, 2103768558429958335, 2104037017873162442, 2103868710561911209]`
  - 重复 id 去重且保持出现顺序
  - 注入渲染器时输出其内容且不出现 `x.com/i/status/<id>` 链接卡；渲染器返回空值时回退链接卡

---

## 总计：19 条 AC

| AC           | 分类                  | 依赖外部 API | 依赖 AI |
| ------------ | --------------------- | ------------ | ------- |
| AC-TWEET-001 | 纯函数/离线           | 否           | 否      |
| AC-TWEET-002 | 纯函数/离线           | 否           | 否      |
| AC-TWEET-003 | 纯函数/离线           | 否           | 否      |
| AC-TWEET-004 | 纯函数/离线           | 否           | 否      |
| AC-TWEET-005 | 集成                  | 是 (Twitter) | 否      |
| AC-TWEET-006 | 集成                  | 是 (Twitter) | 否      |
| AC-TWEET-007 | 纯函数/离线           | 否           | 否      |
| AC-TWEET-008 | 集成                  | 是 (Twitter) | 否      |
| AC-TWEET-009 | 纯函数/离线           | 否           | 否      |
| AC-TWEET-010 | 集成                  | 是 (Twitter) | 否      |
| AC-TWEET-011 | 行为断言（mock/离线） | 否           | 否      |
| AC-TWEET-012 | 纯函数/离线           | 否           | 否      |
| AC-TWEET-013 | 纯函数/离线           | 否           | 否      |
| AC-TWEET-014 | 纯函数/离线           | 否           | 否      |
| AC-TWEET-015 | 行为断言（mock/离线） | 否           | 否      |
| AC-TWEET-016 | 行为断言（渲染/离线） | 否           | 否      |
| AC-TWEET-017 | 纯函数/离线           | 否           | 否      |
| AC-TWEET-018 | 行为断言（渲染/离线） | 否           | 否      |
| AC-TWEET-019 | 纯函数 + 渲染（离线） | 否           | 否      |

> 离线 AC 可通过 fixture 直接验证，无需网络；集成 AC 需要 `TWEET_KEYS` 环境变量。
