# 尸检报告索引（Postmortems）

> **开写任何代码前，先读本页。** 本仓库历史踩坑全部沉淀于此，对照「高频雷区」自查后再动工，避免重复返工。
>
> 原则：**blameless** —— 不追究"谁写错了"，只追"什么系统条件允许它发生"，然后修系统和流程。
>
> 107 个 fix commit → 8 个根因集群 → 8 份报告（生成日期：2026-05-31）。新报告按 [TEMPLATE.md](TEMPLATE.md) 沉淀。

## 索引表

| #                                     | 主题             | 严重级 | 分类         | 状态         | 一句话根因                                            |
| ------------------------------------- | ---------------- | ------ | ------------ | ------------ | ----------------------------------------------------- |
| [001](001-twitter-content-parsing.md) | Twitter 推文解析 | SEV-2  | Architecture | 🔴 Active    | `parseTweet.ts` 无测试、无内部分层，每次改动风险全局  |
| [002](002-translation-system.md)      | 翻译系统         | SEV-2  | Architecture | 🔴 Active    | 翻译逻辑全部耦合在 React 组件内，store 迁移静默丢数据 |
| [003](003-ui-styling-layout.md)       | UI 样式/布局     | SEV-3  | Bug          | 🟡 Active    | 20 次单行 CSS fix，无 design token，无视觉回归测试    |
| [004](004-build-configuration.md)     | 构建配置         | SEV-2  | Change       | 🟢 Mitigated | 客户端/服务端边界不清，`lib/` 无 import 约束          |
| [005](005-media-handling.md)          | 媒体管线         | SEV-2  | Architecture | 🔴 Active    | 代理/视频/截图四套重复 URL 转换逻辑                   |
| [006](006-state-management.md)        | 状态管理         | SEV-2  | Bug          | 🟢 Mitigated | zustand 整 store 订阅 + 无类型迁移                    |
| [007](007-instagram-integration.md)   | Instagram 集成   | SEV-3  | Change       | 🔴 Active    | 新功能无验收清单、无测试 fixture                      |
| [008](008-fonts-and-rendering.md)     | 字体/渲染        | SEV-2  | Bug          | 🟢 Mitigated | Web font 加载与 headless 截图竞争                     |

## 高危文件（写码前自查）

这些文件是历史 fix 热点，改动前务必先读对应报告 + 补测试：

| 文件                                               | 出现于           | fix 次数 |
| -------------------------------------------------- | ---------------- | -------- |
| `app/lib/react-tweet/api-v2/parseTweet.ts`         | #001, #005       | 10       |
| `app/components/tweet/Tweet.tsx`                   | #001, #003, #005 | 13       |
| `app/components/translation/TranslationEditor.tsx` | #002, #003       | 10       |
| `app/lib/stores/`                                  | #002, #006       | 6        |
| `app/components/tweet/TweetTextBody.tsx`           | #001             | 5        |

## 高频雷区（写码前自查）

### 1. 解析器零测试（#001，最高危）

`parseTweet.ts` 10 次 fix 全因无测试、无分层。对策：解析器改动必须有对应 Vitest 测试（参考 `test/entitytParser.spec.ts`），新解析器先写测试再实现。

### 2. 翻译逻辑耦合 React（#002）

翻译 UI / 字典 / AI 提示词 / entity-skip 全耦合在组件边界。对策：纯逻辑（resolver / materialize / placeholder）必须下沉 `app/lib/translation/` 纯函数并单测；组件只做渲染与事件。

### 3. 无 design token 的单行 CSS fix（#003）

20 次 z-index / overflow / min-width 单行修复。对策：用 Tailwind 语义 token（`bg-background` / `bg-card` / `rounded-xl`），组件样式走 `docs/ui-design/OVERVIEW.md` 规范。

### 4. store 订阅与迁移脆弱（#006）

zustand 整 store 订阅导致多余重渲染；手动迁移 API 静默丢数据。对策：**永远用 selector**（`useStore(s => s.x)`）+ `useShallow`；`persist` store 必须有类型化迁移 + `_hasHydrated` 防 SSR mismatch。

### 5. 媒体 URL 四套重复逻辑（#005）

代理 / 视频 / 截图各自实现 URL 转换 → 双代理、漏代理、漏下载。对策：统一 `createMediaUrl(originalUrl, config)` 纯函数，所有 React / 非 React 路径走同一函数；截图等待用 `document.fonts.ready` 而非固定 delay。

### 6. 新功能无验收清单（#007）

IG 集成 7 次快节奏补丁（缺路由/缺行为/缺 polish）。对策：**验证先行**——先写 AC（`verify/acceptance-criteria/`）再实现，完成后补 verifier + fixture。

## Pre-Release 检查（每次 Release 前）

**步骤**：

1. 获取本次改动的 commit 列表和文件列表
2. 读取 `docs/postmortem/*.md` 的 Changed Files 和 Root Cause
3. 逐份交叉比对：文件重叠？模式复现？预防措施落实了没？

**输出**：✅ PASS / ⚠️ WARN / ❌ FAIL。FAIL 必须在 Release 前修。
自动化执行：`bun run postmortem-check <base-ref> <head-ref>`（默认 `main..HEAD`；CI 冒烟由 `AC-PM-007` 覆盖）。

## 报告全览

### 按严重级

- **SEV-2（6 份）**：001 / 002 / 004 🟢 / 005 / 006 🟢 / 008 🟢
- **SEV-3（2 份）**：003 / 007

### 按状态

- 🔴 **Active（仍可能复发）**：001 / 002 / 003 / 005 / 007
- 🟢 **Mitigated（已预防）**：004 / 006 / 008
