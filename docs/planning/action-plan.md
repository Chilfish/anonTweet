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
| S8 服务器自动管理（`--server`） | P3     | 0.5 天 | 无   | ✅ 已完成 |
| S7 Media Proxy Verifier         | P3     | 1 天   | S8   | ✅ 已完成 |
| S9 IG 集成测试扩展              | P3     | 2 天   | S8   | ✅ 已完成 |
| S10 Postmortem 自动化检查       | P4     | 1.5 天 | 无   | ✅ 已完成 |

## 最近更新

### 2026-08-14 — 测试基线红灯修复（vitest 冷加载超时）✅ 已完成

- **问题**：`bun run test`（vitest run）全量**偶发 4~5 fail**——失败集每次漂移（`api.ai-translation` / `api.tweet-get` / `env.server` / `getTweet` 轮流出局），全部为 `Test timed out in 5000ms`，且都发生在**动态 import 服务端路由/模块**的冷加载路径
- **根因诊断（实测）**：vitest 并行全量下 transform+import 冷加载极慢（单文件 import 实测 13.4s；全量 import 合计 131.7s / transform 56.9s），远超默认 5s `testTimeout`；**单文件运行全部通过（env.server 单独 286ms 全绿）** → 非逻辑 bug，是测试隔离层配置问题（对齐 review §7.3 遗留）
- **修复**：`vitest.config.ts` `test.maxWorkers: 2`（16 核默认 16 worker 并行竞争）+ 全局 `testTimeout`/`hookTimeout` 30s；删除 `api.tweet-get`/`api.vision` 冗余 per-test 15000（全局接管）
- **验收**：连续 5 次 `bun run test` 全量 115/115 全绿 + typecheck ✅ + lint 0 error ✅ + verify 42 PASS ✅
- **commit 拆分**：`docs:` 计划（`90f448f`）→ `test:` 修复（`ee5f1eb`）→ `docs:` 验收回填
- 详见 `docs/development-log/2026-08-14.md`

### 2026-08-13 — AI Vision PR #14 评审修复 + UI 打磨

- 对 `feat/ai-vision`（PR #14，42 文件）做 Apple 产品 × 研发视角评审，产出 `docs/planning/ai-vision-review.md`
- **合前必修 2 安全点已修**：P0-1 SSRF（`fetchImageDataUri` host 精确白名单 `assertAllowedMediaHost`，绕过 `/api/proxy/image` 白名单的问题）；P0-2 未认证缓存写（`app/lib/validations/vision.ts` 强校验 + save/generate 落盘前校验）
- **P1-2**：`describeImages.ts` 重试扩展覆盖 SDK 层 `NoObjectGeneratedError`
- **UI 打磨（Apple HIG）**：`AIVisionBlock`（文字级 toggle / 去编号徽章 / 字阶收敛 / hairline）、`AIVisionEditorDialog`（自然语言 label / 按钮层级 / footer 减负 / Select 值统一字符串）、`AIVisionSettings`（文案精简）
- **UI 第二轮（结构性）**：模式下拉 → `ToggleGroup` 分段控件；编辑器状态上提 `AIVisionBlock`、空态改可点击 CTA；展示块改 `bg-card` 分组容器；`AIVisionSettings` Select 回对象值模式（对齐 AITranslationSettings）
- **UI 第三轮（弹窗原语 + tabs 手机端）**：`dialog.tsx` padding `p-6`→`p-5`（6 弹窗受益）；**保留设置页 5 tab**（用户既有习惯），`TabsList` 手机端横向滑动 + 窄屏隐藏绝对定位 Indicator（active 由 tab 自身胶囊承担，宽屏恢复 segment 滑块）；Vision 弹窗重写（分段控件裸露 + 单卡片 + 无底色 textarea）；`SettingsRow` control `shrink-0`；`ToggleGroup` 防溢出
- 验收：typecheck ✅ · lint 0 error ✅ · test 111 pass（4 fail 1 error 预存基线）· verify vision 8/8 ✅ · vision.spec 45/45 ✅
- 遗留（见 review §7.3）：测试基线红灯独立任务（Bun runner `vi.resetModules` 兼容）、P1-1 单图容错二期、P1-4 并发限流二期

### 2026-08-13 — 新特性规划：AI 视觉描述子系统（Phase 0 文档先行）

- 规划文档化：`docs/feature_ai_vision.md`（需求与上下文）、`docs/planning/ai-vision-plan.md`（行动计划 + DR-1~~7 + commit 拆分）、`verify/acceptance-criteria/AC-vision.md`（AC-VISION-001~~008）
- 目标：为推文配图提供**结构化** AI 视觉描述（看图说话 / 结构化 OCR+翻译 / 自定义提示），默认 `xiaomi/mimo-v2.5` via OpenRouter，与文本翻译解耦、可并行、可进截图
- 关键决策：复用 `@ai-sdk/openai-compatible`（零新依赖）；`AIVisionInfo` 独立对象不并入 Entity；独立设置 Tab + 独立 `POST /api/ai/vision` 路由
- 前置依赖：工作区未提交的 baseUrl/自定义模型 threading 先落地
- 详见 `docs/planning/ai-vision-plan.md`

### 2026-08-09 — Phase 2 S10 完成：Postmortem 预发布检查自动化

