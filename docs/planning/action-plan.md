# 行动计划

**最后更新**: 2026-08-09

## 项目目标

Anon Tweet — 匿名浏览 Twitter/X 推文与 Instagram 帖子的全栈应用，AI 翻译（Google Gemini / DeepSeek 双提供商）+ 卡片导出（截图 + Markdown）。核心场景：无登录阅读推文/IG、跨语言翻译、分享卡片。

## 里程碑

### Instagram 集成（5 阶段）✅ 已完成（2026-05）

| #   | 阶段            | 内容                                                                     | 状态 |
| --- | --------------- | ------------------------------------------------------------------------ | ---- |
| 1   | 类型 + URL 识别 | `extractIGId`、`detectInputType`、`/ins/:id` 路由                        | ✅   |
| 2   | API 层          | `@chilfish/gallery-dl-instagram` SDK + `/api/ig/get` BFF 路由            | ✅   |
| 3   | UI 组件         | `InstagramPostCard` + `PlainIGPost` + 13 子组件 + barrel export          | ✅   |
| 4   | 操作区          | `IGHeader`（翻译/截图/下载/复制）+ `IGOptionsMenu` + `IGTranslateToggle` | ✅   |
| 5   | AI 翻译 + 缓存  | `translateIGCaption.ts` + `ig_post` 表 + 三层缓存                        | ✅   |

### 翻译子系统重构 ✅ 已完成（2026-03 ~ 2026-05）

- AI 翻译强制结构化 JSON 输出（schema + 占位符校验 + 重试）
- 统一 resolver 纯函数（`resolveTranslationView` 6 级决策链）
- `tweet.entities` 回归原文只读；手动翻译存 `TranslationStore`
- 双提供商：Google Gemini + DeepSeek

### 验证体系 ✅ 已完成（2026-07-04）

五层闭环：**AC（25 条）→ Fixtures（7 个）→ SDK（AnonTweetClient + TestServer）→ CLI（bun verify）→ CI（待 S5）**

| 层                     | 状态                                                      |
| ---------------------- | --------------------------------------------------------- |
| L1 Acceptance Criteria | ✅ 25 AC（tweet 8 / translation 7 / ig 6 / screenshot 4） |
| L2 Test Fixtures       | ✅ 7 fixtures                                             |
| L3 SDK / API Client    | ✅ AnonTweetClient + TestServer                           |
| L4 CLI Verify Tool     | ✅ 17 PASS / 0 FAIL / 3 SKIP                              |
| L5 CI/CD Pipeline      | ✅ 已实施（Phase 2 S5，AC-CI-001~004）                    |

> 详见 `docs/verification-gap-analysis.md`、`verify/README.md`。

## 当前阶段 — verify 套件二期 🔄 进行中

Phase 2 行动（源自 `docs/next-steps.md`）：

| 任务                            | 优先级 | 工期   | 依赖 | 状态      |
| ------------------------------- | ------ | ------ | ---- | --------- |
| S5 CI/CD Pipeline（verify.yml） | P2     | 1 天   | 无   | ✅ 已完成 |
| S6 Screenshot Verifier          | P2     | 1 天   | 无   | ✅ 已完成 |
| S8 服务器自动管理（`--server`） | P3     | 0.5 天 | 无   | ⏳ 待办   |
| S7 Media Proxy Verifier         | P3     | 1 天   | S8   | ⏳ 待办   |
| S9 IG 集成测试扩展              | P3     | 2 天   | S8   | ⏳ 待办   |
| S10 Postmortem 自动化检查       | P4     | 1.5 天 | 无   | ⏳ 待办   |

## 最近更新

### 2026-08-09 — Phase 2 S5 + S6 完成

- **S5 CI/CD Pipeline 完成**：`.github/workflows/verify.yml`（push + pull_request 触发）+ `CIVerifier` 覆盖 AC-CI-001~004，verify 全绿（21 PASS / 0 FAIL / 3 SKIP）
- 修正 `AC-screenshot.md` 端点路径对齐 `app/routes.ts`：`/plain` → `/plain-tweet/:id`、`/plain-ig` → `/plain-ins/:id`（历史改名遗留，AC 文档沿用了旧路径）
- **S6 Screenshot Verifier 完成**：按 AC-SHOT-001~004 实现 `screenshot.verifier.ts` + `AnonTweetClient.plain` 方法，verify 全绿（23 PASS / 0 FAIL / 5 SKIP；AC-SHOT-001/002 集成测试待 S8 服务器自动管理）

### 2026-08-09 — 验证套件修复收尾 + Phase 2 启动

- **预存失败已修复**：test 7 fail → 44/44 全绿（`bun run test` 修正 Bun 原生 runner 陷阱）；verify ~20 TS errors → 17 PASS / 0 FAIL / 3 SKIP；lint error 清零（ESLint 豁免 `rettiwt-api` 第三方库）
- AI SDK v7 迁移（`experimental_output` → `output`）+ 实体字段 `translation` → `aiTranslation`
- pre-push gate 现可正常放行；启动 **S5 CI/CD Pipeline**

### 2026-08-09 — 工程规范对标 Float

- **CLAUDE.md 真实化**：符号链接 → 普通文件，写入对标 Float 的完整规范（强制规范 / 命令 / 结构 / Current State）
- **AGENTS.md 弃用**：技术内容并入 CLAUDE.md + docs，删除文件
- **postmortem 迁移**：根目录 `postmortem/` → `docs/postmortem/`（对齐 Float 结构），新增 TEMPLATE.md + 高频雷区自查
- **文档体系**：新建 `docs/README.md` 索引、`docs/engineering/{code-style,git-workflow,release-checklist}.md`、`docs/planning/{action-plan,architecture}.md`、`docs/development-log/`
- **补齐**：CHANGELOG.md、CONTRIBUTING.md；lefthook pre-push 占位符 → 真实 gate（⚠️ 预先存在的 verify ~20 TS 错误 + test 7 失败会拦截 push，修复为独立任务）；断链修复（`docs/SKILL/zustand-state-management.md`）

### 2026-07-04 — 验证体系搭建

- 五层闭环验证体系（AC / Fixture / SDK / CLI / CI）
- 25 条 AC + 7 fixtures + AnonTweetClient + TestServer + VerifyRunner
- P0 全部完成，Phase 2（S5-S10）规划见 `docs/next-steps.md`

### 2026-05-31 — IG 集成 + 代码质量修复

- IG 5 阶段全部完成（类型/API/UI/操作区/翻译缓存）
- 8 份 postmortem 生成（107 fix commits → 8 根因集群）
- 代码质量：`catch unknown`、`structuredClone`、401/403 轮换、barrel export

### 2026-05 — IG 集成启动

- 双平台支持：Twitter/X + Instagram（posts/reels/stories）

## 开发原则

1. **验证先行** — 先定义 AC → 写测试/verifier → 再实现
2. **Trunk-Based Development** — feature 分支 → PR → Create a Merge Commit
3. **Conventional Commits** — `feat(scope): description`
4. **每个 Phase 完成后 review** — 更新文档 + 验收
5. **文档先行** — 每个任务先更新文档再写代码
