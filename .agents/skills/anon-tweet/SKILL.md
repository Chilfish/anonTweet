---
name: anon-tweet
description: >-
  匿名读取 Twitter/X 推文与 Instagram 帖子的 BFF API 指南。用 /api/tweet/search 按关键词或 X 高级语法搜索推文，
  /api/tweet/get/{id} 读取单条推文与 X Article 长文，/api/tweet/replies/{id} 翻页读取回复，
  /api/user/get/{username} 查询 X 用户资料，/api/ig/get/{id} 拉取 IG 帖子的 caption 与媒体；
  另含 AI 翻译（推文 / IG / 长文按块）与图片代理。需要搜索或抓取推文、读取长文、查看 X 用户或 IG 帖子时使用。
license: MIT
compatibility: 需要 Bun 1.x 运行随附 TS CLI（或 Node 22.6+ 加 --experimental-strip-types），并需网络访问部署实例；读取接口无需 API Key。
metadata:
  author: Chilfish
  version: "1.4.0"
  base-url: https://anon-tweet.chilfish.top
  repository: https://github.com/Chilfish/anonTweet
  updated: "2026-11-24"
---

# Anon Tweet API

匿名读取 Twitter/X 与 Instagram 的 BFF 聚合接口，机器可读、可直接取回。

- 站点：https://anon-tweet.chilfish.top
- 站点导航：https://anon-tweet.chilfish.top/llms.txt
- OpenAPI：线上 `/openapi.json`，随附快照 `references/anon-tweet-openapi.json`
- 自部署：https://github.com/Chilfish/anonTweet（用户时间线等受限接口需自部署 + 自己的 Key）

## 何时使用

- 搜索推文：关键词、hashtag、用户，或 `from:` / `since:` 等 X 高级语法
- 读取单条推文、回复列表、List 时间线
- 读取 X 长文（Article）：`/api/tweet/get/{id}` 对文章推文返回 `article`（标题 + 块文档）
- 查询 X 用户资料（注意：只读 DB 缓存）
- 拉取 Instagram 帖子（caption / 媒体 / 标签）或翻译 caption
- 跨域展示 IG 图片：走 `/api/proxy/image` 绕过 CDN CORS

## 快速开始

随附 CLI：`scripts/anon-tweet.ts`（零依赖，读取接口无需 Key）。把 `<skill>` 换成实际的 skill 目录：

```bash
# 仓库内
bun .agents/skills/anon-tweet/scripts/anon-tweet.ts search "from:GeminiApp" --count 5
# 已安装到个人 skills（~/.agents/skills/anon-tweet）
bun <skill>/scripts/anon-tweet.ts help
```

常用命令：

```bash
bun <skill>/scripts/anon-tweet.ts search "from:GeminiApp" --type latest --count 5
bun <skill>/scripts/anon-tweet.ts get 2032649981690261684
bun <skill>/scripts/anon-tweet.ts replies 2032649981690261684 --cursor <nextCursor>
bun <skill>/scripts/anon-tweet.ts user meeeei.gt
bun <skill>/scripts/anon-tweet.ts ig DWlrun0AVbE
bun <skill>/scripts/anon-tweet.ts image "<图片 URL>" --out ./ig.jpg
```

- 任何命令加 `--json` 输出原始 JSON；成功走 stdout，失败走 stderr 且退出码非 0
- `--base-url` 或环境变量 `ANON_TWEET_BASE_URL` 可覆盖站点
- `translate` 支持 `--manual "译文"` 或 AI（见「AI 翻译」）

## 核心接口

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| GET | `/api/tweet/search?q=...` | 推文搜索（核心，支持 X 高级语法） |
| GET | `/api/tweet/get/{id}` | 单条推文（三层缓存 → Twitter 原文；文章推文另含 `article`） |
| GET | `/api/tweet/replies/{id}?cursor=...` | 推文回复（cursor 分页） |
| GET | `/api/tweet/list/{id}` | List 时间线（推文数组） |
| GET | `/api/user/get/{username}` | 用户资料（只读 DB 缓存，未命中返回 `null`） |
| GET | `/api/user/timeline/{username}?cursor=...` | 用户「帖子 + 回复」时间线；**默认关闭，固定 429** |
| GET | `/api/ig/get/{id}` | IG 帖子（简化版，不触发翻译；未配 `INS_COOKIES` 返回空数组） |
| POST | `/api/ig/get/{id}` | IG 帖子，可带 `enableAITranslation` 触发翻译 |
| POST | `/api/ig/translate/{id}` | IG caption 翻译（`manualTranslation` 则跳过 AI） |
| GET | `/api/proxy/image?url=...` | 图片代理（域名/扩展名白名单，返回二进制） |
| POST | `/api/ai-translation` | 统一 AI 翻译（`type`: `twitter` / `ins` / `article`） |
| POST | `/api/ai-vision` | 图片/视频 AI 描述、OCR 翻译、保存 |

