# 数据结构参考

字段级定义也可从 `references/anon-tweet-openapi.json`（OpenAPI 3.1）或线上 `/openapi.json` 获取。本文件只列调用时最常打交道的形状与坑。

## EnrichedTweet

`/api/tweet/get`、`/search`、`/replies`、`/list`、`/user/timeline` 返回的推文统一是这一形状（对齐 `@chilfish/tweet` 的 `EnrichedTweet`，并带 app 扩展字段）。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 推文 ID |
| `text` | string | 正文纯文本 |
| `url` | string | 推文永久链接 |
| `lang` | string | 语言代码，如 `en` / `ja` / `zxx`（无语言） |
| `created_at` | string | ISO 8601 时间 |
| `user` | TweetUser | 作者 |
| `entities` | Entity[] | 文本实体（含翻译字段） |
| `quotedTweetId` | string? | 引用推文 ID |
| `quotedTweet` | EnrichedTweet? | 引用推文（递归） |
| `card` | object? | 链接预览卡 |
| `poll` | object? | 投票数据 |
| `space` | object? | X Space 卡片 |
| `article` | TweetArticle? | X 长文（仅文章推文） |
| `mediaDetails` | object[]? | 图片 / 视频详情 |
| `visionInfo` | AIVisionInfo[]? | AI 看图描述 / OCR 结果 |
| `in_reply_to_status_id_str` | string? | 回复目标 |
| `possibly_sensitive` | boolean? | 敏感内容标记 |

## TweetUser

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 用户 ID |
| `name` | string | 显示名 |
| `screen_name` | string | @ 用户名（不含 `@`） |
| `profile_image_url_https` | string | 头像 URL |
| `verified` | boolean | 是否认证 |
| `is_blue_verified` | boolean | 是否蓝标 |
| `verified_type` | `Business` / `Government`? | 认证类型 |
| `profile_image_shape` | `Circle` / `Square` / `Hexagon` | 头像形状 |

## TweetArticle / ArticleBlock

`article` 仅对 X 长文出现。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 文章 rest_id（与推文 id 不同） |
| `url` | string | 文章永久链接 |
| `title` | string | 标题 |
| `previewText` | string? | 摘要 |
| `plainText` | string? | 纯文本全文（`content_state` 缺失时兜底） |
| `format` | `rich` / `plain` | `rich` 才有 `blocks` |
| `coverImage` | object? | 封面图 |
| `publishedAt` | number? | 发布时间（epoch ms） |
| `blocks` | ArticleBlock[]? | 块文档 |

`ArticleBlock` 用 `type` 判别：

| `type` | 附加字段 |
| --- | --- |
| `paragraph` / `heading` / `list-item` / `quote` | `runs`（text / link / mention / hashtag + styles）；heading 另有 `level`，list-item 另有 `ordered` |
| `markdown` | `text`（GFM 原文） |
| `image` | `media`、`caption` |
| `embed-tweet` | `tweetId` |
| `link` | `url` |
| `divider` / `unknown` | — |

块翻译结果形状为 `{ title?: string, blocks: Record<blockKey, string> }`；link / mention / hashtag 以 `<<__LINK_n__>>` 占位符锚定。

## Entity

`entities` 是推文的文本分段，`index` 为在原文中的偏移。

| 字段 | 说明 |
| --- | --- |
| `type` | `text` / `hashtag` / `mention` / `url` / `media` / `symbol` / `media_alt` / `separator` |
| `text` | 该段文本 |
| `index` | 文本偏移 |
| `href` | 可点击类型（hashtag / mention / url / media / symbol）的链接 |
| `translation` | 手动翻译 |
| `aiTranslation` | AI 翻译 |
| `mediaIndex` | `separator` 对应媒体索引 |

## 分页响应

`/api/tweet/search`、`/api/tweet/replies/{id}`、`/api/user/timeline/{username}` 统一返回：

```ts
interface TweetPage {
  tweets: EnrichedTweet[]
  nextCursor: string | null
}
```

