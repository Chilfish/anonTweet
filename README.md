# Anon Tweet

**Anon Tweet** 是一个基于 **React Router v7** 的全栈应用程序，旨在提供推文的匿名查看、在线翻译编辑、持久化缓存以及卡片式图片导出功能。

## 🛠 Tech Stack

本项目采用现代 React 全栈架构，利用 Bun 作为高性能运行时。

- **Core Framework**: [React Router v7](https://reactrouter.com/) (Fullstack, SSR/CSR)
- **Language & Runtime**: TypeScript, [Bun](https://bun.sh/)
- **UI System**:
  - [Tailwind CSS v4](https://tailwindcss.com/) (Styling)
  - [coss/ui](https://coss.com/ui/docs) (Component Primitives)
  - [Lucide React](https://lucide.dev/) (Icons)
- **Data & State**:
  - [Drizzle ORM](https://orm.drizzle.team/) + PostgreSQL (Optional, for caching)
  - Zustand (Client-side global state)
  - React Router Loaders/Actions (Server-side data flow)

## 🚀 Getting Started

按照以下步骤在本地启动开发环境。

### 1. Installation

确保本地已安装 [Bun](https://bun.sh/)。

```bash
# Clone repository
git clone <repository-url>
cd anonTweet

# Install dependencies
bun install
```

### 2. Environment Setup

在项目根目录创建 `.env` 文件，并参照 `example.env` 配置以下关键变量：

```env
# Database (Optional)
# ⚠️ 数据库不再是必须的。如果不配置 DB_URL，系统将直接调用 API 而不使用缓存。
# DB_URL="postgres://..."
ENABLE_DB_CACHE="false" # 默认为 false，如果有数据库请设为 true

# Deployment Environment
# ⚠️ 部署到 Vercel 时必须设置为 true，本地开发设为 false 或留空
VERCEL="false"

# Twitter Integration (Critical)
# ⚠️ 必需。这是用于服务器端抓取推文的 Guest/Auth Token。
# 如果不配置，极易触发 Twitter 的 429 限制。
TWEET_KEY="your_twitter_auth_token"
```

### 3. Database Migration (Optional)

如果你启用了数据库（配置了 `DB_URL` 且 `ENABLE_DB_CACHE=true`），则需要初始化数据库 Schema。如果不使用数据库，请跳过此步骤。

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

本项目针对 Vercel 进行了适配。在 Vercel 仪表盘配置项目时，请务必添加以下环境变量以启用正确的构建预设：

- **`VERCEL`**: `true`

如果没有设置此变量，React Router 适配器可能无法正确加载，导致 Serverless Function 运行失败。

项目结构详见 [项目架构文档](./docs/project_architecture.md)

## 🚧 Development Status

### External Libraries

项目包含部分 fork 并修改的第三方库，位于 `app/lib/` 目录下：

- **`react-tweet`**: 基于 Vercel 的同名库修改，以适配自定义的 UI 渲染需求和样式（Tailwind v4）。
- **`rettiwt-api`**: 基于 Rettiwt-API 修改，用于在服务端逆向获取 Twitter 数据流。
