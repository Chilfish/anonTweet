# Anon Tweet

**Anon Tweet** 是一个基于 **React Router v7** 的全栈应用程序，旨在提供推文的匿名查看、在线翻译编辑、持久化缓存以及卡片式图片导出功能。

## 🛠 Tech Stack

本项目采用现代 React 全栈架构，利用 Bun 作为高性能运行时。

*   **Core Framework**: [React Router v7](https://reactrouter.com/) (Fullstack, SSR/CSR)
*   **Language & Runtime**: TypeScript, [Bun](https://bun.sh/)
*   **UI System**:
    *   [Tailwind CSS v4](https://tailwindcss.com/) (Styling)
    *   [coss/ui](https://coss.com/ui/docs) (Component Primitives)
    *   [Lucide React](https://lucide.dev/) (Icons)
*   **Data & State**:
    *   [Drizzle ORM](https://orm.drizzle.team/) + PostgreSQL (Neon Serverless)
    *   Zustand (Client-side global state)
    *   React Router Loaders/Actions (Server-side data flow)
*   **Utilities**:
    *   `better-auth` (Authentication infrastructure)
    *   `modern-screenshot` (Dom to image generation)

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
# Database (Neon/PostgreSQL)
DB_URL="postgres://..."

# Auth (Better Auth)
# ⚠️ 用于 Session 加密，开发环境可生成随机字符串
BETTER_AUTH_SECRET="your_generated_secret"
BETTER_AUTH_URL="http://localhost:9080" # 或者是你的端口

# Twitter Integration (Critical)
# ⚠️ 必需。这是用于服务器端抓取推文的 Guest/Auth Token。
# 如果不配置，极易触发 Twitter 的 429 限制。
TWEET_KEY="your_twitter_auth_token"
```

### 3. Database Migration

本项目使用 Drizzle Kit 管理数据库 Schema。

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

## 📂 Project Structure

核心路由逻辑位于 `app/routes.ts`，采用了 React Router v7 的配置式路由定义。

| 路径模式 | 文件位置 | 说明 |
| :--- | :--- | :--- |
| `/tweets/:id` | `app/routes/tweet.tsx` | **核心业务页**。推文详情、翻译编辑器、图片导出功能。 |
| `/api/tweet/get/:id` | `app/routes/api/tweet/get.ts` | **Loader API**。获取推文数据（优先读库，无缓存则调用第三方 API）。 |
| `/api/tweet/set` | `app/routes/api/tweet/set.ts` | **Action API**。保存/更新推文的翻译内容到数据库。 |


> **Note**: `app/components` 目录下包含大量业务组件，如 `tweet/` (推文渲染) 和 `translation/` (翻译编辑器)。

## 🚧 Development Status

### Authentication
目前项目的认证模块处于 **开发/简化模式**：
*   虽然集成了 `better-auth`，但 **Auth UI 路由**（如 `/auth/sign-in`, `/auth/sign-up`）在 `routes.ts` 中已被注释禁用。
*   项目当前主要依赖匿名 Session 或简化的验证逻辑来处理用户状态。
*   相关的管理后台路由（`/admin/*`）和设置路由（`/settings/*`）也暂时处于禁用状态。

### External Libraries
项目包含部分 fork 并修改的第三方库，位于 `app/lib/` 目录下：
*   **`react-tweet`**: 基于 Vercel 的同名库修改，以适配自定义的 UI 渲染需求和样式（Tailwind v4）。
*   **`rettiwt-api`**: 基于 Rettiwt-API 修改，用于在服务端逆向获取 Twitter 数据流。
