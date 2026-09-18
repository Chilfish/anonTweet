# Postmortem 003: UI 样式与布局靠单行 CSS 反复打补丁

- **日期**: 2026-05-31（回溯整理）
- **严重级别**: SEV-3
- **分类**: 缺陷
- **状态**: Active
- **根因归类**: 流程缺失

## 摘要

UI 相关修复累计约 20 次，是数量最大的一簇，单次严重度最低。绝大多数是单属性 CSS 改动（z-index、overflow、min-width）或一行组件调整。根因是没有 design token、没有布局原语、也没有视觉回归，每个视觉 bug 都只能靠人工浏览发现再逐处修补。

## 影响

- 用户可见：视觉瑕疵。单次不影响功能，但累积拉低整体观感。
- 返工：约 20 次修复，每次都要求在桌面、移动、plain、截图、线程等模式下人工确认。
- 隐藏风险：布局改动要在 5 种以上渲染模式交叉验证，是人工难覆盖的组合爆炸。

## 时间线

2026-05-31 回溯整理。节点取自各 UI 修复 commit。

| 日期 | commit | 事件 |
| ---- | ------ | ---- |
| 2025-09-24 | `dc577fb` | Radix 组件改为命名导入 |
| 2025-12-03 | `1e5ca7a` | 发布到 B 站的按钮移到 footer |
| 2025-12-04 | `ccdf83c` | 返回按钮改为 `<Link>` |
| 2025-12-20 | `322e4e8` | `Layout` 组件未接收 `children` |
| 2025-12-20 | `043273f` | plain 模式缺最小宽度，窄屏塌陷 |
| 2026-01-15 | `56ee649` | `SettingsRow` 误用于移动端布局 |
| 2026-01-21 | `3dc1be2` | 连接线算法与截图测量重构（89 行改动） |
| 2026-01-21 | `513a847` | 推文列表渲染性能与连线显示 |
| 2026-02-17 | `6af156f` | 截图模式下视频仅显示封面 |
| 2026-02-22 | `3f9b447` | 单图且竖屏时限制宽度 |
| 2026-03-15 | `3889e3c` | 长用户名导致 header 溢出 |
| 2026-04-06 | `352d467` | avatar 的 z-index 低于线程线 |
| 2026-05-31 | `fa92657` | Storybook TC 类型修复 |

## 根因分析

1. CSS 逐组件手写，没有共享 token，也没有布局原语。
2. 起点是 `react-tweet` 的 Twitter 主题独立样式表，扩展直接加进 `.module.css`，公共值（间距、层级、断点）从未提炼。
3. 单行改动「感觉不值得重构」，20 次的累积成本没有记录，也就没有触发整理。
4. 没有视觉回归，每个 bug 都靠人工浏览发现。

一句话归纳：缺设计 token 与视觉回归，每次布局改动都要在 5 种以上渲染模式间人工比对。

## 触发条件

新增渲染模式（截图、plain、移动端、线程线）与既有 CSS 发生交互时，层级与溢出问题集中出现。

## 检测

全部靠人工浏览发现。Storybook 当时已配置，但未接视觉对比。

## 处置

逐个修补，每个改动都小且可回滚。

## 做得对的地方

单次改动小、风险低，没有一次级联回归。Storybook 已在位，可直接作为后续视觉基线的落点。

## 行动项

### 预防

- [ ] 定义 z-index 分层 CSS 变量（`--z-header`、`--z-avatar`、`--z-thread-line`、`--z-overlay`、`--z-popover`），并用 stylelint 禁止裸整数（维护者；判据：所有 z-index 走变量）
- [ ] 提炼 spacing、breakpoint、typography 设计 token（维护者；判据：组件 CSS 不再出现魔法数字）
- [ ] Storybook 接视觉回归（Chromatic 或 Percy）（维护者；判据：CSS 改动在 PR 上产生视觉 diff）
- [ ] 为各模式补 stories：default / plain / screenshot / mobile(375px) / 三层以上线程（维护者）
- [ ] 为布局审查加清单，进 PR 模板（维护者）

## 教训

视觉问题缺回归门禁就会变成长期滴漏。单行修复的成本要按簇看，不能按次看。

## Changed Files

```
app/components/tweet/Tweet.tsx
app/components/tweet/CommentBranch.tsx
app/components/tweet/PlainTweet.tsx
app/components/tweet/SelectableTweetWrapper.tsx
app/components/layout/Layout.tsx
app/components/layout/PageHeader.tsx
app/components/settings/SettingsRow.tsx
app/lib/react-tweet/twitter-theme/tweet-header.tsx
app/lib/react-tweet/twitter-theme/tweet-body.module.css
app/lib/react-tweet/twitter-theme/theme.css
app/app.css
app/hooks/use-element-size.ts
```

## 关联报告

- #008 字体与渲染：截图布局与字体问题重叠
- #005 媒体管线：媒体展示布局重叠
