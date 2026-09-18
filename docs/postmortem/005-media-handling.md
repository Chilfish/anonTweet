# Postmortem 005: 媒体管线没有统一入口，代理、视频、截图各写一套

- **日期**: 2026-05-31（回溯整理）
- **严重级别**: SEV-2
- **分类**: 架构
- **状态**: Mitigated
- **根因归类**: 设计建模

## 摘要

媒体处理——代理 URL、视频下载、截图、图片展示——产生 8 次修复，横跨 6 个文件。因为没有统一管线，每个功能各写各的 URL 转换与抓取逻辑，于是同一类坑反复出现：双重代理、漏代理、headless 字体失败、固定等待。后续 `createMediaUrl()` 与 `document.fonts.ready` 落地，问题才收敛。

## 影响

- 用户可见：视频播放或下载失败、媒体缺失。
- 返工：每次媒体修复要动 2~4 个文件，因为代理逻辑是重复的。
- 隐藏风险：漏代理在本地看着正常，线上被 CORS 拦下才暴露。

## 时间线

2026-05-31 回溯整理。

| 日期 | commit | 事件 |
| ---- | ------ | ---- |
| 2025-09-23 | `58bdb57` | 截图支持视频封面模式（90 行改动，状态穿透 6 个文件） |
| 2025-12-10 | `6d21f45` | 移除代理媒体 URL |
| 2025-12-20 | `09acdc5` | 调整截图浏览器启动参数 |
| 2026-01-02 | `d3bdbb3` | 媒体代理扩展到推文视频 |
| 2026-01-23 | `9f0cbd6` | 媒体组件显示与 Twitter 渲染逻辑对齐 |
| 2026-02-02 | `8047bd6` | 截图字体渲染与加载策略 |
| 2026-03-23 | `911ece5` | 视频下载改走代理 |

## 根因分析

1. `useProxyMedia()` 是 React hook，非 React 的工具函数用不了。
2. 它读 Zustand store，于是代理配置被锁在 React 状态里。
3. 代理 URL 与开关属于用户设置，天然偏 React，但没有并行的非 React 入口。
4. 结果 4 条以上代码路径各自实现代理逻辑，语义漂移后互相不一致。

一句话归纳：代理配置困在 React 状态里，非 React 媒体工具拿不到，于是要么漏代理，要么重复实现。

## 触发条件

新增媒体消费方（视频播放、视频下载、截图）时没有复用既有入口。

## 检测

人工测试发现播放或下载失败。当时的盲区是没有测试断言所有媒体 URL 都带代理前缀。

## 处置

抽出 `createMediaUrl()` 纯函数，React 与非 React 路径共用；截图等待改用 `document.fonts.ready`。补了 `test/unit/media-url.spec.ts` 与 `AC-media`。

## 做得对的地方

`useProxyMedia` 的 `force` 参数把「用户开关」与「程序需要」分开，设计干净，本应是默认形态。

## 行动项

### 缓解

- [x] 抽出 `createMediaUrl()` 纯函数，React 与非 React 共用（维护者；见 `test/unit/media-url.spec.ts`）
- [x] 截图等待改为 `document.fonts.ready`（维护者）

### 预防

- [ ] 约束直接拼接 Twitter CDN 原始 URL 的写法（维护者；判据：组件层不再出现裸 `pbs.twimg.com` / `video.twimg.com`）
- [ ] 补测试：`getMp4Video()` 返回代理前缀、下载走代理、双重代理幂等（维护者）

## 教训

配置放在哪一层，决定了谁能用。把配置关进 React 状态，非组件代码就只能复制一份逻辑，复制就是漂移。

## Changed Files

```
app/lib/react-tweet/utils/index.ts
app/lib/stores/appConfig.ts
app/components/translation/DownloadMedia.tsx
app/components/saveAsImage.tsx
app/components/tweet/Tweet.tsx
app/lib/react-tweet/twitter-theme/tweet-media-video.tsx
app/lib/react-tweet/twitter-theme/tweet-media.tsx
app/hooks/use-screenshot-action.ts
app/lib/browser.ts
```

## 关联报告

- #001 推文解析：媒体实体解析共用同一段代码
- #008 字体与渲染：截图抓取代码重叠
