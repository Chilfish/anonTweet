# Anon Tweet 文档索引

> **本文档是项目文档的唯一入口。** AI 和开发者在处理任何任务前，先阅读本文档了解文档全局布局，再根据任务类型按需读取对应的领域文档。规范流程见 [CLAUDE.md](../CLAUDE.md) 的「🔴 强制规范」。

---

## 一、项目概述

Anon Tweet — 匿名浏览 Twitter/X 推文与 Instagram 帖子的全栈应用，AI 翻译（Google Gemini / DeepSeek 双提供商）+ 卡片导出（截图 + Markdown）。

- **框架**：React Router v8（SSR + CSR Hybrid）｜ **运行时**：Bun 1.3
- **数据源**：Twitter/X Private API（`rettiwt-api` 逆向适配）+ Instagram（`@chilfish/gallery-dl-instagram`）
- **AI**：Google Gemini + DeepSeek + OpenRouter（AI Vision，Vercel AI SDK）
- **状态**：Zustand v5（client）/ SWR（server）｜ **持久化**：PostgreSQL（Neon Serverless）+ Drizzle ORM
- **验证**：`verify/` 验证套件（Vitest 三层架构）+ AC 验收标准 + Postmortem 雷区

---

## 二、文档目录结构

```
docs/
├── INDEX.md                    # 本文档（唯一入口）
├── features/                   # 功能文档，按子系统组织
│   ├── translation/            #   翻译子系统（translation.md · deepseek-ai-sdk.md）
│   ├── instagram/              #   Instagram 集成（instagram-integration.md · ig-actions-integration.md）
│   ├── ai-vision/              #   AI 视觉描述（ai-vision.md）
│   └── deploy/                 #   部署（deployment.md）
├── planning/                   # 规划与决策（architecture ADR · project-architecture · backlog）
├── engineering/                # 工程规范（code-style · git-workflow · release-checklist）
├── ui-design/                  # UI 设计系统（README 总览 · GENERAL 原子组件 · SETTINGS）
├── postmortem/                 # 尸检报告（历史踩坑沉淀，开写代码前必读）
├── reviews/                    # 代码审查记录（review-YYYY-MM-DD-<主题>.md）
├── development-log/            # 开发日志（按天记录 YYYY-MM-DD.md）
├── requirements/               # 复杂功能需求文档（PRD / 用户故事，约定见 requirements/README.md）
└── archive/                    # 已完成阶段的规划文档存档（action-plan · ai-vision-plan · testing-infra-refactor · next-steps 等，不主动读取）
```

---

## 三、文档导航 — 什么时候读哪个文档

> **核心原则**：根据任务涉及的代码范围按需读取，不要一次性全读。

### 按功能领域

| 任务场景                                       | 必读文档                                                                                       | 说明                                                             |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **新增/修改翻译逻辑**                          | `features/translation/translation.md`                                                          | 数据流、占位符机制、6 级决策链、stream/overlay 分工              |
| **修改 AI Provider / DeepSeek 参数**           | `features/translation/deepseek-ai-sdk.md`                                                      | provider 级/模型级/callOptions 参数暴露策略                      |
| **修改 Instagram 集成**                        | `features/instagram/instagram-integration.md` + `features/instagram/ig-actions-integration.md`  | IG 5 阶段管线、操作区、DB 缓存、caption 翻译                     |
| **修改 AI Vision（看图说话/OCR）**             | `features/ai-vision/ai-vision.md` + `archive/ai-vision-plan.md`                               | 需求与上下文、已完成行动计划 + DR、AC-VISION              |
| **部署 / 环境配置**                            | `features/deploy/deployment.md`                                                                | Vercel / 自托管、环境变量、缓存层                                |
| **修改 UI 组件、页面**                         | `engineering/code-style.md` + `ui-design/README.md`                                            | 组件拆分、命名、导入顺序、原生优先原则                           |
| **修改原子组件（Button/Input/Dialog 等）**     | `ui-design/GENERAL.md` + `ui-design/select-cossui.md`                                          | shadcn/coss 组件使用规范                                         |
| **修改 Settings 页面**                         | `ui-design/SETTINGS.md`                                                                        | SettingsGroup / SettingsItem 强制规范                            |
| **架构级变更前**                               | `planning/architecture.md`（ADR）+ `planning/project-architecture.md`（系统架构 v3.0）          | 先读 ADR 历史决策，再对照架构总览                                |
| **规划下一阶段任务**                           | `planning/backlog.md` + `archive/action-plan.md`                                               | 未决任务清单、已完成里程碑记录                                    |
| **测试验证体系**                               | `../verify/README.md` + `archive/testing-infra-refactor.md`                                   | Vitest 三层架构（unit / integration / acceptance）               |
| **写码前防复现 / 新 Bug 模式**                 | `postmortem/README.md`（+ `TEMPLATE.md`）                                                      | 高频雷区自查；新 Bug 模式写 postmortem                           |
| **每次 commit / PR**                           | `engineering/git-workflow.md`                                                                  | 分支模型、Conventional Commits、commit 纪律、验证门禁            |
| **里程碑发布前**                               | `engineering/release-checklist.md`                                                             | 本地门禁 + 功能冒烟 + Postmortem 预发布检查                      |
| **了解历史决策 / 已知问题**                    | `reviews/` + `development-log/` + `archive/`                                                   | 评审记录、按天开发日志、已完成阶段存档                           |