`POST /api/tweet/set` 与 `POST /api/ai-test` 是站点内部写入/连通性端点，不要用于外部集成。

完整 schema 见 `references/anon-tweet-openapi.json`。

## 搜索参数

- `q`（必填，≤500 字符）：支持 X 高级搜索语法，如 `(from:user) since:2025-01-01`、`from:GeminiApp`、`#hashtag lang:ja`
- `type`：`latest`（默认）/ `top`
- `count`：默认 20
- `cursor`：分页游标，取自上一响应的 `nextCursor`（`null` 表示没有更多）

日期过滤（`since:` / `until:`）用 `YYYY-MM-DD`；需要近期内容时按当前日期推算。

## 直接调用（fetch）

```ts
const base = 'https://anon-tweet.chilfish.top'

// 搜索：返回 { tweets, nextCursor }
const page = await fetch(`${base}/api/tweet/search?q=cat&type=latest&count=5`)
  .then(r => r.json())

// 单条推文：直接返回数组（可能为空）
const tweets = await fetch(`${base}/api/tweet/get/2032649981690261684`)
  .then(r => r.json())

// 回复：{ tweets, nextCursor }
const replies = await fetch(`${base}/api/tweet/replies/2032649981690261684`)
  .then(r => r.json())

// 用户资料 / IG 帖子
const user = await fetch(`${base}/api/user/get/meeeei.gt`).then(r => r.json())
const posts = await fetch(`${base}/api/ig/get/DWlrun0AVbE`).then(r => r.json())

// 图片代理：落盘为二进制
const image = await fetch(`${base}/api/proxy/image?url=${encodeURIComponent(imageUrl)}`)
  .then(r => r.arrayBuffer())
```

## AI 翻译（需自备 key）

provider 支持 `google` / `deepseek` / `openrouter`；`baseUrl` 若不在官方域名白名单会被拒绝。

IG caption 翻译：

```ts
const res = await fetch(`${base}/api/ig/translate/DWlrun0AVbE`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    apiKey: process.env.ANON_TWEET_AI_KEY,
    provider: 'deepseek',
    model: 'deepseek-chat',
  }),
}).then(r => r.json())
// => { captionTranslation: string }
```

已有译文可传 `manualTranslation` 跳过 AI（CLI 用 `--manual "译文"`）。

统一翻译端点按 `type` 区分：`twitter`（默认，翻译推文 `entities`）、`ins`（传 `igPost`）、`article`（传 `article`，按块返回译文）。请求体字段见 OpenAPI。

## 数据结构

常用形状与字段坑见 [references/data-shapes.md](references/data-shapes.md)：`EnrichedTweet`、`TweetArticle`、`Entity`、`IGPost`、`RawUser`、分页响应、错误响应。

## 使用注意

- **翻页**：搜索 / 回复 / 用户时间线用 `nextCursor`，`null` 即到底
- **单条推文返回数组**：字段对齐 react-tweet，可能为空数组
- **用户资料是缓存读**：`/api/user/get` 未命中返回 `null`，不代表账号不存在
- **用户时间线默认关闭**：返回 429；需要时自部署并设 `ENABLE_TIMELINE=true` + 自己的 `TWEET_KEYS`
- **IG 依赖 cookie**：未配置 `INS_COOKIES` 时 `/api/ig/get` 返回空数组
- **图片代理白名单**：只放行图片扩展名与 `cdninstagram.com` / `fbcdn.net`，其他返回 403（防 SSRF）
- **搜索短词**：`AI` 这类短词会命中其他语言的同形子串（如葡语 `aí`），建议加 `lang:`、`#AI` 或引号
- **多语言关键词**：英文 / 日文等可直接混用（如 `機械学習`）
- **输出隔离**：CLI 在管道 / CI 中自动关闭 ANSI 颜色，JSON 只走 stdout，不会污染机器解析

## 输出落位

- 只为当场阅读时直接 stdout，不落盘。
- 需要留存时显式指定路径（`--json` 重定向，或 `image --out`）。
- 临时产物放系统临时目录（脚本默认用 `os.tmpdir()`），避免污染工作区。
