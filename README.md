# Anon Tweet

不用登录就能浏览 Twitter/X 推文和 Instagram 帖子，支持 AI 翻译与卡片导出。

线上实例：<https://anon-tweet.chilfish.top>

## 功能

**推文**

- 单条推文、评论线程、引用推文
- List 时间线、关键词搜索（支持 `from:`、`since:` 等 X 高级语法）

**Instagram**

- Post / Reel / Story
- 图片与视频直链下载

**AI 翻译**

- Google Gemini、DeepSeek、OpenRouter（Vercel AI SDK）
- 双语对照，可在双语 / 原文 / 仅译文之间切换
- 逐条手动编辑，手动结果与 AI 结果并存，互不覆盖
- 送模型前用占位符保护 URL、@、话题标签，避免被改写

**导出**

- 卡片截图（PNG / JPEG）
- Markdown、纯文本复制
- 媒体下载

**其他**

- 三层缓存：内存 LRU → 本地文件 → PostgreSQL（可选）
- PWA：可安装到桌面，支持从系统分享菜单直接发到本站
- 机器可读接口：`/openapi.json`、`/llms.txt`

## 技术栈

- **框架**：React Router v8（SSR + CSR）
- **运行时**：Bun 1.4、TypeScript
- **数据源**：Twitter/X 接口（内置 `rettiwt-api` 逆向适配）、Instagram（`@chilfish/gallery-dl-instagram`）
- **AI**：Vercel AI SDK（Gemini / DeepSeek / OpenRouter）
- **UI**：Tailwind CSS v4、shadcn/ui、coss、Lucide
- **状态**：Zustand（客户端）、SWR（服务端数据）
- **持久化**：Drizzle ORM + PostgreSQL（Neon），可选
- **测试**：Vitest（unit / integration / acceptance 三层）、Storybook

## 快速开始

环境要求：Bun 1.4 以上（仓库的 `packageManager` 为 `bun@1.4.2`）。

```bash
git clone https://github.com/Chilfish/anonTweet.git
cd anonTweet
bun install
```

### 配置

把 `example.env` 复制成 `.env`，按需修改。

```env
ENVIRONMENT="development"
HOSTNAME="http://localhost:9080"   # 截图回调用的绝对地址，不填时开发环境自动推断

TWEET_KEYS=""        # 不填也能用，但会被上游限流；多个 Key 用逗号分隔
INS_COOKIES=""       # Instagram cookies；不填时 /api/ig/get 返回空数组

ENABLE_AI_TRANSLATION="true"
GEMINI_API_KEY=""
GEMINI_MODEL="models/gemini-3-flash-preview"
# DEEPSEEK_API_KEY=""

ENABLE_LOCAL_CACHE="true"
ENABLE_DB_CACHE="false"
# DB_URL="postgres://..."

ENABLE_TIMELINE="false"   # 用户时间线接口，默认关闭（固定 429 防滥用）
```

<details>
<summary>TWEET_KEYS 怎么获取</summary>

内置的 rettiwt-api 走 Twitter 用户凭证抓取，配置多个 Key 可以轮换，降低被限流的概率。

1. 安装浏览器扩展：Chrome 用 [X Auth Helper](https://chromewebstore.google.com/detail/x-auth-helper/igpkhkjmpdecacocghpgkghdcmcmpfhp)，Firefox 用 [Rettiwt Auth Helper](https://addons.mozilla.org/en-US/firefox/addon/rettiwt-auth-helper)
2. 建议在无痕窗口里登录 X 账号
3. 打开扩展，点 `Get Key`，复制生成的字符串
4. 填入 `.env` 的 `TWEET_KEYS`，多个用逗号分隔

这个字符串是账号 Cookies 的 Base64 编码，权限等同于账号密码，不要外传。获取后不要手动点登出，直接关掉浏览器窗口，否则服务端会话会失效。

</details>

其余变量的含义见 [`docs/features/deploy/deployment.md`](docs/features/deploy/deployment.md)。

### 数据库（可选）

只有配置了 `DB_URL` 且 `ENABLE_DB_CACHE=true` 时才需要初始化。

```bash
bun run db:push       # 推送 schema，适合原型阶段
bun run db:generate   # 或生成迁移文件
bun run db:migrate
```

### 启动

```bash
bun run dev
```

默认运行在 <http://localhost:9080>。

## 部署

**Vercel**

在项目设置里添加 `VERCEL=true` 以启用适配器，并配置 `TWEET_KEYS`、`GEMINI_API_KEY` 和 `HOSTNAME`。`HOSTNAME` 必须是生产域名，否则截图功能拿不到正确的回调地址。

**自托管**

```bash
bun run build
bun run start
```

`bun run start` 走 `server/express.js`，默认监听 9080，可用 `PORT` 覆盖。自托管可以用本地文件缓存，建议开 `ENABLE_LOCAL_CACHE=true`；Serverless 的文件系统只读，不能用。

公开部署时还可以设 `ENABLE_AI_BASE_URL_WHITELIST=true`，配合 `ALLOWED_AI_BASE_URL_HOSTS` 限制 AI 请求的 baseUrl 目标。

## 接口

BFF 接口都在 `/api` 下，覆盖 tweet / ig / user / ai / proxy 几组，完整 schema 见线上的 [`/openapi.json`](https://anon-tweet.chilfish.top/openapi.json)；[`/llms.txt`](https://anon-tweet.chilfish.top/llms.txt) 是给 AI 爬虫和 agent 看的站点索引。

仓库同时维护了一个 agent skill（`.agents/skills/anon-tweet/`），可以用 `npx skills add Chilfish/anonTweet` 安装，之后直接调本站接口搜索推文、读取 IG 帖子。

用于截图的纯路由是 `/plain-tweet/:id` 和 `/plain-ins/:id`。

## 常用命令

```bash
bun run dev                              # 开发服务器
bun run build                            # 生产构建
bun run typecheck                        # 类型检查（typegen + tsc）
bun run lint                             # ESLint（含自动修复）
bun run test                             # 单元 + 验收测试
bun run test:integration                 # 集成测试
bun run verify/index.ts --exit-on-fail   # 离线验证套件，CI 模式
bun run storybook                        # 组件用例，http://localhost:6006
```

## 项目结构

```
app/
├── components/   # UI 组件（tweet / ins / ui）
├── lib/          # 缓存、翻译、数据访问层、逆向 API 客户端
├── routes/       # 页面路由与 api/* BFF 路由
└── stores/       # Zustand stores
verify/           # 验收标准（AC）与验证套件
test/             # Vitest 三层测试
docs/             # 文档入口，见 docs/INDEX.md
```

## 贡献

见 [CONTRIBUTING.md](CONTRIBUTING.md)。提交前请确保 `bun run typecheck && bun run lint && bun run test` 全部通过。

## License

[MIT](LICENSE)
