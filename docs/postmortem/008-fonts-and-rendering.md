# Postmortem 008: 字体加载依赖系统与 headless 环境，且缺少验证

- **日期**: 2026-05-31（回溯整理）
- **严重级别**: SEV-2
- **分类**: 依赖
- **状态**: Mitigated
- **根因归类**: 工具反馈

## 摘要

中文与 emoji 渲染用了 3 次修复，涉及字体栈、字符覆盖和 headless 字体可用性。依赖链脆弱：浏览器（用户系统字体）、headless 浏览器（Puppeteer，字体有限）、SSR 三种环境的字体回退各不相同，却没有自动验证 CJK 与 emoji 是否都渲染正常。

## 影响

- 用户可见：中文显示为方框、截图里 emoji 缺失。主要在截图路径，浏览器 UI 只在缺少中文字体的系统上受影响。
- 跨度：2025-12 至 2026-02。
- 隐藏风险：`UnifontEX` 走 CDN，CDN 不可用会让 emoji 再次变方框。

## 时间线

2026-05-31 回溯整理。

| 日期 | commit | 事件 |
| ---- | ------ | ---- |
| 2025-12-20 | `0af302e` | 补 `Noto Sans SC`，去掉多余的 Puppeteer 字体下载 |
| 2026-01-02 | `138868b` | 修 headless 浏览器的 emoji 字体缺失 |
| 2026-02-02 | `8047bd6` | 字体渲染与加载策略调整（`requestAnimationFrame`、`unicode-range`、CDN） |

## 根因分析

1. 初始字体栈没有中文字体，完全依赖系统回退，各平台结果不一。
2. 项目起点是英文优先的 `react-tweet` 主题，中文支持后加，字体栈没同步更新。
3. headless Chromium 只有极少的系统字体，emoji 字体必须显式提供。
4. 截图用 `requestAnimationFrame` 等一帧，挡不住 web font 的异步加载；正确做法是 `document.fonts.ready`。

一句话归纳：字体栈与加载时序没有覆盖三种运行环境的差异，截图抓取也没等 web font 加载完成。

## 触发条件

截图环境缺少系统 CJK 或 emoji 字体；慢网络下 web font 没在等待窗口内到达。

## 检测

人工看截图发现方框。当时的盲区是没有检测替换字符（U+FFFD）的视觉测试。

## 处置

字体栈补 `Noto Sans SC` 与 emoji 字体；截图等待从 `requestAnimationFrame` 改为 `document.fonts.ready`（落在 `app/lib/utils.ts`）。

## 做得对的地方

三次修复顺序合理：先补中文字体，再补 headless emoji，最后修等待时序。对 headless 与浏览器字体差异有明确判断。

## 行动项

### 缓解

- [x] 字体栈补 `Noto Sans SC` 与 emoji 字体（维护者）
- [x] 截图等待改为 `document.fonts.ready`（维护者）

### 预防

- [ ] 截图 CI：抓含中文与 emoji 的推文，检测无替换字符（维护者；判据：CI 能对方框截图报错）
- [ ] 给 `UnifontEX` 加 `@font-face` 本地回退，去掉 CDN 单点（维护者；判据：本地优先，CDN 断开仍可渲染）
- [ ] 写 `docs/fonts.md`：字体栈覆盖哪些 Unicode 区块、如何验证新语种（维护者）

## 教训

字体是环境相关的，headless 和浏览器不是一回事。截图等字体用 `document.fonts.ready`，不要用固定 delay 或 `requestAnimationFrame`。

## Changed Files

```
app/fonts.css
app/root.tsx
app/hooks/use-screenshot-action.ts
app/lib/browser.ts
app/lib/react-tweet/twitter-theme/theme.css
app/lib/react-tweet/twitter-theme/tweet-body.module.css
```

## 关联报告

- #005 媒体管线：截图抓取代码重叠
- #003 UI 样式与布局：截图布局问题重叠
