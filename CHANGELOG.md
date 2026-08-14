# Changelog

All notable changes to Anon Tweet will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/lang/zh-CN/).

## [Unreleased]

### 测试验证基建重构（2026-08-14）

- **Changed** verify 引擎：自研 VerifyRunner/Verifier 框架删除，57 条 AC 迁移到标准 **Vitest 三层架构**（`test/unit` 纯函数 / `test/acceptance` AC 语义层 / `test/integration` BFF API），AC 编号 = test 名保持可追溯
- **Added** `test/integration`：globalSetup 自动起停 TestServer（tweet/ig/media/screenshot API 集成测试），外部凭据缺省 `skipIf`
- **Added** `parseTweet.ts` 单测 16 用例（postmortem #001 高危文件零覆盖 P0 补缺）
- **Added** 共享 helpers：`load-fixture`（统一解包）/ `read-project-file` / `pixel-server` / `test-context`
- **Changed** `verify/index.ts` → 薄 CLI（参数映射 vitest `-t` 过滤）；`bun run test` = unit+acceptance、`bun run test:integration` 独立
- **Removed** `test/fetchTweet.ts`（真网络脚本混入测试目录）、SDK 死类型（`TweetListResponse` 等）
- **Changed** 新增 AC-TEST-001~008 验收标准（单命令全分层 / AC 可追溯 / 去重 / 死代码清零 / 离线确定性 / parseTweet 覆盖 / 文档同步 / 样板收敛）

### 工程规范（对标 Float）

- **CLAUDE.md 真实化**：符号链接 → 普通文件（git mode `120000` → `100644`），写入对标 Float 的完整规范（🔴 强制规范 / Essential Commands / 结构 / Current State）
- **AGENTS.md 弃用**：技术内容并入 CLAUDE.md + docs，删除文件
- **postmortem 迁移**：`postmortem/` → `docs/postmortem/`（对齐 Float），新增 TEMPLATE.md + 高频雷区自查
- **Added** 文档体系：`docs/README.md` 索引、`docs/engineering/{code-style,git-workflow,release-checklist}.md`、`docs/planning/{action-plan,architecture}.md`（ADR-001~008）、`docs/development-log/`
- **Added** `CHANGELOG.md`、`CONTRIBUTING.md`
- **Changed** `lefthook.yml` pre-push：占位符 → 真实 gate（typecheck + lint + test + verify；⚠️ 当前 verify/test 有预先存在的失败会拦截 push，修复为独立任务）

## [0.1.0] - 2026-05-31

### Instagram 集成（5 阶段）

- **Added** IG 类型定义 + URL 识别 + 路由骨架（`extractIGId`、`detectInputType`、`/ins/:id`）
- **Added** API 层：`@chilfish/gallery-dl-instagram` SDK + `/api/ig/get` BFF 路由
- **Added** UI 组件：`InstagramPostCard` + `PlainIGPost` + 13 子组件（九宫格、透卡相框）+ barrel export
- **Added** 操作区：`IGHeader`（翻译/截图/下载/复制）+ `IGOptionsMenu` + `IGTranslateToggle`
- **Added** AI 翻译管线：`translateIGCaption.ts` + `IGTranslateDialog`
- **Added** DB 缓存：`ig_post` 表 + `getIGPost.server.ts` 三层缓存
- **Added** 纯文本路由：`/plain-ins/:id` + Storybook 用例（14 个 IG 组件 story）

### 代码质量

- **Fixed** `PlainIGPost` 向 `IGCaption` 传递不存在的 `tags` prop
- **Fixed** `RettiwtPool.shouldRetry()` 新增 401/403 轮换
- **Changed** `catch (error: any)` → `catch (error: unknown)`
- **Changed** 提取共享 `formatIGTime()` 到 `utils.ts`，消除重复
- **Changed** `structuredClone()` 替换 `JSON.parse(JSON.stringify())`（深拷贝性能）
- **Removed** 死代码 `proxyMedia()`、`createSelectors()`

### 翻译子系统

- **Changed** AI 翻译强制结构化 JSON 输出（schema 校验 + 占位符校验 + 一次重试）
- **Added** 统一 resolver 纯函数（`resolveTranslationView` stream/overlay 判定）
- **Changed** `tweet.entities` 回归原文只读；手动翻译只存 `TranslationStore`
- **Added** materialize / strip translations 纯函数
- **Fixed** 翻译完成后主动刷新 local cache
- **Added** 测试：`resolveEntities`、`translationMaterialize`、服务层单测

### 验证体系（2026-07-04）

- **Added** `verify/` 五层闭环：AC（25 条）→ Fixtures（7 个）→ SDK（AnonTweetClient + TestServer）→ CLI（`bun verify`）→ CI（待办）
- **Added** Postmortem 8 份报告（107 fix commits → 8 根因集群）
