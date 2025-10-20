# あのん Tweet - 在线推文查看与翻译工具

一个简洁美观的在线推文查看器，支持匿名查看、编辑翻译并导出推文卡片为图片。

🌐 **在线体验**: https://anon-tweet.chilfish.top/

## ✨ 项目介绍

随着搬运声优推特的账号越来越多，每次都要 F12 改文字确实有些麻烦。于是写了这个在线烤制推特的网站 —— 输入链接直接编辑翻译，然后导出图片！🤤

### 🚀 主要功能

- 📱 **匿名访问**：类似浏览器无痕模式，无需登录即可查看推文
- ✏️ **在线编辑**：直接在网页上编辑推文翻译内容
- 🖼️ **图片导出**：一键导出美观的推文卡片图片
- 🧵 **Thread 支持**：支持翻译整串回复，复制最新回复链接即可获取完整对话
- 🎨 **自定义样式**：借鉴传声筒和园艺部的做法，原文+分隔线+译文的布局
- 🏷️ **tag高亮**：翻译分为文本和tag，保持语法高亮效果
- 📱 **移动端适配**：支持手机端使用（建议横屏保存以获得最佳宽度）

### 🛠️ 技术栈

- **前端框架**: React 19 + TypeScript
- **路由**: React Router v7
- **运行时**: Bun.js
- **样式**: Tailwind CSS v4 + shadcn/ui
- **状态管理**: Zustand
- **HTTP 客户端**: Axios + SWR
- **图片生成**: modern-screenshot

### 🚀 快速开始

项目使用 [Bun.js](https://bun.sh/) 作为运行时和包管理器：

```bash
# 安装项目依赖
bun install

# 启动开发服务器
bun run dev

# 构建项目
bun run build
```

应用将在 `http://localhost:5173` 运行，支持热重载。

Tweet API key 环境变量：为了避免触发429请求频繁的报错，建议查看 [rettiwt-api 文档](./app//lib//rettiwt-api/README.md) 设置 key

### 🚀 部署

#### Vercel 部署 (推荐)

1. Fork 本项目到你的 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 选择 "React Router" 框架预设
4. 部署完成！

### 🙏 特别鸣谢

- [react-tweet](https://github.com/vercel/react-tweet) - 提供了优秀的推文组件基础，本项目基于其 MIT 许可证进行开发
- [React Router](https://reactrouter.com/) - 现代化的 React 全栈框架
- [Bun.js](https://bun.sh/) - 极速的 JavaScript 运行时
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [shadcn/ui](https://ui.shadcn.com/) - 精美的 React 组件库

### 📄 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件

---

<div align="center">
  <strong>Built with ❤️ using Bun</strong>
  <br>
  <sub>Made by <a href="https://www.bilibili.com/opus/1115783244547096578">@Chilfish</a></sub>
</div>
