# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Anon Tweet — 匿名浏览 Twitter/X 推文与 Instagram 帖子，AI 翻译（Google Gemini / DeepSeek），卡片导出（截图 + Markdown）的全栈应用。

## Project Context

- **Framework**: React Router v8 (SSR + CSR Hybrid)
- **Runtime**: Bun 1.3（`packageManager: bun@1.3.14`）
- **Data sources**: Twitter/X Private API（内置 `rettiwt-api` 逆向适配）+ Instagram（`@chilfish/gallery-dl-instagram` SDK）
- **AI**: Google Gemini + DeepSeek 双提供商（Vercel AI SDK）
- **Client state**: Zustand v5（persist v6）；**Server state**: SWR
- **Persistence**: PostgreSQL（Neon Serverless）+ Drizzle ORM（可选缓存层，`tweet` / `tweet_entities` / `tweet_user` / `ig_post` 表）
- **UI**: Tailwind CSS v4 + shadcn/ui + Lucide React
- **BFF Pattern**: API 路由（`app/routes/api/*`）聚合 Twitter / IG / DB / AI 数据
- **验证体系**: `verify/` — CLI 自验证工具 + fixture + AC 验收标准（详见 [docs/INDEX.md](docs/INDEX.md)）
- **VCS**: GitHub（`Chilfish/anonTweet`），Conventional Commits

## Essential Commands

```bash
bun install              # 安装依赖
bun run dev              # 开发服务器 (http://localhost:9080)
bun run build            # 生产构建
bun run typecheck        # 类型检查（react-router typegen + tsc）
bun run lint             # ESLint（@antfu/eslint-config，autofix）
bun run test             # Vitest 单元+验收测试（真实门禁）。裸 `bun test` 走 Bun 原生 runner（非 vitest），
                         #   其并行执行对共享模块存在 export 竞态（Bun 1.3.14/1.4 均有）→ 需要原生冒烟时用 `bun test --parallel=2`
bun run verify/index.ts  # 验证套件（离线，无需服务器/API key）

# 验证套件进阶
bun run verify/index.ts --module tweet         # 按模块
bun run verify/index.ts --ac AC-TWEET-001      # 单个 AC
bun run verify/index.ts --exit-on-fail         # CI 模式（失败 exit 1）

# 数据库（可选缓存）
bun run db:push          # 推送 Schema（Prototyping）
bun run db:generate      # 生成迁移文件
bun run db:migrate       # 执行迁移

# Storybook
bun run storybook        # 组件视觉用例 (http://localhost:6006)
```

## Project Structure & Key Patterns

### 关键目录

```
app/
├── lib/                 # 共享工具、缓存、AI 翻译、providers、验证
│   ├── rettiwt-api/     # Twitter/X API 客户端（逆向，70+ 文件）
│   ├── react-tweet/     # 推文渲染组件 + entity parser
│   ├── stores/          # Zustand stores（appConfig / translation / translationUI / TranslationDictionary）
│   ├── service/         # 服务端数据访问层（DB + cache + API）
│   └── translation/     # 翻译解析管线（materialize / resolveEntities / resolveTranslationView）
├── components/
│   ├── ins/             # Instagram 组件（barrel-export 通过 index.ts）
│   ├── tweet/           # Twitter 推文渲染组件
│   └── ui/              # shadcn/ui 组件原语
├── routes/
│   ├── api/             # BFF API 路由（tweet / ig / ai / user / proxy）
│   ├── plain.tsx        # 截图专用纯推文路由
│   └── plain-ig.tsx     # 截图专用纯 IG 路由
verify/                  # 验证套件（fixtures / sdk / framework / modules / acceptance-criteria）
test/                    # Vitest 单元测试
docs/                    # 技术文档与规范（见 docs/INDEX.md：features/ 功能 · planning/ 规划 · engineering/ 规范 · ui-design/ · postmortem/ 尸检报告 · reviews/ · development-log/ · archive/）
```

### 核心机制

**RettiwtPool**（`app/lib/SmartPool.ts`）：Twitter 多 Key 轮询池。429/401/403 自动轮换 Key，每个 Key 维护独立 `FetcherService` 实例缓存，全部耗尽则抛聚合错误。

**三层缓存**：Memory（LRU，max 1000，`structuredClone` 深拷贝）→ Node FS（原子写入）→ PostgreSQL（Drizzle ORM）。请求合并去重通过 `pendingRequests` Map。

**翻译实体系统**：

- AI 翻译存 `entities[].aiTranslation` 字段；手动翻译存 `TranslationStore`
- **Placeholder 机制**（`<<__TYPE_INDEX__>>`）：送 LLM 前保护 URL/mention/hashtag，校验 + 重试
- 视图解析器 `resolveTranslationView.ts`：6 级决策链（manual > ai > original）
- IG caption 是纯文本，走 `translateIGCaption.ts`（`isChinese()` 守卫）

