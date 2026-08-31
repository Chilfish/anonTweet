# Tweet API 验收标准

> 版本：1.1 | 日期：2026-08-31（新增 AC-TWEET-009/010 搜索验收）
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
- **预期输出**：返回 `EnrichedTweet[]` 数组（格式同 `/api/tweet/get`，目前不含分页字段）
- **验证方法**：`bun verify --ac AC-TWEET-010`
- **前置条件**：`TWEET_KEYS` 已配置，测试服务器运行中
- **Pass 条件**：
  - HTTP 状态码 200
  - 返回体为数组（允许为空——搜索无结果时返回空数组，不 500）
  - 非空时数组元素含 `id_str`、`text`、`entities`、`user` 字段

---

## 总计：10 条 AC

| AC            | 分类        | 依赖外部 API | 依赖 AI |
| ------------- | ----------- | ------------ | ------- |
| AC-TWEET-001  | 纯函数/离线 | 否           | 否      |
| AC-TWEET-002  | 纯函数/离线 | 否           | 否      |
| AC-TWEET-003  | 纯函数/离线 | 否           | 否      |
| AC-TWEET-004  | 纯函数/离线 | 否           | 否      |
| AC-TWEET-005  | 集成        | 是 (Twitter) | 否      |
| AC-TWEET-006  | 集成        | 是 (Twitter) | 否      |
| AC-TWEET-007  | 纯函数/离线 | 否           | 否      |
| AC-TWEET-008  | 集成        | 是 (Twitter) | 否      |
| AC-TWEET-009  | 纯函数/离线 | 否           | 否      |
| AC-TWEET-010  | 集成        | 是 (Twitter) | 否      |

> 离线 AC 可通过 fixture 直接验证，无需网络；集成 AC 需要 `TWEET_KEYS` 环境变量。
