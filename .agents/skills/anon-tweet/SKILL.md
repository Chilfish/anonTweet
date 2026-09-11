---
name: anon-tweet
description: >-
  匿名浏览 Twitter/X 推文与 Instagram 帖子的 API 使用指南（BFF 聚合接口，读取无需 API Key）。
  用 /api/tweet/search 按关键词或 X 高级语法搜索推文、/api/tweet/get/{id} 与
  /api/tweet/replies/{id} 读取单条推文及回复、/api/user/get/{username} 查询用户资料、
  /api/ig/get/{id} 拉取 IG 帖子（caption/媒体），另有 AI 翻译与图片代理接口。
  当需要搜索/抓取推文、查看 X 用户资料或 IG 帖子内容时使用。
license: MIT
compatibility: 需要 PowerShell 7+（pwsh）与网络访问部署实例；纯 PowerShell 封装，不依赖 curl/python3
metadata:
  author: Chilfish
  version: "1.2.0"
  base-url: https://anon-tweet.chilfish.top
  repository: https://github.com/Chilfish/anonTweet
  updated: "2026-09-12"
---

# Anon Tweet API

匿名浏览 Twitter/X 推文与 Instagram 帖子的全栈服务（BFF 聚合接口，机器可读）。

- 站点: https://anon-tweet.chilfish.top
- 站点导航: https://anon-tweet.chilfish.top/llms.txt
- OpenAPI 规范: `references/anon-tweet-openapi.json`（随本 skill 附带；线上同步自 `https://anon-tweet.chilfish.top/openapi.json`）
- 自部署: https://github.com/Chilfish/anonTweet（用户时间线等受限接口请自部署 + 自己的 Key）

## 何时使用

- 搜索推文（关键词 / hashtag / 用户 / 高级语法过滤）
- 读取单条推文、其回复列表或 List 时间线
- 查询 X 用户资料
- 拉取 Instagram 帖子（caption / 媒体 / 标签）或翻译 caption
- 在页面上展示 IG 图片时走图片代理绕过 CDN CORS

## 快速开始

统一入口 `scripts/anon-tweet.ps1`（纯 PowerShell，读取接口无需 Key）：

```powershell
$A = "$HOME/.agents/skills/anon-tweet/scripts/anon-tweet.ps1"

pwsh -NoProfile -File $A search "from:GeminiApp" --type latest --count 5
pwsh -NoProfile -File $A get 2032649981690261684
pwsh -NoProfile -File $A user meeeei.gt
pwsh -NoProfile -File $A ig DWlrun0AVbE
pwsh -NoProfile -File $A help
```

任何命令加 `--json` 输出原始 JSON；直接调接口见下方「核心接口」。

## 核心接口

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| GET | `/api/tweet/search?q=...` | 推文搜索（核心，支持 X 高级语法） |
| GET | `/api/tweet/get/{id}` | 单条推文（三层缓存 → Twitter 原文；返回 EnrichedTweet 数组，可能为空） |
| GET | `/api/tweet/replies/{id}?cursor=...` | 推文回复（cursor 分页） |
| GET | `/api/tweet/list/{id}` | List 时间线（EnrichedTweet 数组） |
| GET | `/api/user/get/{username}` | 用户资料（DB 缓存，无记录返回 null） |
| GET | `/api/user/timeline/{username}` | 用户时间线（EnrichedTweet 数组） |
| GET | `/api/ig/get/{id}` | IG 帖子（id 为 shortcode；未配 INS_COOKIES 返回空数组） |
| POST | `/api/ig/translate/{id}` | IG caption 翻译（manualTranslation 传入则跳过 AI） |
| GET | `/api/proxy/image?url=...` | 图片代理（url 白名单校验，返回二进制） |
| POST | `/api/ai-translation` | 通用 AI 翻译（type + tweet/igPost） |
| POST | `/api/ai-vision` | 图片/视频 AI 描述 |
| POST | `/api/bili-post` | B 站动态抓取 |

完整 schema 见 `references/anon-tweet-openapi.json`。

## 搜索参数

- `q`（必填，≤500 字符）：支持 X 高级搜索语法，如 `(from:user) since:2025-01-01`、`from:GeminiApp`、`#hashtag lang:ja`
- `type`：`latest`（默认）/ `top`
- `count`：默认 20
- `cursor`：分页游标，取自上一响应的 `nextCursor`（`null` 表示没有更多）

日期过滤（since:/until:）用 `YYYY-MM-DD`；需要近期内容时按当前日期推算。

## 直接调用（PowerShell）

```powershell
$base = 'https://anon-tweet.chilfish.top'

# 搜索最新推文
(Invoke-RestMethod "$base/api/tweet/search?q=cat&type=latest&count=5").tweets

# 按用户搜索（高级语法需 URL 编码）
Invoke-RestMethod "$base/api/tweet/search?q=$([uri]::EscapeDataString('from:GeminiApp'))&type=latest&count=3"

# 单条推文 / 回复 / 用户资料
Invoke-RestMethod "$base/api/tweet/get/2032649981690261684"
Invoke-RestMethod "$base/api/tweet/replies/2032649981690261684"
Invoke-RestMethod "$base/api/user/get/meeeei.gt"

# IG 帖子 / 图片代理（二进制落盘）
Invoke-RestMethod "$base/api/ig/get/DWlrun0AVbE"
Invoke-WebRequest "$base/api/proxy/image?url=$([uri]::EscapeDataString($imgUrl))" -OutFile "$env:TEMP/ig.jpg"
```

## AI 翻译（需自备 key）

翻译接口不在辅助脚本内（需 apiKey/model/provider），直接 POST：

```powershell
$body = @{
  apiKey  = $env:ANON_TWEET_AI_KEY
  provider = 'deepseek'      # google / deepseek / openrouter
  model    = 'deepseek-chat'
} | ConvertTo-Json -Compress
Invoke-RestMethod "https://anon-tweet.chilfish.top/api/ig/translate/DWlrun0AVbE" -Method Post `
  -ContentType 'application/json' -Body $body
```

若已有译文，可传 `manualTranslation` 跳过 AI；`--manual` 即走此路径。

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
- 图片代理只放行图片扩展名或 cdninstagram.com / fbcdn.net 域名（防 SSRF）
- 搜索可混用多语言关键词（英文/日文均可，如 `機械学習`）
- **输出不会污染**：脚本按 `[Console]::IsOutputRedirected` 自适应——交互终端保留颜色，被管道/CI/Agent 捕获时改写纯 stdout（`Write-Output`），因此不会出现 `#< CLIXML` 噪音（历史上 `Write-Host` 写成信息流才会被序列化）。机器解析仍建议直接加 `--json`
- 搜索关键词用 `AI` 这类短词会命中其他语言的同形子串（葡语 `aí` 等），建议加 `lang:`、`#AI` 或引号精确匹配

## 输出落位

- 结果只用于当场阅读时，直接 stdout，不落盘。
- 需要留存时，显式指定路径（`--json` 配合重定向，或 `image --out`）；
  临时产物放 `$env:TEMP`，避免污染当前工作区/仓库根目录。
