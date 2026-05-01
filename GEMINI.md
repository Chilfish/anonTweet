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

## 6. Testing & Validation

- **Commands**: `bun test` or `bun test:watch`.
- **Framework**: Vitest.
- **Automation**: **Always** run `bun run typecheck` and `bun run lint` after modifying code. If tests exist for the modified module (check `test/` directory), run them.

## 7. PR & Commit Guidelines

- **Commit Messages**: Prefer concise, semantic commit messages (e.g., `feat:`, `fix:`, `refactor:`).
- **Verification**: Ensure all changes are verified with `typecheck` and `lint` before completing a task.

## 8. Security

- **API Keys**: Never hardcode API keys or secrets. Use `.env` and `app/lib/env.server.ts`.
- **Twitter Keys**: Treat `TWEET_KEYS` as highly sensitive credentials.

---

_This document is for AI Agents. Humans should refer to README.md._
