# 测试验证基建重构 —— 审计报告与行动计划（已归档）

> **状态**: ✅ 已完成（Phase A~E 全部落地，2026-08-14；2026-08 文档整理时归档）
> **日期**: 2026-08-14
> **关联**: [ADR-007](../planning/architecture.md#adr-007-verify-验收框架)（verify 验收框架）、[差距分析](verification-gap-analysis.md)、[Postmortem 索引](../postmortem/README.md)
> **决策前提**: 保留「验证先行 / AC 可追溯 / AI 自验证闭环」理念，把**自研执行引擎替换为标准 Vitest 三层架构**，消除双轨重复。

---

## 1. 背景与动机

ADR-007 建立「AI 实现 → 自验证 → Pass/Fail 反馈」闭环的决策是对的：这个项目由 AI 主导开发，需要零配置、输出即反馈的验证入口；postmortem #001/#007 的教训（解析器零测试、新功能无验收清单）证明「验证先行」不可放弃。

但 **verify/ 的实现层是重复造轮子**。自研 `VerifyRunner`（注册 → 过滤 → 执行 → 格式化）约 200 行，等价于 Vitest 的 describe/it/expect/reporter；57 条 AC 中**没有任何一条依赖自研框架才成立**。双轨制（`test/` 的 Vitest + `verify/` 自研 runner）导致：

1. **同一逻辑两处断言**：translation 实体保护（`test/entitytParser.spec.ts` ↔ `AC-TRANS-001~004`）、vision 纯函数（`test/vision.spec.ts` ↔ `AC-VISION-001~012`）双实现，改一处漏一处
2. **弱断言冒充验收**：AC-TRANS-005/006/007 只做 `typeof fn === 'function'` import 存在性检查，真实行为测试在 `test/` 里——AC 名存实亡
3. **重复样板不可维护**：30+ 处 try/catch → StepResult 样板、6 处重复 `readProjectFile`、3 种不兼容的 `loadFixture` 解包规则
4. **死抽象**：`Verifier.canRun` 在 8 个 verifier 全部恒返回 null，SKIP 全在 `run()` 内手动造——接口退化

**目标**：把「AC 语义层」（编号可追溯、fixture 回归、SKIP 环境矩阵、AI 友好输出）保留为**约定与命名规范**，执行引擎换成 Vitest 标准三层架构（单元 / 集成 / 验收），一次迁移同时解决去重、补缺（parseTweet 零覆盖）、可维护性。

---

## 2. 现状审计（2026-08-14）

### 2.1 `verify/` 套件 —— 57 条 AC / 8 个 verifier

| 维度        | 事实                                                                                                                                                                                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC 总数     | 57（tweet 8 / translation 7 / ig 9 / screenshot 4 / media 6 / postmortem 7 / ci 4 / vision 12）                                                                                                                                                                                                   |
| 断言风格    | 全部手写 `if` + PASS/FAIL 字符串 + 手动计时（`performance.now()`），无 matcher、无 diff、无 watch                                                                                                                                                                                                 |
| 死接口      | `canRun(ctx)` 8 个 verifier 恒返回 null（`verify/framework/types.ts:84`）；SKIP 在 `run()` 内手造（ig/screenshot/media 各一份）                                                                                                                                                                   |
| 重复 helper | `readProjectFile`/`projectPath` 6 处（ig:34 / screenshot:27 / media:40 / postmortem:26 / vision:46 / ci `workflowPath`）；`loadFixture` 4 处且解包规则 3 种（translation 不解包 / ig `.data??parsed` / vision `.data??items??parsed`）；`IG_FIXTURE_SHORTCODE` 常量 2 处（ig:19 / screenshot:22） |
| 样板重复    | try/catch → StepResult + `err instanceof Error ? err.message : String(err)` 全目录 >30 处                                                                                                                                                                                                         |
| 弱断言      | AC-TRANS-005/006/007 仅为 import 存在性检查；vision 用 `split('async function handleSave')` 字符串切片（vision:363）；多个 source scan 用 substring 匹配（screenshot:163,190 / media:239,274 / ig:24,329），格式/改名即误报                                                                       |
| 文档滞后    | `verify/README.md` 目录表漏 vision 模块；计数过时（log.md「17 PASS」「IG 9/9」为旧值）；AC-translation.md:28-33 仍用旧字段 `translation`（实现已用 `aiTranslation` v2.1）                                                                                                                         |
| SDK 死代码  | `TweetListResponse`（sdk/types.ts:24）无消费点；`TweetApi/IGApi/AIApi` 接口与 `api-client.ts` 方法签名双份维护；`TestServer.waitForReady` 与 `client.health()` 两套探活                                                                                                                           |

### 2.2 `test/` 单元测试 —— 124 个 `it` / 15 文件

| 维度           | 事实                                                                                                                                                                                                                                                                                                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 断言质量       | 标准 Vitest（`expect().toBe/toContain/toEqual`），明显优于 verify 手写风格                                                                                                                                                                                                                                                                                                             |
| 覆盖缺口（P0） | **`parseTweet.ts` 零覆盖**（postmortem #001 高危表榜首、10 次 fix 的文件！）；SmartPool、三层缓存（memory/fs/pg）、IG 全链（igDownloader/getIGPost/translateIGCaption）、screenshot、DB/Drizzle、rettiwt-api 70+ 文件均无单测                                                                                                                                                          |
| 与 verify 重叠 | vision（`test/vision.spec.ts` 57 it ↔ AC-VISION-001~~012）、translation（entitytParser/resolveTranslationView/translationMaterialize ↔ AC-TRANS-001~~007）同一逻辑双实现                                                                                                                                                                                                               |
| 隔离性风险     | `test/fetchTweet.ts` 是**真网络脚本**混入测试目录（会发真实 API 请求）；`api.vision.spec.ts`、`vision.spec.ts` 靠业务「无 photo 短路」而非 mock 保隔离；`env.server.spec.ts` 直接写全局 `process.env`                                                                                                                                                                                  |
| 代码气味       | `(res as any)?.data ?? res` 在 3 个 API spec 重复（掩盖 action 返回形状不统一：`getTweet.ts:18` data 包裹 vs `:127` 裸数组）；**私有工厂跨文件零复用**（`makeTweet` 在 getTweet.spec:5 与 resolveTranslationView.spec:5 各一份、`makeModelConfig` 在 provider-strategy.spec:5 一份）；大量 `as any` 逃生舱；`getTweet.spec` 只测理想路径，未覆盖 `getTweet.ts:10` 返回 `[]` 的错误分支 |
| 配置           | `vitest.config.ts` 的 `maxWorkers:2` + `testTimeout:30s` 是为缓解「超大依赖图冷加载 13.4s 失败集漂移」的历史调参（2026-08-14 已修复），三层拆分后可逐层收紧                                                                                                                                                                                                                            |

### 2.3 基建

- `package.json`：`test` = `vitest run`；`verify` 走 `bun run verify/index.ts`（自研 CLI）
- `lefthook.yml` pre-push：`typecheck + lint + test + verify` 四连
- `.github/workflows/verify.yml`：与 pre-push 相同四连（push + PR 触发，paths 过滤）
- `docs/engineering/code-style.md:89-94`：测试规范写「Vitest + `*.spec.ts` 于 `test/` + 子系统级用 `verify/`」——重构后需改写

### 2.4 问题清单分级

| 级别 | 问题                                                                                                                            |
| ---- | ------------------------------------------------------------------------------------------------------------------------------- |
| P0   | `parseTweet.ts` 零测试（高危榜首）；`fetchTweet.ts` 真网络脚本混入测试目录；五大子系统（IG/SmartPool/缓存/screenshot/DB）无单测 |
| P1   | test↔verify 双实现重复；`canRun` 死接口 + 30+ 样板；AC 弱断言（存在性检查冒充行为验收）；静态 substring 扫描脆弱                |
| P2   | SDK 死类型/双份接口；fixture loader 三套解包；AC/README/log 文档计数滞后；`as any` 逃生舱；`env.server.spec` 全局污染           |

---

## 3. 业界参考架构

### 3.1 测试金字塔（Test Pyramid）

业界共识（[Feature-Sliced Design 前端测试策略](https://feature-sliced.design/zh/blog/frontend-testing-strategy)、[Modern Web Apps Test Strategy 2025](https://www.anshgupta.in/blog/test-strategy-for-modern-web-apps-2025)）：**单元测试（多、快、纯）→ 集成测试（少、慢、跨模块）→ E2E（极少、最慢）**。数量递减、价值分层、反馈速度与覆盖率成反比。

本项目现状是「单元（124 it）+ 自研混合验证（57 AC）」，缺少清晰的**集成层**（BFF API 端点测试被塞进 verify 的 `--server` 模式）和**明确的 E2E/截图视觉回归层**（Storybook + 手动）。三层 Vitest projects 正是金字塔的标准落地。

### 3.2 Vitest Projects / Workspace 多项目分层

Vitest 官方支持在单配置内定义多项目（[Vitest Projects](https://main.vitest.dev/guide/projects.html)、[Workspace](https://v2.vitest.dev/guide/workspace)）：每个项目独立 `include`/`environment`/`timeout`/`setupFiles`，一次 `vitest run` 按项目顺序或并行执行。社区成熟做法（如 [openclaw-projects 的 unit/integration 拆分](https://github.com/troykelly/openclaw-projects/pull/1297)）：unit 项目快跑、integration 项目串行 + 服务器生命周期、收口到同一命令。

### 3.3 AI 开发代理的反馈闭环（本项目的核心场景）

业界对 AI 写代码的验证共识：**测试是 AI 的唯一可靠反馈源**，且反馈必须即时、结构化、可定位（[vibe-loop](https://www.npmjs.com/package/vibe-loop)、[proof-loop —— AC + 独立 verifier 角色 + evidence-backed done](https://github.com/LeoStehlik/proof-loop)、[Spotify Background Coding Agents 强反馈循环](https://www.zenml.io/llmops-database/background-coding-agents-with-strong-feedback-loops-for-large-scale-code-transformations)）。关键要点：

- **验收标准必须可执行**：AC 文档里不可自动断言的句子毫无价值（[spec-kit-bdd 的 ATDD 思路](https://github.com/RSginer/spec-kit-bdd)）
- **反馈通道要薄**：AI 需要 `一条命令 → ✓/✗ → 错误定位`，不需要理解框架配置
- **不能由 AI 自判「通过」**：绿/红由确定性测试决定，不是模型自评

这验证了 ADR-007 的理念没有错，也解释了为什么 verify 的 CLI 形态值得保留——但执行引擎不必自研。

### 3.4 快照 / Fixture 漂移管理

[Fixture/快照漂移](https://mergify.com/blog/jest-snapshot-drift-shared-state)是回归测试的主要腐烂源：fixture 由真实抓取数据固化，上游格式变了测试要么误报要么静默失效。业界对策：fixture 带元信息（来源/日期）、统一 loader、快照更新走显式流程（vitest `-u`）、CI 强制无漂移。

### 3.5 借鉴结论

| 借鉴    | 具体做法                                                                                                                                |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| ✅ 保留 | 测试金字塔三层布局；Vitest 为唯一执行引擎；AC 编号可追溯；fixture 回归；SKIP 环境矩阵；AI 友好 CLI 入口                                 |
| ✅ 引入 | `test.projects` 三层配置；`globalSetup` 管理 TestServer；`-t` 过滤 = `--ac`；`describe.skipIf` = `canRun`；vitest `-u` 显式更新 fixture |
| ❌ 放弃 | 自研 runner/Verifier 接口；手写 PASS/FAIL 字符串；substring 源码扫描当测试（改为可定位断言）；存在性检查冒充 AC                         |

---

## 4. 目标架构

### 4.1 三层测试布局（Vitest Projects）

```
test/
├── unit/                     # L1 单元层（纯函数/解析器，node 环境，快）
│   ├── entitytParser.spec.ts      # ← 现有 15 个 spec 迁入
│   ├── parseTweet.spec.ts         # ← P0 缺口补齐（AC-TEST-006）
│   └── ...
├── integration/              # L2 集成层（BFF API 端点，globalSetup 起 TestServer）
│   ├── api.tweet.spec.ts          # ← 原 AC-TWEET-005/006/008 + test/api.tweet-get.spec
│   ├── api.ig.spec.ts             # ← 原 AC-IG-007/008/009
│   ├── api.media.spec.ts          # ← 原 AC-MEDIA-001~003（含本地像素服务器）
│   └── api.screenshot.spec.ts     # ← 原 AC-SHOT-001/002
├── acceptance/               # L3 验收层（AC 语义层：fixture 回归 + 仓库级静态检查）
│   ├── ac-tweet.spec.ts           # ← AC-TWEET-001~004/007（fixture 回归）
│   ├── ac-postmortem.spec.ts      # ← AC-PM-001~007（静态完整性）
│   ├── ac-ci.spec.ts              # ← AC-CI-001~004
│   └── ...
├── helpers/                  # 共享工具（统一一处，消灭 6 份重复）
│   ├── load-fixture.ts            # 统一 fixture 加载（单一解包规则）
│   ├── read-project-file.ts       # 统一源码扫描
│   └── ...
├── fixtures/                 # ← 现有 verify/fixtures 迁入（tweet/ig/translation/vision）
└── support/
    ├── api-client.ts              # ← verify/sdk/api-client.ts（AnonTweetClient，保留）
    └── test-server.ts             # ← verify/sdk/test-server.ts（TestServer，保留）
```

- **vitest.config.ts** 用 `test.projects` 定义三项目：unit（离线、快）、acceptance（离线、静态）、integration（`globalSetup` 起 TestServer、串行、30s 超时）
- **AC 编号 = test 名**：`it('AC-TWEET-001: normal tweet parsing', ...)`；`--ac` 等价物为 `vitest run -t 'AC-TWEET-001'`
- **SKIP = skipIf**：`describe.skipIf(!env.hasTweetKeys)`；环境探测收敛到 `test/helpers/env.ts`（替代 `VerifyContext.env`）
- **`verify/` 目录瘦身**：删除 `framework/`（runner/types）；`index.ts` 改为薄 CLI（解析参数 → 调 vitest + 自定义 reporter 保持 ✓/✗ 输出）；`sdk/`、`fixtures/`、`acceptance-criteria/` 迁移或保留引用

### 4.2 保留资产 vs 删除死代码

| 保留（是好资产）                          | 删除 / 替换                                      |
| ----------------------------------------- | ------------------------------------------------ |
| `AnonTweetClient`（api-client.ts）        | `VerifyRunner`、`Verifier` 接口、`VerifyContext` |
| `TestServer`（端口复用/隔离/进程树清理）  | `canRun` 死接口（→ `skipIf`）                    |
| fixtures（真实抓取快照）                  | 30+ 处 try/catch → StepResult 样板               |
| AC 文档（契约来源）                       | 6 处重复 `readProjectFile`、4 处 `loadFixture`   |
| AC 编号命名约定                           | `TweetListResponse` 死类型、SDK 双份接口         |
| `scripts/postmortem-check.ts`（独立资产） | substring 源码扫描（→ 可定位断言）               |

### 4.3 去重原则（用户核心诉求）

> **每个行为恰好一个测试文件。** AC 与 spec 冲突时按以下规则裁决：

1. AC 有真实行为断言且无对应 spec → 迁为 acceptance 测试，保留 AC 编号
2. AC 与 spec 重复（vision/translation）→ **spec 为准**，AC 侧删除，spec 的 `it` 名加 AC 编号标注以维持可追溯
3. AC 仅为存在性检查（AC-TRANS-005/006/007）→ 直接删除，行为测试已由 `resolveTranslationView.spec` / `translationMaterialize.spec` 覆盖
4. 验收后运行 `verify/scripts/dedupe-check`（或 grep 断言）验证：同一行为模式在 test/ 下只出现一次

### 4.4 CLI / CI / Hooks 整合

```bash
bun run test              # unit + acceptance（离线全绿，~秒级）
bun run test:integration  # integration（globalSetup 起 TestServer）
bun run verify            # 全三层 = vitest run（保持 ✓/✗ 输出）
bun run verify --ac AC-TWEET-001   # = vitest run -t 'AC-TWEET-001'
```

- pre-push / CI 四连不变，`verify` 底层换 Vitest 引擎
- `--server` 语义由 integration 项目 globalSetup 接管（默认总是可用，不再依赖手动标志）

---

## 5. 分阶段行动计划

> 每阶段独立可合入、独立可验证；遵循「文档先行 → 代码 → 验收回填」。迁移期新旧并行，**双跑绿灯后才切**。

### Phase A — Vitest 三层骨架 + 共享工具（~0.5 天）✅ 已完成（2026-08-14）

**内容**：

1. `vitest.config.ts` 改 `test.projects` 三项目（unit / integration / acceptance）
2. 建 `test/helpers/`（`load-fixture.ts` 单一解包规则、`read-project-file.ts`、`env.ts` 环境探测）
3. 迁 `verify/sdk/*` → `test/support/`（AnonTweetClient / TestServer 原样迁移，删死类型）
4. 迁 `verify/fixtures/*` → `test/fixtures/`（统一 loader 验证可读）
5. `scripts/verify-runner.ts`（或薄 `verify/index.ts` 改造）：AC 过滤、✓/✗ reporter、exit code（此项并入 Phase E 收口）

**执行记录**：

- 14 个 spec 全部 `git mv` 到 `test/unit/`；`test/fetchTweet.ts`（真网络脚本）已删除
- `test/helpers/load-fixture.ts`（统一解包 `data ?? testCases ?? parsed`）+ `env.ts` 环境探测
- `verify/sdk/{api-client,test-server,types}.ts` → `test/support/`（删 `TweetListResponse` 及 TweetApi/IGApi/AIApi/UserApi/ServerProcess 双份接口死类型）
- fixtures **先复制**到 `test/fixtures/`（verify 双跑期间保持可用，Phase E 收口为 git mv 删除旧侧）
- **踩坑（projects 继承陷阱）**：vitest projects 模式下顶层 `resolve.alias`/`plugins` 与 `test.testTimeout`/`maxWorkers` **均不被项目继承**——遗漏 testTimeout 会退回默认 5000ms，冷加载路径偶发超时（api.vision.spec 全量挂、单跑过）。解法：`sharedProjectConfig`（resolve+plugins）与 `sharedProjectTest`（timeout/maxWorkers/clearMocks）展开到每个项目

**验收**：`bun run verify` 等价输出旧 CLI（57 AC 对应测试全部绿）；`bun run test` 不受影响
**实际结果**：`bun run test` 连续 2 次全量 **129/129 全绿**（unit 项目）；typecheck ✅；lint 0 error；旧 `bun run verify/index.ts` 未受影响（双跑绿）
**commit 拆分**：`chore(test):` vitest projects 配置 + unit 迁移 + helpers/support/fixtures → `docs:` Phase A 验收回填

### Phase B — 单元/验收层去重迁移（~1.5 天）✅ 已完成（2026-08-14）

**内容**：

1. translation：AC-TRANS-001~004 并入 `entitytParser.spec.ts`（加 AC 编号标注）；005/006/007 删除
2. tweet 离线：AC-TWEET-001~004/007 迁 `test/acceptance/ac-tweet.spec.ts`（fixture 回归，保留编号）；`getTweet.spec` 补错误分支（getter 返回 `[]` / 无 quoted 的情况，`getTweet.ts:10`）
3. vision：AC-VISION 行为断言并入 `vision.spec.ts`（57 it 已覆盖，AC 编号标注已存在），删除 vision.verifier 的重复实现，保留其 source scan 型 AC 于 acceptance（拆分 627 行大文件延后为可选优化）
4. ig 离线：AC-IG-001~006 迁 acceptance（fixture + 纯函数扫描）
5. **P0 补缺**：`test/unit/parseTweet.spec.ts`（postmortem #001 高危榜首；手写 RawTweet 工厂，16 用例）

**实际结果**：`bun run test` **161/161 全绿**；parseTweet 16 用例（>10 达标）；eslint 加 `test/prefer-lowercase-title` 的 `allowedPrefixes: ['AC-']` 豁免（AC 编号大写命名契约）
**commit 拆分**：`test(parser):` → `test(translation):` → `test(acceptance):`（AC-TWEET/AC-IG + getTweet 错误分支）

### Phase C — 集成层迁移（~1 天）✅ 已完成（2026-08-14）

**内容**：

1. `test/integration/api.tweet.spec.ts`：AC-TWEET-005/006/008（含 GET/POST 一致性）
2. `test/integration/api.ig.spec.ts`：AC-IG-007/008/009（INS_COOKIES 有则真跑，无则 `skipIf`）
3. `test/integration/api.media.spec.ts`：AC-MEDIA-001~003（本地像素服务器确定性方案原样保留）
4. `test/integration/api.screenshot.spec.ts`：AC-SHOT-001/002
5. `globalSetup` 接 TestServer（复用端口/隔离 key/进程树清理），integration 项目串行

**实际结果**：`bun run test:integration` **7 passed / 4 skipped**（隔离环境预期 SKIP）；服务器自动启停（~27s）
**踩坑记录**：① vitest 4 的 setupFiles **不执行具名 `setup`/`teardown` 导出** → 改用 `globalSetup`（setup/teardown 契约明确）；② globalSetup 与测试不同进程，globalThis 不共享 → URL 经 `process.env.TEST_BASE_URL` 传递 + `getClient()` 惰性创建；③ 像素服务器用 `Bun.serve` 在 vitest node 环境报 `Bun is not defined` → 改 `node:http`
**commit 拆分**：`test(integration):` 集成层（globalSetup + 4 个 API spec + scripts）

### Phase D — 静态/仓库级检查迁移（~0.5 天）✅ 已完成（2026-08-14）

**内容**：

1. AC-PM-001~007 → `test/acceptance/ac-postmortem.spec.ts`（报告完整性 + `postmortem-check.ts` 冒烟）
2. AC-CI-001~004 → `test/acceptance/ac-ci.spec.ts`（workflow 文件检查）
3. AC-SHOT-003/004、AC-MEDIA-004~006、AC-VISION-008/009/010 source scan → 改造为可定位断言（读文件 + `expect` 具体符号）
4. 静态扫描统一走 `test/helpers/read-project-file.ts`

**实际结果**：`bun run test` **177/177 全绿**（21 files）；AC-VISION-008/009/010 静态部分补入 `ac-vision.spec.ts`（行为部分已在 vision.spec）
**commit 拆分**：`test(acceptance):` 静态层迁移

### Phase E — 框架删除 + 收口（~0.5 天）✅ 已完成（2026-08-14）

**内容**：

1. 删除 `verify/framework/`、`verify/modules/`、`verify/sdk/`、`verify/fixtures/`（已迁 test/）
2. `verify/index.ts` 改为薄 CLI（参数映射：`--ac`/`--module` → vitest `-t` 过滤；`--server` 兼容 no-op；执行引擎 = `vitest run`）
3. `package.json` scripts 收口：`test` = unit+acceptance、`test:integration` 独立、`test:watch` 同 test；`lefthook.yml` + `verify.yml` 命令不变（薄 CLI 兼容）
4. `verify/README.md` 改写为「验证体系总览」；`docs/engineering/code-style.md` 测试规范改写
5. 全量绿灯确认

**实际结果**：`bun run verify/index.ts --exit-on-fail` **26 files / 187 passed / 4 skipped，exit 0**（含 integration 服务器自动启停，~43s）；`--ac AC-TWEET-001` 精确过滤 1 条
**commit 拆分**：`refactor(verify):` 删框架 + 薄 CLI → `docs:` README/规范/计划回填

---

## 6. 新验收标准（AC-TEST-001 ~ 008）

| AC ID       | 描述            | Pass 条件                                                                                         |
| ----------- | --------------- | ------------------------------------------------------------------------------------------------- |
| AC-TEST-001 | 单命令全分层    | `bun run verify` 一次跑 unit + acceptance + integration，输出 ✓/✗ 与汇总                          |
| AC-TEST-002 | AC 可追溯       | `bun run verify --ac AC-TWEET-001`（= `-t` 过滤）只跑该 AC 且命名含编号                           |
| AC-TEST-003 | 去重生效        | 同一行为在 `test/` 下仅一个断言点（vision/translation 无双实现）                                  |
| AC-TEST-004 | 死代码清零      | `git grep 'class VerifyRunner'` / `canRun` 无命中；`framework/` 目录不存在                        |
| AC-TEST-005 | 离线确定性      | 无任何 env key 时 `bun run verify` 全绿（外部依赖 SKIP，无网络请求）                              |
| AC-TEST-006 | parseTweet 覆盖 | `test/unit/parseTweet.spec.ts` ≥10 用例覆盖 note_tweet/quoted/media/card/poll 变体                |
| AC-TEST-007 | 文档同步        | `verify/README.md` AC 计数 = 实际 `-t` 命中的 AC 编号集合                                         |
| AC-TEST-008 | 样板收敛        | `git grep -c 'instanceof Error ? err.message' test/` ≤ support 层 1 处（错误归一化收敛为 helper） |

---

## 7. 风险与对策

| 风险            | 对策                                                                                                                                                      |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 迁移期回归      | 新旧并行，每 Phase 双跑绿灯（旧 `bun run verify/index.ts` + 新 `vitest run`）后才切                                                                       |
| fixture 漂移    | loader 统一 + 元信息（来源/日期）+ vitest `-u` 显式更新 + CI 无漂移检查（对齐 [快照漂移实践](https://mergify.com/blog/jest-snapshot-drift-shared-state)） |
| 集成层慢/脆     | integration 项目独立配置（串行、30s 超时、`maxWorkers:1`），不进默认 `bun run test`                                                                       |
| AI 反馈通道退化 | 保留薄 CLI + ✓/✗ reporter；AC 编号进 test 名，AI 提示语（CLAUDE.md）同步更新                                                                              |
| `--server` 兼容 | globalSetup 接管生命周期（复用/隔离/清理逻辑原样保留在 `test-server.ts`）                                                                                 |

---

## 8. 参考链接

- [Vitest Projects（官方文档）](https://main.vitest.dev/guide/projects.html) / [Workspace](https://v2.vitest.dev/guide/workspace)
- [前端测试策略（Feature-Sliced Design）](https://feature-sliced.design/zh/blog/frontend-testing-strategy)
- [Test Strategy for Modern Web Apps (2025)](https://www.anshgupta.in/blog/test-strategy-for-modern-web-apps-2025)
- [proof-loop —— AI 代理验收协议（AC + verifier 角色）](https://github.com/LeoStehlik/proof-loop)
- [vibe-loop —— AI 反馈循环工具](https://www.npmjs.com/package/vibe-loop)
- [Spotify: Background Coding Agents with Strong Feedback Loops](https://www.zenml.io/llmops-database/background-coding-agents-with-strong-feedback-loops-for-large-scale-code-transformations)
- [Jest Snapshot Drift —— fixture 漂移风险](https://mergify.com/blog/jest-snapshot-drift-shared-state)
- [spec-kit-bdd —— ATDD/BDD 验收覆盖](https://github.com/RSginer/spec-kit-bdd)

---

_本文件为测试基建重构的工作底稿，实际执行进度记录于 `verify/log.md` 与 `docs/development-log/`。_