`nextCursor` 为 `null` 表示到底；把上一页的值原样传给下一次请求的 `?cursor=`。

`/api/tweet/get/{id}` 与 `/api/tweet/list/{id}` 直接返回数组（不是分页对象）；`get` 可能返回空数组。

## IGPost / IGMedia

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | URL shortcode（路由主键） |
| `post_id` | string | 数字 ID |
| `url` | string | 帖子 URL |
| `username` / `fullname` | string | 作者 |
| `description` | string | caption，翻译目标 |
| `captionTranslation` | string? | AI / 手动译文 |
| `tags` | string[]? | hashtag |
| `likes` | number | 点赞数 |
| `type` | `post` / `reel` / `story` / `highlight` | 帖子类型 |
| `media` | IGMedia[] | 媒体列表 |
| `avatar_url` | string? | 作者头像 |
| `created_at` | string? | ISO 时间 |
| `location_name` | string? | 位置 |
| `coauthors` | object[]? | 合作者 |
| `verified` | boolean? | 作者认证 |
| `audio` | IGAudio? | 音乐 / 音频信息 |
| `expires` | string? | 快拍过期时间 |
| `highlight_title` | string? | 精选集标题 |
| `storyLink` | object? | 快拍链接贴纸 |
| `resharedFrom` | object? | 转发来源 |

`IGMedia`：`num`、`media_id`、`shortcode?`、`display_url`、`video_url?`、`width`、`height`、`width_original?`、`height_original?`、`type`（`photo` / `video`）、`tagged_users?`。

`/api/ig/get/{id}` 的 `{id}` 可以是：

- post / reel shortcode：`DWlrun0AVbE`
- 单条 story：`story~{username}~{mediaId}`
- 用户当前快拍列表：`stories~{username}`
- 精选集：`highlight~{id}`

也接受对应的 instagram.com URL（服务端会提取 canonical id）。

## RawUser

`/api/user/get/{username}` 返回 `RawUser | null`。

| 字段 | 说明 |
| --- | --- |
| `id` | rest id |
| `userName` | @ 用户名 |
| `fullName` | 显示名 |
| `description` | 简介 |
| `followersCount` / `followingsCount` | 粉丝 / 关注数 |
| `statusesCount` | 帖子数 |
| `likeCount` | 点赞数 |
| `isVerified` | 是否认证 |
| `location` | 位置 |
| `createdAt` | 账号创建时间 |
| `profileImage` / `profileBanner` | 头像 / 封面 |
| `pinnedTweets` | 置顶推文 ID 列表 |

**注意**：该接口只读服务端 DB 缓存，不实时请求 X。未缓存过该用户时返回 `null`，不代表账号不存在。

## AIVisionInfo

`/api/ai-vision` 的结果，挂在 `EnrichedTweet.visionInfo[]`：

| 字段 | 说明 |
| --- | --- |
| `index` | 对应 `mediaDetails` 索引（0-based） |
| `mode` | `describe` / `ocr` / `custom` |
| `promptId` | 提示词 ID |
| `provider` / `model` | 实际使用的提供商 / 模型 |
| `description` | describe / custom：看图描述 |
| `originalText` | ocr：图片原文 |
| `translatedText` | ocr：中文翻译 |
| `status` | `done` / `error` |
| `error` | 失败原因 |
| `createdAt` | epoch ms |

## 错误响应

非 AI 端点的失败响应通常为：

```ts
interface ErrorResponse {
  success?: false
  error: string
  message?: string
  status?: number // 400 输入 / 404 目标缺失 / 500 上游或网关
}
```

AI 端点（`/api/ai-*`）额外带定位上下文：`targetId`、`targetType`（`tweet` / `article` / `ig`）、`model`、`provider`、`aiError`。

约定不一致之处：多数读取接口 HTTP 恒为 200，成功与否看响应体；`/api/user/timeline` 用真实 429，`/api/ig/translate` 用真实 4xx/5xx。客户端应同时检查 HTTP 状态与响应体里的 `error`。