### 按文档类型速查

| 需要什么                     | 去哪里                                                              |
| ---------------------------- | ------------------------------------------------------------------- |
| 系统架构总览（BFF/数据流）   | `planning/project-architecture.md`                                  |
| 架构决策记录（ADR-001~008）  | `planning/architecture.md`                                           |
| 当前阶段行动计划 / 里程碑    | `archive/action-plan.md`（已完成，历史记录）                            |
| 未决任务清单（backlog）      | `planning/backlog.md`                                                 |
| 代码规范（TS/React/Zustand） | `engineering/code-style.md`                                           |
| Git/Commit/PR 流程           | `engineering/git-workflow.md`                                         |
| 开发日志（按天）             | `development-log/README.md`（+ `development-log/YYYY-MM-DD.md`）      |
| 尸检报告索引                 | `postmortem/README.md`                                                |
| 代码审查记录                 | `reviews/README.md`                                                   |
| 已完成阶段的规划文档         | `archive/README.md`（历史查阅，不主动读取）                           |

---

## 四、验证体系（verify/）

| 文档                                                         | 说明                                                                   |
| ------------------------------------------------------------ | ---------------------------------------------------------------------- |
| [Verification Suite](../verify/README.md)                    | 验证套件 — Vitest 三层架构 + Fixture 库 + API 测试 SDK                 |
| [Testing Infra Refactor](archive/testing-infra-refactor.md) | 测试验证基建重构 — 审计报告 + 三层架构行动计划（Phase A~E，已完成，已归档） |
| [AI Vision AC](../verify/acceptance-criteria/AC-vision.md)   | AI 视觉描述验收标准（AC-VISION-001~012）                               |
| 存档：差距分析 / 二期计划                                    | `archive/verification-gap-analysis.md`（首轮差距分析，Phase 2 已完成）  |

---

## 五、常用开发命令

```bash
bun install              # 安装依赖
bun run dev              # 开发服务器 (http://localhost:9080)
bun run build            # 生产构建
bun run typecheck        # 类型检查（react-router typegen + tsc）
bun run lint             # ESLint（@antfu/eslint-config，autofix）
bun test                 # Vitest 单元测试
bun run verify/index.ts  # 验证套件（离线，无需服务器/API key；--exit-on-fail CI 模式）
bun run db:push          # 推送 Schema（可选 DB 缓存层）
bun run storybook        # 组件视觉用例 (http://localhost:6006)
```

---

## 六、文档体系约定（流程与反馈闭环）

> 对齐 scripts-ui / chill-s3 的文档生命周期：文档按「规划 → 工程 → 反馈」组织，历史教训固化为规则，防止同类问题复现。

### 文档生命周期

```
需求/规划   docs/requirements/  docs/planning/（architecture ADR · project-architecture · backlog）
工程规范    docs/engineering/（code-style · git-workflow · release-checklist）
功能文档    docs/features/<子系统>/（translation · instagram · ai-vision · deploy）
UI 设计     docs/ui-design/（README · GENERAL · SETTINGS）
反馈闭环    docs/postmortem/ · docs/reviews/ · docs/development-log/
存档        docs/archive/（git mv 已完成阶段计划，不主动读取）
```

### 何时写入（养成机制）

| 事件         | 动作                                                                                                        |
| ------------ | ----------------------------------------------------------------------------------------------------------- |
| 新 Bug 模式  | 写 `docs/postmortem/0NN-*.md`（模板 `TEMPLATE.md`），预防项同步 `CLAUDE.md` / `engineering/git-workflow.md` |
| 每次代码审查 | 记录到 `docs/reviews/review-YYYY-MM-DD-<主题>.md`                                                           |
| 每天收尾     | 记入 `docs/development-log/YYYY-MM-DD.md`                                                                   |
| 架构级决策   | 以 ADR 记录到 `docs/planning/architecture.md`                                                               |
| 阶段计划完成 | 计划文档 `git mv` 到 `docs/archive/`                                                                        |
| 里程碑发布   | 走 `docs/engineering/release-checklist.md`                                                                  |

### 文档语言

所有文档用中文（根级 README / CHANGELOG / CONTRIBUTING / LICENSE 用英文例外）。

### 验证门禁（commit / PR 前）

`bun run typecheck` → `bun run lint` → `bun test`；pre-push 另跑 `bun run verify/index.ts --exit-on-fail`。lefthook 已配置，**禁止 `--no-verify`**。详见 `docs/engineering/git-workflow.md`。

---

## 七、根目录文档

| 文档                                       | 说明                       |
| ------------------------------------------ | -------------------------- |
| [../README.md](../README.md)               | 项目介绍、技术栈、快速开始 |
| [../CHANGELOG.md](../CHANGELOG.md)         | 变更日志                   |
| [../CONTRIBUTING.md](../CONTRIBUTING.md)   | 贡献指南                   |
| [../LICENSE](../LICENSE)                   | MIT License                |