### 状态管理（Zustand）

- Store 定义一律 `create<T>()()`（双括号，middleware 兼容）
- **禁止直接解构 hook**：必须用 selector（`useStore(s => s.theme)`）
- 多字段用 `useShallow`；`persist` store 必须用 `_hasHydrated` 模式防 SSR mismatch
- 规范详见 `docs/engineering/code-style.md`

## Key Conventions

- **验证先行（test-first）**：先定义接口 → 写测试 → 实现。修改模块时先看 `test/` 是否有对应测试
- **BFF 边界**：`app/routes/api/*` 只做聚合/代理，业务逻辑在 `app/lib/`；服务端代码禁入客户端 bundle
- **Barrel export**：3+ 文件的组件目录必须有 `index.ts`（参考 `app/components/ins/index.ts`）
- **Screenshot 组件隔离**：用于截图的组件必须在独立路由 + 使用 `waitForRenderReady`
- **catch 用 `unknown`**，窄化用 `instanceof Error`，禁用 `catch (error: any)`
- **安全**：API Key / `TWEET_KEYS` / `INS_COOKIES` 只走 `.env` + `app/lib/env.server.ts`，绝不硬编码

### 🔴 强制规范（必须遵循）

1. **先写 commit message 再写代码**（详见 `docs/engineering/git-workflow.md#commit-纪律`）。每个 commit 是单一关注点的原子提交，避免上帝 commit。当 diff >10 文件或 >200 行时必须拆分。

2. **验证先行（verification-first）**：每个功能先有 AC（验收标准，`verify/acceptance-criteria/`）再实现。新功能实现后必须补 verifier + fixture，`bun run verify/index.ts` 通过后才算完成。涉及 Screenshot 功能必须有 `waitForRenderReady`。

3. **文档先行（docs-first）**：每个任务第一步先更新相关文档（开发日志 `docs/development-log/README.md`、任务状态 `docs/planning/backlog.md`（已完成里程碑见 `docs/archive/action-plan.md`）、方案文档），再开始写代码。实施过程中随实际反馈同步修改文档、记录开发日志与踩坑，而非事后补记。

4. **开写代码前先读尸检报告**（`docs/postmortem/README.md`）：本仓库历史踩坑沉淀于此（零测试解析器、状态耦合、CSS 无 token 等），写码/重构前对照「高频雷区」自查。**每个 commit 提交前本地跑 `bun run typecheck && bun run lint && bun run test`**，确认通过再走，不要等 pre-push 钩子/CI 才发现违规。遇到新的返工/事故按 [TEMPLATE.md](docs/postmortem/TEMPLATE.md) 沉淀一条 postmortem。

## Current State

**Instagram 集成（5 阶段）+ 翻译子系统 + verify 验收框架**：✅ 已完成（2026-05 ~ 2026-07，见 `docs/archive/action-plan.md`）。

**verify 套件二期 + 测试验证基建重构**：✅ 已完成（Phase 2 S5~S10 与 Vitest 三层架构，见 `docs/archive/action-plan.md`）。

**当前阶段 — 三阶段排期·阶段一（止血）**：✅ 已完成（2026-08-17，见 `docs/reviews/review-2026-08-17-apple-critique.md` 与 `docs/planning/backlog.md`）。门禁命令统一（`bun run test` + 集成无服务器 skipIf）、SmartPool 限流/冷却/失败隔离（单测 8 用例）、Resolver 收敛（AC-RESOLVER-001）、catch any 清零、Bili 隐藏入口卫生化（ENABLE_BILI 默认开）。验收：`bun run test` 211/211、`bun test --parallel=2` 0 fail、`verify --exit-on-fail` 218 PASS、lint 0 error。

**下一阶段 — 阶段二（核心体验，3-6 周，按 backlog 排期）**：GET 与 AI 翻译解耦 + 流式化、长链/截图性能基线（AC-PERF-001）、翻译可观测性、baseUrl 白名单（AC-SEC-001）。

## GitHub CLI Flow

```bash
gh issue list --state open                # 检查进行中的工作
gh pr create --title "feat(scope): ..." --body "..."  # 开 PR
gh pr checks <N>                          # 验证 CI
gh pr merge <N> --merge --delete-branch   # Create a Merge Commit
```

## Git Hooks

`lefthook.yml` 管理 git hooks：

- `pre-commit`：ESLint autofix（staged files）
- `pre-push`：真实 gate — `typecheck + lint + test + verify`（当前 test 44/44、verify 17 PASS，可正常放行）

## Project Skills

- `coss` / `coss-particles`（`.agents/skills/`）— coss UI 组件技能
