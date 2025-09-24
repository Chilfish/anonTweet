# あのん Tweet - 在线推文查看与翻译工具

一个简洁美观的在线推文查看器，支持匿名查看、编辑翻译并导出推文卡片为图片。

访问：https://anon-tweet.chilfish.top/

## ✨ 项目介绍

随着搬运声优推特的账号越来越多，每次都要 F12 改文字确实有些麻烦。于是写了这个在线烤制推特的网站 —— 输入链接直接编辑翻译，然后导出图片！🤤

## 🚀 主要功能

- 📱 **匿名访问**：类似浏览器无痕模式，无需登录即可查看推文
- ✏️ **在线编辑**：直接在网页上编辑推文翻译内容
- 🖼️ **图片导出**：一键导出美观的推文卡片图片
- 🧵 **Thread 支持**：支持翻译整串回复，复制最新回复链接即可获取完整对话
- 🎨 **自定义样式**：借鉴传声筒和园艺部的做法，原文+分隔线+译文的布局
- 🏷️ **tag高亮**：翻译分为文本和tag，保持语法高亮效果
- 📱 **移动端适配**：支持手机端使用（建议横屏保存以获得最佳宽度）

## 📦 开始使用

```bash
bun install

bun run dev
```

应用将在 `http://localhost:5173` 运行。

创建生产版本：

```bash
bun run build
```

## 🎨 样式说明

项目使用 [Tailwind CSS](https://tailwindcss.com/) 进行样式设计，配合 [shadcn/ui](https://ui.shadcn.com/) 组件库，提供现代化的用户界面。

分隔线支持输入 HTML 自定义样式，可以根据需要调整原文与译文之间的视觉分隔效果。

## 🙏 特别鸣谢

- [react-tweet](https://github.com/vercel/react-tweet) - 提供了优秀的推文组件基础，本项目基于其 MIT 许可证进行开发
- [React Router](https://reactrouter.com/) - 现代化的 React 全栈框架
- 传声筒和园艺部 - 样式设计灵感来源

## 📄 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件

---

Built with ❤️ using React Router & Bun
