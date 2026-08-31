---
name: anon-tweet
description: >-
  匿名浏览 Twitter/X 推文与 Instagram 帖子的 API 使用指南（BFF 聚合接口，读取无需 API Key）。
  用 /api/tweet/search 按关键词或 X 高级语法搜索推文、/api/tweet/get/{id} 与
  /api/tweet/replies/{id} 读取单条推文及回复、/api/user/get/{username} 查询用户资料、
  /api/ig/get/{id} 拉取 IG 帖子（caption/媒体），另有 AI 翻译与图片代理接口。
  当需要搜索/抓取推文、查看 X 用户资料或 IG 帖子内容时使用；完整 OpenAPI 见 /openapi.json。
license: MIT
compatibility: 需要网络访问部署实例；适用于 Claude Code、claude.ai 及兼容 Agent Skills 的代理
metadata:
  author: Chilfish
  version: "1.0.0"
  base-url: https://anon-tweet.chilfish.top
  repository: https://github.com/Chilfish/anonTweet
  updated: "2026-08-31"
---

# Anon Tweet API

匿名浏览 Twitter/X 推文与 Instagram 帖子的全栈服务（BFF 聚合接口，机器可读）。

- 站点: https://anon-tweet.chilfish.top
- 站点导航: https://anon-tweet.chilfish.top/llms.txt
- OpenAPI 规范: https://anon-tweet.chilfish.top/openapi.json（含全部路径与 schema）
- 自部署: https://github.com/Chilfish/anonTweet（用户时间线等受限接口请自部署 + 自己的 Key）

## 何时使用

- 搜索推文（关键词 / hashtag / 用户 / 高级语法过滤）
- 读取单条推文、其回复列表或 List 时间线
- 查询 X 用户资料
- 拉取 Instagram 帖子（caption / 媒体 / 标签）或翻译 caption
- 在页面上展示 IG 图片时走图片代理绕过 CDN CORS

## 核心接口

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| GET | `/api/tweet/search?q=...` | 推文搜索（核心，支持 X 高级语法） |
| GET | `/api/tweet/get/{id}` | 单条推文（三层缓存 → Twitter 原文；返回 EnrichedTweet 数组，可能为空） |
| GET | `/api/tweet/replies/{id}?cursor=...` | 推文回复（cursor 分页） |
| GET | `/api/tweet/list/{id}` | List 时间线（EnrichedTweet 数组） |
| GET | `/api/user/get/{username}` | 用户资料（DB 缓存，无记录返回 null） |
| GET | `/api/ig/get/{id}` | IG 帖子（id 为 shortcode；未配 INS_COOKIES 返回空数组） |
| POST | `/api/ig/translate/{id}` | IG caption 翻译（manualTranslation 传入则跳过 AI） |
| GET | `/api/proxy/image?url=...` | 图片代理（url 白名单校验，返回二进制） |

⚠️ `/api/user/timeline/{username}` 当前固定返回 429（防滥用），查询用户时间线请用自部署实例 + 自己的 Key。

## 搜索参数

- `q`（必填，≤500 字符）：支持 X 高级搜索语法，如 `(from:user) since:2025-01-01`、`from:GeminiApp`、`#hashtag lang:ja`
- `type`：`latest`（默认）/ `top`
- `count`：默认 20
- `cursor`：分页游标，取自上一响应的 `nextCursor`（`null` 表示没有更多）

日期过滤（since:/until:）用 `YYYY-MM-DD`；需要近期内容时按当前日期推算。

## 请求示例

```bash
# 搜索最新推文
curl -sL "https://anon-tweet.chilfish.top/api/tweet/search?q=cat&type=latest&count=5"

# 按用户搜索（高级语法）
curl -sL "https://anon-tweet.chilfish.top/api/tweet/search?q=from%3AGeminiApp&type=latest&count=3"

# 单条推文详情
curl -sL "https://anon-tweet.chilfish.top/api/tweet/get/2032649981690261684"

# 推文回复（含翻页）
curl -sL "https://anon-tweet.chilfish.top/api/tweet/replies/2032649981690261684?cursor=..."

# 用户资料
curl -sL "https://anon-tweet.chilfish.top/api/user/get/meeeei.gt"

# IG 帖子（shortcode）
curl -sL "https://anon-tweet.chilfish.top/api/ig/get/DWlrun0AVbE"

# 图片代理
curl -sL "https://anon-tweet.chilfish.top/api/proxy/image?url=<urlencoded>"
```

## 数据结构要点

- **EnrichedTweet**: `id_str`、`text`、`url`、`lang`（如 en/ja/zxx）、`created_at`（ISO 8601）、`user`（TweetUser）、`entities`（Entity[]），可选 `quoted_tweet_id` / `card` / `mediaDetails` / `visionInfo`
- **TweetUser**: `id_str`、`name`、`screen_name`、`profile_image_url_https`、`verified`、`is_blue_verified`、`verified_type`（Business/Government）、`profile_image_shape`（Circle/Square/Hexagon）
- **Entity**: `type` ∈ text / hashtag / mention / url / media / symbol / media_alt / separator；`index` 为文本偏移；hashtag/mention/url/media/symbol 带 `href`；`aiTranslation` / `translation` 存翻译
- **SearchResponse / RepliesResponse**: `{ tweets: EnrichedTweet[], nextCursor: string | null }`
- **IGPost**: `id`（shortcode）、`post_id`、`url`、`username`、`fullname`、`description`（caption）、`tags`、`likes`、`type`（post/reel/story/highlight）、`media`（IGMedia[]）、`avatar_url`
- **RawUser**: `fullName`、`userName`、`followersCount`、`followingsCount`、`statusesCount`、`likeCount`、`description`、`location`、`createdAt`、`isVerified`

## 使用注意

- 回复/搜索翻页都靠 `nextCursor`，`null` 即到底
- 单条推文接口返回**数组**（字段对齐 react-tweet），可能为空数组
- IG 未配置 `INS_COOKIES` 时 `/api/ig/get` 返回空数组；AI 翻译接口需自备 apiKey + model（provider: google / deepseek / openrouter）
- 图片代理 `/api/proxy/image?url=<urlencoded>` 只放行图片扩展名或 cdninstagram.com / fbcdn.net 域名（防 SSRF）
- 搜索可混用多语言关键词（英文/日文均可，如 `機械学習`）
