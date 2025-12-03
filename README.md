# あのん Tweet - 在线推文查看与翻译工具

一个简洁美观的在线推文查看器，支持匿名查看、编辑翻译、数据持久化，并可导出推文卡片为图片。

🌐 **在线体验**: https://anon-tweet.chilfish.top/

## ✨ 项目介绍

随着搬运声优推特的账号越来越多，每次都要 F12 改文字确实有些麻烦。于是写了这个在线烤制推特的网站 —— 输入链接直接编辑翻译，然后导出图片！🤤

本次更新引入了数据库层，实现了推文内容和翻译结果的自动保存，并重构了全新的 UI 界面。

### 🚀 主要功能

- 📱 **匿名访问**：无需登录推特账号即可查看推文（依赖 API Key）。
- 💾 **数据持久化**：自动缓存推文内容及您的翻译历史，再次访问时秒开，进度不丢失。
- ✏️ **在线编辑**：直接在网页上编辑推文翻译内容，支持 Tag 高亮。
- 🖼️ **图片导出**：一键导出美观的推文卡片图片。
<!--- 📺 **B站发布 (实验性)**：支持将翻译好的图文内容尝试发布到 Bilibili 动态（需自行配置环境）。-->
- 🧵 **Thread 支持**：支持翻译整串回复，复制最新回复链接即可获取完整对话。
- 🎨 **自定义样式**：原文+分隔线+译文的布局，支持移动端适配。

### 🛠️ 技术栈

- **全栈框架**: React Router v7
- **前端库**: React 19 + TypeScript
- **运行时**: Bun.js
- **样式**: Tailwind CSS v4 + [coss ui](https://coss.com/ui/docs/)
- **数据库/ORM**: Drizzle ORM + [Neon (PostgreSQL)](https://neon.com/)
- **认证**: Better Auth (目前处于匿名模式，Auth 流暂时屏蔽)
- **HTTP/数据**: Axios
- **核心依赖**:
  - [react-tweet](https://github.com/vercel/react-tweet) (Fork & Modified) - UI 组件基础
  - [Rettiwt-API](https://github.com/Rishikant181/Rettiwt-API) (Fork & Modified) - 推特数据获取

### 🚀 快速开始

项目使用 [Bun.js](https://bun.sh/) 作为运行时和包管理器。

#### 1. 安装依赖

```bash
bun install
```

#### 2. 配置环境变量

复制 `example.env` 为 `.env` 并填入必要信息（详见下文“环境变量说明”）。

#### 3. 数据库设置

本项目使用 Drizzle ORM + PostgreSQL，先在 [Neon](https://neon.com/)创建项目，同步数据库 Schema：

```bash
# 推送 Schema 到数据库
bun run db:push
```

#### 4. 启动开发服务器

```bash
bun run dev
```

应用将在 `http://localhost:9080` 运行。

### ⚙️ 环境变量说明

为了项目正常运行，请务必配置以下环境变量：

#### 核心配置
- `ENVIRONMENT`: 设置为 `development` 或 `production`。
- `DB_URL`: PostgreSQL 数据库连接字符串（推荐使用 Neon）。

#### Twitter API 配置 (关键)

- `TWEET_KEY`: **必需**。这是 Guest Token 或 Auth Token。
  - **获取方式**: 建议安装 Chrome 插件 [X Auth Helper](https://chromewebstore.google.com/detail/x-auth-helper/igpkhkjmpdecacocghpgkghdcmcmpfhp)。
  - 登录 Twitter 后，通过插件复制 Token。
  - **注意**: 如果不配置此 Key，或者 Key 失效，极易触发 Twitter 的 429 (Too Many Requests) 限制。所谓的“匿名”是指最终用户无需登录，但服务器端抓取仍需凭证。

#### 认证配置 (Better Auth)

即使当前 UI 屏蔽了登录入口，底层仍依赖 Auth 配置来处理匿名会话：

- `BETTER_AUTH_SECRET`: 生成一个随机字符串（如 `openssl rand -hex 32`）。
- `BETTER_AUTH_URL`: 开发环境填 `http://localhost:9080` (或端口号)，生产环境填域名。

<!--#### 对象存储 (S3)

用于存储：

- `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME`, `S3_PUBLIC_URL`: 填写兼容 S3 协议的存储服务信息（如 AWS, Cloudflare R2, MinIO 等）。-->

### 🚀 部署

#### Vercel 部署 (推荐)

1. Fork 本项目到你的 GitHub。
2. 在 [Vercel](https://vercel.com) 导入项目。
3. 框架预设选择 "React Router"。
4. 填入上述环境变量。
5. 部署完成！

### 🙏 特别鸣谢

- [react-tweet](https://github.com/vercel/react-tweet) - 提供了优秀的推文组件基础（MIT协议）。
- [Rettiwt-API](https://github.com/Rishikant181/Rettiwt-API) - 强大的推特逆向 API 库（MIT协议）。
- [React Router](https://reactrouter.com/) - 现代化的 React 全栈框架。
- [Drizzle ORM](https://orm.drizzle.team/) - 优秀的 TypeScript ORM。

### 📄 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件

---

<div align="center">
  <strong>Built with ❤️ using Bun</strong>
  <br>
  <sub>Made by <a href="https://www.bilibili.com/opus/1115783244547096578">@Chilfish</a></sub>
</div>
