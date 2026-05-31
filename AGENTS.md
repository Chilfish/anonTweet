# AGENT GUIDELINES - Anon Tweet

This file provides the technical context, build instructions, and coding standards for AI agents working on the **Anon Tweet** project.

## 1. Project Overview

**Anon Tweet** is a full-stack application built with **React Router v7** and **Bun**. It specializes in anonymous tweet browsing, AI-powered translation (Google Gemini / DeepSeek), and tweet card exporting.

## 2. Setup & Development

### Build Commands

- **Install Dependencies**: `bun install`
- **Development Server**: `bun run dev` (Runs on `http://localhost:9080`)
- **Build Production**: `bun run build`
- **Type Checking**: `bun run typecheck`
- **Linting**: `bun run lint` (Uses `@antfu/eslint-config` with autofix)

### Environment Variables

Key variables required in `.env`:

- `TWEET_KEYS`: Comma-separated Twitter auth tokens.
- `GEMINI_API_KEY`: API Key for Google Gemini.
- `DEEPSEEK_API_KEY`: API Key for DeepSeek (optional, for dual-provider translation).
- `HOSTNAME`: Callback address for screenshot services.
- `ENABLE_DB_CACHE`: Set to `true` if PostgreSQL is configured.

## 3. Documentation Index (Mandatory Reference)

The `docs/` directory contains the foundational technical context and constraints. **Always** refer to these documents before implementation.

- **[Project Architecture](docs/project_architecture.md)**: System design (BFF, React Router v7, Bun), data flow, and `RettiwtPool` scheduling.
- **[Translation Subsystem](docs/feature_translation.md)**: Core design of the translation engine, placeholder mechanisms, and entity stream logic.
- **[Zustand Best Practices](docs/SKILL/zustand-state-management.md)**: Strict rules for state management and re-render prevention.
- **[DeepSeek Provider](docs/deepseek-ai-sdk.md)**: Configuration and usage of the DeepSeek AI provider.
- **[Deployment & Ops](docs/deployment.md)**: Production environments, Vercel optimization, and infrastructure checklists.
- **[UI/UX Design](docs/ui-design/OVERVIEW.md)**: Design principles and component standards.
- **[Roadmap & Constraints](docs/TODO.md)**: Record of completed tasks and critical future refactoring boundaries.

## 4. Core Architecture

- **Framework**: React Router v7 (SSR + CSR Hybrid).
- **Runtime**: Bun.
- **BFF Pattern**: API routes (`app/routes/api/*`) aggregate data from Twitter, DB, and AI (Google Gemini / DeepSeek).
- **Client State**: **Zustand** (persist v6) for global UI/Configuration state.
- **Server State**: **SWR** for data fetching and caching.
- **Persistence**: PostgreSQL + Drizzle ORM (Optional caching layer).
- **AI Providers**: Google Gemini (`@ai-sdk/google`) and DeepSeek (`@ai-sdk/deepseek`), configurable via `aiProvider` setting.

## 5. Coding Standards & Conventions

### Zustand Best Practices (CRITICAL)

- **Store Definition**: Always use `create<T>()()` (double parentheses) for middleware compatibility.
- **Selectors**: **NEVER** destructure directly from the hook without a selector.
  - ✅ `const theme = useStore(state => state.theme)`
  - ❌ `const { theme } = useStore()`
- **Shallow Selection**: Use `useShallow` from `zustand/react/shallow` when selecting multiple items.
- **Persistence**: Stores with `persist` middleware must use the `_hasHydrated` pattern to prevent SSR mismatches.

- **Translation Entity System**:
  - **New Architecture (v2.1)**: AI translations are stored in `entities[].aiTranslation` field. The old `autoTranslationEntities` is deprecated but compatibility is maintained.
  - **Fallback Logic**: Managed by `app/lib/translation/resolveTranslationView.ts` (6-level decision chain).
  - **Entity Protection**: Use the **Placeholder Mechanism** (`<<__TYPE_INDEX__>>`) when sending text to LLMs to prevent corruption of URLs, mentions, and hashtags.
  - **Dual Provider Support**: Both Google Gemini and DeepSeek are supported. Provider selection is managed via `aiProvider` in `useAppConfigStore`.
  - **Stable Entities**: Never modify `tweet.entities` directly. Translations are stored in `entities[].aiTranslation` (AI) or `TranslationStore` (manual).
  - **Three-State Logic**:
    - `undefined`: Default (use AI/Original).
    - `Entity[]`: User edited.
    - `null`: Explicitly hidden (force original).

