# Anon Tweet

**Anon Tweet** 是一个基于 **React Router v7** 构建的现代化全栈应用程序，旨在提供极致的推文与 Instagram 帖子匿名浏览体验。本项目集成了 **Google Gemini / DeepSeek AI** 双提供商翻译功能，支持推文卡片与 IG 帖子导出（截图 + Markdown）。

## 🛠 Tech Stack

本项目采用现代 React 全栈架构，利用 Bun 作为高性能运行时。

- **Core Framework**: [React Router v7](https://reactrouter.com/) (Fullstack, SSR/CSR)
- **Language & Runtime**: TypeScript, [Bun](https://bun.sh/)
- **AI & Automation**:
  - [Google Gemini API](https://ai.google.dev/) + [DeepSeek API](https://platform.deepseek.com/) (双提供商翻译引擎)
  - [Vercel AI SDK](https://sdk.vercel.ai/docs) (Stream & State Management)
- **Data Sources**:
  - Twitter/X Private API (via bundled `rettiwt-api`)
  - Instagram (via `@chilfish/gallery-dl-instagram` SDK)
- **UI System**:
  - [Tailwind CSS v4](https://tailwindcss.com/) (Styling)
  - [shadcn/ui](https://ui.shadcn.com/) (Component Primitives)
  - [Lucide React](https://lucide.dev/) (Icons)
- **Data & State**:
  - [Drizzle ORM](https://orm.drizzle.team/) + PostgreSQL / Neon Serverless (Optional, for caching)
  - [SWR](https://swr.vercel.app/) (Data Fetching)
  - [Zustand](https://zustand-demo.pmnd.rs/) (Client-side global state)
- **Export & Media**:
  - [modern-screenshot](https://www.npmjs.com/package/modern-screenshot) (Screenshot export)
  - [xlsx](https://www.npmjs.com/package/xlsx) (Dictionary import/export)
  - [html-to-image](https://www.npmjs.com/package/html-to-image) (Alternative screenshot backend)

## 🚀 Getting Started

按照以下步骤在本地启动开发环境。

### 1. Installation

确保本地已安装 [Bun](https://bun.sh/)。

```bash
# Clone repository
git clone https://github.com/Chilfish/anonTweet.git
cd anonTweet

# Install dependencies
bun install
```

### 2. Environment Setup

在项目根目录创建 `.env` 文件，并参照以下配置设置关键变量。

> **注意**: AI 翻译功能依赖于 Google Gemini 或 DeepSeek API，截图功能依赖于正确的 HOSTNAME 配置。

```env
ENVIRONMENT="development" # development | production
HOSTNAME="http://localhost:9080" # ⚠️ 截图服务回调地址，生产环境请填写实际域名

# ⚠️ 必需。用于服务端获取推文数据流。
# 若不配置，将受到严格的 Rate Limit 限制。
# 支持配置多个 Key（用英文逗号分隔）以实现轮询 + 故障转移。
TWEET_KEYS="your_twitter_auth_token_1,your_twitter_auth_token_2"

# 🆕 Instagram 解析 — 必需。从浏览器 DevTools 复制 cookies JSON
INS_COOKIES='{"sessionid":"...","csrftoken":"..."}'

# 启用 AI 翻译功能
ENABLE_AI_TRANSLATION="true"
# Google Gemini API Key
GEMINI_API_KEY="AIzaSy..."
# 模型选择（默认 gemini-3-flash-preview）
GEMINI_MODEL="models/gemini-3-flash-preview"

# DeepSeek（可选，双提供商切换）
# DEEPSEEK_API_KEY="sk-..."
# DEEPSEEK_MODEL="deepseek-v4-flash"

# 启用本地文件缓存（Node/Bun 环境）
ENABLE_LOCAL_CACHE="true"

# 如果不配置 DB_URL，系统将直接调用 API 而不使用持久化缓存。
# DB_URL="postgres://..."
ENABLE_DB_CACHE="false"

# 部署到 Vercel 时必须设置为 true，本地开发设为 false 或留空
VERCEL="false"
```

#### 🔑 关于 TWEET_KEYS 的获取

本项目使用 Rettiwt-API 进行数据抓取。为获取完整访问权限并降低风控概率，需注入 Twitter 用户凭证。支持配置多个账号凭证以应对高频请求时的 Rate Limit 问题。

**操作步骤：**

1.  安装浏览器扩展：
    - **Chrome/Chromium**: [X Auth Helper](https://chromewebstore.google.com/detail/x-auth-helper/igpkhkjmpdecacocghpgkghdcmcmpfhp)
    - **Firefox**: [Rettiwt Auth Helper](https://addons.mozilla.org/en-US/firefox/addon/rettiwt-auth-helper)
2.  建议使用浏览器的**无痕/隐私模式**登录 Twitter/X 账号。
3.  登录后打开扩展，点击 `Get Key` / `Get API Key` 并复制生成的字符串。
4.  将该字符串填入 `.env` 的 `TWEET_KEYS` 字段（多个 Key 用逗号分隔）。

> **⚠️ Security Note**: 该 Key 本质上是账号 Cookies 的 Base64 编码，拥有完全账户权限，安全等级等同于你的账号+密码。请勿泄露。
> **⚠️ Session Keep-alive**: 获取 Key 后，**请勿手动点击登出 (Log out)**，否则服务端 Session 将失效。直接关闭浏览器窗口即可。

### 3. Database Migration (Optional)

如果你启用了数据库（配置了 `DB_URL` 且 `ENABLE_DB_CACHE=true`），则需要初始化数据库 Schema。

```bash
# 将 Schema 推送到数据库 (Prototyping)
bun run db:push

# 或者生成迁移文件并执行 (Production)
# bun run db:generate
# bun run db:migrate
```

### 4. Start Dev Server

启动开发服务器，默认运行在 `http://localhost:9080`。

```bash
bun run dev
```

## 📦 Deployment

### Vercel 部署

本项目针对 Vercel Serverless 环境进行了适配。

1.  在 Vercel 项目设置中，务必添加环境变量 `VERCEL="true"` 以激活 React Router 的适配器逻辑。
2.  配置 `GEMINI_API_KEY` 以启用线上的翻译服务。
3.  确保 `HOSTNAME` 设置为生产环境域名，否则推文截图功能将无法正确回调渲染。

## 🚧 Features

| 功能              | Twitter                                     | Instagram                   |
| ----------------- | ------------------------------------------- | --------------------------- |
| 匿名浏览          | ✅ 推文 + 评论 + 引用                       | ✅ Post / Reel / Story      |
| AI 翻译           | ✅ Google Gemini + DeepSeek，实体占位符保护 | ✅ 纯文本翻译，中日检测     |
| 手动翻译编辑器    | ✅ 实体级编辑（三态：手动/AI/原文）         | ✅ `IGTranslateDialog` 弹窗 |
| 双语对照          | ✅ 三模式（双语/原文/仅译文）               | ✅ 同上                     |
| 截图导出          | ✅ PNG/JPEG                                 | ✅ 同上                     |
| Markdown/文本复制 | ✅                                          | ✅                          |
| 媒体下载          | ✅                                          | ✅ 图片 + 视频直链          |
| DB 缓存           | ✅ `tweet` + `tweet_entities` 表            | ✅ `ig_post` 表             |
| 纯文本路由        | ✅ `/plain/:id`                             | ✅ `/plain-ins/:id`         |

### External Libraries

项目包含部分定制的第三方库核心，位于 `app/lib/` 目录下：

- **`react-tweet`**: 经深度修改以适配 Tailwind v4，增加了 AI 翻译实体渲染支持。
- **`rettiwt-api`**: 针对 Twitter GraphQL 接口逆向适配，支持多 Key 轮询（429/401/403 自动故障转移）。

### Storybook

```bash
bun run storybook    # 启动在 http://localhost:6006
```

14 个 IG 组件用例 + Twitter 推文渲染用例。
