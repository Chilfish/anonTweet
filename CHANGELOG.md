# Changelog

All notable changes to Anon Tweet will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/lang/zh-CN/).

## [Unreleased]

### Added

#### 验证诚信修复（2026-09-12）

- `test/acceptance/ac-contract.spec.ts`：文档 AC 编号 ↔ `describe/it` 名 1:1 元测试（F4）
- eslint `test/expect-expect` / `no-conditional-expect` / `no-standalone-expect`（F10）
- postmortem 011（验证名实不符 / dev 模式泄漏）；完成项归档至 `docs/archive/backlog-completed-2026-09-12.md`

#### 版本单源治理（2026-09-11）

- AC-LLMS-002 版本奇偶校验：`info.version` ↔ `package.json` ↔ 随附快照三方一致

#### 测试验证基建重构（2026-08-14）

- `test/integration`：globalSetup 自动起停 TestServer（tweet/ig/media/screenshot API 集成测试），外部凭据缺省 `skipIf`
- `parseTweet.ts` 单测 16 用例（postmortem #001 高危文件零覆盖 P0 补缺）
- 共享 helpers：`load-fixture`（统一解包）/ `read-project-file` / `pixel-server` / `test-context`

#### 工程规范（对标 Float）

- 文档体系：`docs/README.md` 索引、`docs/engineering/{code-style,git-workflow,release-checklist}.md`、`docs/planning/{action-plan,architecture}.md`（ADR-001~008）、`docs/development-log/`
- `CHANGELOG.md`、`CONTRIBUTING.md`

### Changed

#### 验证诚信修复（2026-09-12）

- AC-CI-002/003/004 改为解析 workflow `run:` / `uses:` 步骤断言，注释不再能冒充步骤（F5）
- AC-TWEET-001~004/007、AC-IG-001/006 去 fixture 自证，改为断言真实函数产出；AC-IG-006 真实调用 `translateIGCaption`（LLM 打桩）（F8）
- 补 AC-TRANS-005/006/007 命名；新增 `verify/acceptance-criteria/AC-test.md` 登记 `AC-TEST-006`；新增 `AC-dev.md`（F1/F9）
- `verify/README.md` 修订「AC 编号即测试名 1:1 可追溯」「裸跑永远绿」失实表述（F12）
- `--server` / `--server-port` 标注 deprecated（no-op）；`hasEntityType` 形参收窄为 `Entity['type']`（F13）

#### 版本单源治理（2026-09-11）

- OpenAPI `info.version` 由硬编码 `1.0.0` 改为读取 `package.json`（`app/lib/llms.ts`），随附 skill 快照 `references/anon-tweet-openapi.json` 随之重新生成对齐
- `anon-tweet.ps1` 的 User-Agent 版本改为运行时从 `../SKILL.md` frontmatter 读取（`Get-SkillVersion`），删除手写副本
- 版本纪律（`release-checklist.md` / `git-workflow.md`）由「单源 package.json」更正为「应用 / API 版本」与「skill 版本」两个独立单源域

#### 测试验证基建重构（2026-08-14）

- verify 引擎：自研 VerifyRunner/Verifier 框架删除，57 条 AC 迁移到标准 Vitest 三层架构（`test/unit` 纯函数 / `test/acceptance` AC 语义层 / `test/integration` BFF API），AC 编号 = test 名保持可追溯
- `verify/index.ts` → 薄 CLI（参数映射 vitest `-t` 过滤）；`bun run test` = unit+acceptance、`bun run test:integration` 独立
- 新增 AC-TEST-001~008 验收标准（单命令全分层 / AC 可追溯 / 去重 / 死代码清零 / 离线确定性 / parseTweet 覆盖 / 文档同步 / 样板收敛）

#### 工程规范（对标 Float）