- **S10 完成（代码 + 验收）**：`verify/acceptance-criteria/AC-postmortem.md`（AC-PM-001~007）→ `scripts/postmortem-check.ts`（git 改动 × Changed Files 交叉比对 + shallow checkout 兜底）+ `verify/modules/postmortem.verifier.ts`（静态完整性检查：报告目录/状态/Changed Files/README 索引/脚本冒烟）
- **CI 增强**：verify.yml paths 补 `scripts/**`（S10 脚本被 AC-PM-007 依赖）
- **验收**：`--module postmortem` → **7 PASS / 0 FAIL**；typecheck ✓ / lint 0 error（28 warning 预存）/ test 42/44 预存
- **Postmortem README 更新**：Pre-Release 检查从"手动步骤"→ 自动化引用 `bun run postmortem-check`

**Phase 2 全部完成** 🎉（S5 CI/S6 Screenshot/S7 Media Proxy/S8 服务器管理/S9 IG 集成/S10 Postmortem）

### 2026-08-09 — Phase 2 S9 完成：IG 集成测试扩展

- **S9 IG 集成测试扩展完成**：ig.verifier 从 5 条扩到 **9 条**（AC-IG-006~009），AC-ig.md 更新 v1.1
  - AC-IG-006（Caption 翻译不破坏原文，离线 fixture + `translateIGCaption` 纯函数扫描）
  - AC-IG-007/008（Posts/Stories 端点集成，需 `INS_COOKIES`，无则 SKIP）
  - AC-IG-009（无 cookies → 500，隔离环境确定性 PASS）
- **修正 api-client bug**：`ig.get`/`ig.getById` 路径 `/api/ig/${id}` → `/api/ig/get/${id}`（对齐真实路由，原会 404）；新增 `ig.postRaw`（暴露 status/body）
- **端点校准**：IG 帖子/故事统一 `POST /api/ig/get/:id`（action handler 内置 stories 分支，无独立 stories 路由），AC 文档 v1.1 对齐
- **验收**：verify 全量 --server → **34 PASS / 0 FAIL / 4 SKIP**（IG 9/9：6 PASS + 009 集成 PASS + 007/008 SKIP）；离线 6 PASS / 3 SKIP；typecheck / lint（0 error）/ test 44/44 全绿

### 2026-08-09 — Phase 2 S7 完成：Media Proxy Verifier

- **S7 Media Proxy Verifier 完成**：新建 `verify/modules/media.verifier.ts` + `verify/acceptance-criteria/AC-media.md`，基于 Postmortem #005（媒体管线重复）覆盖 AC-MEDIA-001~006
- **确定性实现**：AC-MEDIA-001/002 不用真实 CDN URL（上游漂移/离线不可用），改由本地像素图服务器（`Bun.serve` 随机端口，1×1 PNG）构造白名单内 URL 由代理真实转发 —— 后缀白名单（Tweet，`*.png`）与 IG 域名白名单（含 `cdninstagram.com`）两条路径均离线确定
- **SDK**：`AnonTweetClient.proxy.image(url)` + 底层 `rawGet`（非 2xx 不 throw，暴露 status/contentType），供 AC-MEDIA-003 断言 400/403
- **验收**：verify 全量 --server → **32 PASS / 0 FAIL / 2 SKIP**（media 6/6 全绿，集成 3 条替代离线 SKIP）；`--module media` 离线 3 PASS / 3 SKIP；typecheck / lint（0 error）/ test 44/44 全绿
- 调研记录：`useProxyMedia` 幂等守卫存在（双代理已防）；Tweet 组件统一走 `proxyMedia`；IG 组件直接 `display_url` 是合理例外（IG CDN 开放 CORS）；proxy 白名单 `IMAGE_EXT_RE` 要求后缀结尾，真实 twimg URL 带 query 会 403（Tweet 走 `mediaProxyUrl` 前缀方案不依赖该端点，边界已记录）

### 2026-08-09 — Phase 2 S8 完成

- **S8 服务器自动管理完成**：`bun run verify/index.ts --server` 自动启动 dev server（默认 9081，`--server-port` 自定义）、注入 AnonTweetClient、结束后自动停止
  - 修复 `vite.config.ts` `server.port` 硬编码 9080 → 支持 `PORT` env 覆盖（`verify/sdk/test-server.ts` spawn 时传 `PORT=9081`）
  - `TestServer` 增强：**端口复用**（探测已有服务器 → `Reusing` 不重复 spawn，停止时不杀非自启进程）、Windows `taskkill /T /F` 进程树清理（修复 SIGTERM 残留）、`process.on('exit')` 兜底、`isolateExternal` 隔离外部 API key（确定性验证）
  - **隔离实现**：`DOTENV_CONFIG_PATH` 指向缺失文件阻止 `.env` 加载 + `INS_COOKIES`/`TWEET_KEYS` 置空串 + `GEMINI_API_KEY`/`DEEPSEEK_API_KEY` 用 `delete`（空串会触发 zod `.min(1)` 校验失败）
  - 验收：verify --server 全绿 **26 PASS / 0 FAIL / 2 SKIP**（AC-SHOT-001/002 + AC-TWEET-006 激活 PASS；AC-TWEET-005/008 需真实 `TWEET_KEYS` 仍 SKIP）

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
