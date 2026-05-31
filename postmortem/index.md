# 尸检报告索引

> 107 个 fix commit → 8 个根因集群 → 8 份报告  
> 生成日期：2026-05-31

## 报告概览

| # | 报告 | 严重级 | 分类 | 状态 | 一句话根因 |
|---|------|--------|------|------|-----------|
| [001](001-twitter-content-parsing.md) | Twitter 推文解析 | SEV-2 | Architecture | 🔴 Active | `parseTweet.ts` 无测试、无内部分层，每次改动风险全局 |
| [002](002-translation-system.md) | 翻译系统 | SEV-2 | Architecture | 🔴 Active | 翻译逻辑全部耦合在 React 组件内，store 迁移静默丢数据 |
| [003](003-ui-styling-layout.md) | UI 样式/布局 | SEV-3 | Bug | 🟡 Active | 20 次单行 CSS fix，无 design token，无视觉回归测试 |
| [004](004-build-configuration.md) | 构建配置 | SEV-2 | Change | 🟢 Mitigated | 客户端/服务端边界不清，`lib/` 无 import 约束 |
| [005](005-media-handling.md) | 媒体管线 | SEV-2 | Architecture | 🔴 Active | 代理/视频/截图四套重复 URL 转换逻辑 |
| [006](006-state-management.md) | 状态管理 | SEV-2 | Bug | 🟢 Mitigated | zustand 整 store 订阅 + 无类型迁移 |
| [007](007-instagram-integration.md) | Instagram 集成 | SEV-3 | Change | 🔴 Active | 新功能无验收清单、无测试 fixture |
| [008](008-fonts-and-rendering.md) | 字体/渲染 | SEV-2 | Bug | 🟢 Mitigated | Web font 加载与 headless 截图竞争 |

## 按严重级

### SEV-2（6 份）
- [001](001-twitter-content-parsing.md) — 推文解析
- [002](002-translation-system.md) — 翻译系统
- [004](004-build-configuration.md) — 构建配置 🟢
- [005](005-media-handling.md) — 媒体管线
- [006](006-state-management.md) — 状态管理 🟢
- [008](008-fonts-and-rendering.md) — 字体渲染 🟢

### SEV-3（2 份）
- [003](003-ui-styling-layout.md) — UI 样式
- [007](007-instagram-integration.md) — IG 集成

## 按分类

| 分类 | 报告 |
|------|------|
| Architecture | [001](001-twitter-content-parsing.md), [002](002-translation-system.md), [005](005-media-handling.md) |
| Bug | [003](003-ui-styling-layout.md), [006](006-state-management.md), [008](008-fonts-and-rendering.md) |
| Change | [004](004-build-configuration.md), [007](007-instagram-integration.md) |

## 按状态

| 状态 | 报告 |
|------|------|
| 🔴 Active（仍可能复发） | [001](001-twitter-content-parsing.md), [002](002-translation-system.md), [003](003-ui-styling-layout.md), [005](005-media-handling.md), [007](007-instagram-integration.md) |
| 🟢 Mitigated（已预防） | [004](004-build-configuration.md), [006](006-state-management.md), [008](008-fonts-and-rendering.md) |

## 高危文件（跨报告）

| 文件 | 出现于 | fix 次数 |
|------|--------|---------|
| `app/lib/react-tweet/api-v2/parseTweet.ts` | #001, #005 | 10 |
| `app/components/tweet/Tweet.tsx` | #001, #003, #005 | 13 |
| `app/components/translation/TranslationEditor.tsx` | #002, #003 | 10 |
| `app/lib/stores/` | #002, #006 | 6 |
| `app/components/tweet/TweetTextBody.tsx` | #001 | 5 |

## Phase 2 检查记录

- [2026-05-31 (IG integration)](../.alma/postmortem-check-2026-05-31.md) — 5 WARN / 3 PASS，无 FAIL