- CLAUDE.md 真实化：符号链接 → 普通文件（git mode `120000` → `100644`），写入对标 Float 的完整规范（强制规范 / Essential Commands / 结构 / Current State）
- AGENTS.md 弃用：技术内容并入 CLAUDE.md + docs，删除文件
- postmortem 迁移：`postmortem/` → `docs/postmortem/`（对齐 Float），新增 TEMPLATE.md + 高频雷区自查
- `lefthook.yml` pre-push：占位符 → 真实 gate（typecheck + lint + test + verify；当时 verify/test 有预先存在的失败会拦截 push，修复为独立任务）

### Fixed

#### 验证诚信修复（2026-09-12）

- dev server 在外层 `NODE_ENV=production` 下崩溃（`jsxDEV is not a function`）：`dev`/`build` 脚本经 `cross-env` 固定 `NODE_ENV`，不再依赖宿主环境（F1）
- `verify/index.ts` 空跑报绿：`--ac` / `--module` 零匹配（0 executed）现在非零退出并说明原因；修正模块别名（translation→`AC-TRANS` / screenshot→`AC-SHOT`+`AC-PERF` / postmortem→`AC-PM`）；`--module` 白名单启动校验（F2）
- `ac-sec.spec.ts` AC-SEC-001 死 `return`（`// 暂时不管他`）；配合所有者裁定移除过噪的设置页隐私披露文案及其断言（F3）
- 集成层半恒真：AC-TWEET-006 去掉 `catch { return }`，改为断言「`[]` 或干净 HTTP 错误」；AC-SHOT-001/002 拆分 `it.skipIf` 并对真实 fixture id 断言内容特征（F7 部分）

### Removed

#### 测试验证基建重构（2026-08-14）

- `test/fetchTweet.ts`（真网络脚本混入测试目录）、SDK 死类型（`TweetListResponse` 等）

### Deferred

#### 验证诚信修复（2026-09-12）

- F6 / F7（剩余 msw 全量替换）/ F11（Stryker 变异体检）经所有者裁定「暂不修复」延后归档；测试基建收口，后续转功能开发

## [0.1.0] - 2026-05-31

### Added

#### Instagram 集成（5 阶段）

- IG 类型定义 + URL 识别 + 路由骨架（`extractIGId`、`detectInputType`、`/ins/:id`）
- API 层：`@chilfish/gallery-dl-instagram` SDK + `/api/ig/get` BFF 路由
- UI 组件：`InstagramPostCard` + `PlainIGPost` + 13 子组件（九宫格、透卡相框）+ barrel export
- 操作区：`IGHeader`（翻译/截图/下载/复制）+ `IGOptionsMenu` + `IGTranslateToggle`
- AI 翻译管线：`translateIGCaption.ts` + `IGTranslateDialog`
- DB 缓存：`ig_post` 表 + `getIGPost.server.ts` 三层缓存
- 纯文本路由：`/plain-ins/:id` + Storybook 用例（14 个 IG 组件 story）

#### 翻译子系统

- 统一 resolver 纯函数（`resolveTranslationView` stream/overlay 判定）
- materialize / strip translations 纯函数
- 测试：`resolveEntities`、`translationMaterialize`、服务层单测

#### 验证体系（2026-07-04）

- `verify/` 五层闭环：AC（25 条）→ Fixtures（7 个）→ SDK（AnonTweetClient + TestServer）→ CLI（`bun verify`）→ CI（待办）
- Postmortem 8 份报告（107 fix commits → 8 根因集群）

### Changed

#### 代码质量

- `catch (error: any)` → `catch (error: unknown)`
- 提取共享 `formatIGTime()` 到 `utils.ts`，消除重复
- `structuredClone()` 替换 `JSON.parse(JSON.stringify())`（深拷贝性能）

#### 翻译子系统

- AI 翻译强制结构化 JSON 输出（schema 校验 + 占位符校验 + 一次重试）
- `tweet.entities` 回归原文只读；手动翻译只存 `TranslationStore`

### Fixed

#### 代码质量

- `PlainIGPost` 向 `IGCaption` 传递不存在的 `tags` prop
- `RettiwtPool.shouldRetry()` 新增 401/403 轮换

#### 翻译子系统

- 翻译完成后主动刷新 local cache

### Removed

#### 代码质量

- 死代码 `proxyMedia()`、`createSelectors()`