### UI & Components

- **Styling**: Tailwind CSS v4. Use the `cn()` utility for conditional classes.
- **Components**: Prefer functional components with TypeScript. Use `lucide-react` for icons.
- **Screenshots**: Components used for screenshots (in `app/routes/plain.tsx`) must be isolated and use `waitForRenderReady`.

## 6. Postmortem（尸检报告）

> 🩻 **每次 Release 前必须跑的检查流程。** 这个词是用来让 AI 和人类都警觉的——不是「哦一篇文档」，而是「这是一个需要严肃对待的死亡分析」。

### 报告库

所有报告存放在 `./postmortem/` 目录，索引见 `./postmortem/index.md`。

当前 8 份报告覆盖了项目从 107 个 fix commit 中提取的根因：

| # | 主题 | 严重级 | 状态 |
|---|------|--------|------|
| 001 | Twitter 推文解析（parseTweet.ts 无测试、无分层） | SEV-2 | Active |
| 002 | 翻译系统（UI/字典/AI/模板全部耦合） | SEV-2 | Active |
| 003 | UI 样式/布局（20 次 CSS fix，无 design token） | SEV-3 | Active |
| 004 | 构建配置（客户端/服务端边界不清） | SEV-2 | Mitigated |
| 005 | 媒体管线（代理/视频/截图四套重复逻辑） | SEV-2 | Active |
| 006 | 状态管理（zustand 整 store 订阅 + 无类型迁移） | SEV-2 | Mitigated |
| 007 | Instagram 集成（新功能无验收清单） | SEV-3 | Active |
| 008 | 字体/渲染（web font 与截图竞争加载） | SEV-2 | Mitigated |

### Phase 1: Onboarding（初次接入）

从历史 fix commit 生成报告库，已完成。

### Phase 2: Pre-Release 检查（每次 Release 前）

**步骤**：
1. 获取本次改动的 commit 列表和文件列表
2. 读取 `./postmortem/*.md` 中的 Changed Files 和 Root Cause
3. 逐份交叉比对：文件重叠？模式复现？预防措施落实了没？

**输出**：✅ PASS / ⚠️ WARN / ❌ FAIL。FAIL 必须在 Release 前修。

### Phase 3: Post-Release 更新（每次 Release 后）

收集本次 Release 的 fix commit，判断是补充已有报告（Recurrence 字段）还是新增报告。

### 跨集群经验教训

1. **零自动化测试** — 解析器/store 迁移/视觉回归全无测试，每个 bug 手动发现
2. **高危文件**: `parseTweet.ts` (10 fix), `Tweet.tsx` (13 fix), `TranslationEditor.tsx` (10 fix)
3. **「修两次」反模式**: 至少 3 对 commit 第一次没修干净
4. **状态困在 React 边界**: 媒体代理 + 翻译逻辑绑定 hook，非 React 工具函数不可用

---

## 7. Testing & Validation

- **Commands**: `bun test` or `bun test:watch`.
- **Framework**: Vitest.
- **Automation**: **Always** run `bun run typecheck` and `bun run lint` after modifying code. If tests exist for the modified module (check `test/` directory), run them.

## 8. PR & Commit Guidelines

- **Commit Messages**: Prefer concise, semantic commit messages (e.g., `feat:`, `fix:`, `refactor:`).
- **Verification**: Ensure all changes are verified with `typecheck` and `lint` before completing a task.

## 9. Security

- **API Keys**: Never hardcode API keys or secrets. Use `.env` and `app/lib/env.server.ts`.
- **Twitter Keys**: Treat `TWEET_KEYS` as highly sensitive credentials.

---

_This document is for AI Agents. Humans should refer to README.md._
