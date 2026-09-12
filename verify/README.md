# Verification Suite

> AI 自验证体系 — AC 验收标准 + Vitest 三层测试架构
> 项目：[AnonTweet](..)
> 版本：0.3.0（2026-09-12 验证诚信修复 F1~~F13：见 [backlog](../docs/planning/backlog.md) /
> [review](../docs/reviews/review-2026-09-11-test-suite-honesty.md)）
> 历史建设日志：[log.md](log.md)（2026-07~~08，勿当现行用法）

---

## 验证理念

「验证先行」：每个功能先有 AC（验收标准），再写测试，最后实现。

**AC 编号 ↔ 测试名 1:1**：测试以 `it('AC-TWEET-001: …')` / `describe('AC-XXX-001: …')`
命名，编号是精确定位某条验收的钥匙。该契约由
[`test/acceptance/ac-contract.spec.ts`](../test/acceptance/ac-contract.spec.ts) **元测试强制**——
`verify/acceptance-criteria/*.md` 的编号集合与测试名集合的任一方向差集非空即红（F4）。

**「全绿」的真实含义（重要）**：绿 = **没有断言失败**，不等于**每个功能的行为都被验证**。
无外部凭据时相关集成 AC 会 `skipIf`；skip 不计入证据。判断某 AC 是否携带信号，请读它的
「验证方法」是**行为断言**还是**源码扫描（辅助检查）**——AC 文档已如实标注。
`--module` / `--ac` 匹配不到任何可执行用例时，CLI **非零退出**（F2，防「空跑报绿」）。

执行引擎为 [Vitest](https://vitest.dev) 三层架构（见 [docs/archive/testing-infra-refactor.md](../docs/archive/testing-infra-refactor.md)）：

```
test/
├── unit/        # L1 纯函数/解析器单测（parseTweet/entitytParser/vision/providers...）
├── acceptance/  # L3 AC 语义层：fixture 回归 + 仓库级检查 + ac-contract 契约元测试
├── integration/ # L2 BFF API 集成（globalSetup 自动起 TestServer：tweet/ig/media/screenshot/dev）
├── helpers/     # 共享工具（load-fixture / read-project-file / pixel-server / env / test-context）
├── fixtures/    # 真实抓取快照（tweets ×3 / ig-posts / translations / vision）
└── support/     # AnonTweetClient + TestServer（原 verify/sdk 迁移）
```

## 快速开始

```bash
bun run test                   # unit + acceptance（离线，~10s，无需服务器/key）
bun run test:integration       # 集成层（自动起 TestServer，外部 key 缺省 SKIP）
bun run verify/index.ts        # 全三层（= vitest run，含 integration）
bun run verify/index.ts --ac AC-TWEET-001   # 单个 AC
bun run verify/index.ts --module tweet      # 子系统（映射到 AC 编号前缀，见下）
bun run verify/index.ts --exit-on-fail      # CI 模式（失败 exit 1）
```

### `--module` 与 `--ac`

`--module` 是**白名单**，启动期校验；未知模块直接 `exit 1`。映射到 AC 编号前缀
（`translation→AC-TRANS`、`screenshot→AC-(SHOT|PERF)`、`postmortem→AC-PM` 等，见
`verify/index.ts` 的 `MODULE_PATTERNS`）：

`build, card, ci, decouple, dev, ig, media, obs, postmortem, pwa, resolver, screenshot,
sec, test, translation, tweet, ui, vision`

**零匹配守卫**：`--ac` / `--module` 若一条用例都没执行（0 passed / 0 failed），即使 vitest
本身 `exit 0`，CLI 也会以非零退出并说明原因——不再出现「命令成功但什么都没跑」。

`--server` / `--server-port` 为 **deprecated no-op**（集成服务器由 globalSetup 管理），保留仅为兼容旧命令。

### SKIP 语义

无 `TWEET_KEYS` / `INS_COOKIES` 等外部凭据时，相关集成 AC 通过 `describe.skipIf` 自动跳过。
有凭据时显式 `VERIFY_ISOLATE=false bun run test:integration` 激活真实链路。

集成层并非「裸跑全绿」：即使无凭据也有**确定性可失败**的正例/负例——
AC-DEV-001（dev server 健康）、AC-IG-009（缺 cookies → 500）、AC-MEDIA-001/002/003
（本地像素服务器上游 + 400/403 负例）、AC-SHOT-001/002（内容特征断言）。凭据缺失只影响
**真实上游**路径（AC-TWEET-005/008/010、AC-IG-007/008），不是「整层不跑」。

## 验收标准（AC）

| 文档                                                       | 覆盖                                           |
| ---------------------------------------------------------- | ---------------------------------------------- |
| [AC-tweet.md](acceptance-criteria/AC-tweet.md)             | AC-TWEET-001~010（解析 + API + 搜索）          |
| [AC-translation.md](acceptance-criteria/AC-translation.md) | AC-TRANS-001~007（占位符管线 + 视图/Provider） |
| [AC-ig.md](acceptance-criteria/AC-ig.md)                   | AC-IG-001~009（IG 集成）                       |
| [AC-screenshot.md](acceptance-criteria/AC-screenshot.md)   | AC-SHOT-001~004 + AC-PERF-001（截图/渲染基线） |
| [AC-media.md](acceptance-criteria/AC-media.md)             | AC-MEDIA-001~006（媒体代理）                   |
| [AC-postmortem.md](acceptance-criteria/AC-postmortem.md)   | AC-PM-001~007（预发布检查）                    |
| [AC-ci.md](acceptance-criteria/AC-ci.md)                   | AC-CI-001~004（CI workflow，解析 run 步骤）    |
| [AC-build.md](acceptance-criteria/AC-build.md)             | AC-BUILD-001~003（Babel/.tsx 构建管线）        |
| [AC-card.md](acceptance-criteria/AC-card.md)               | AC-CARD-001~009（jetfuel/trending 卡片）       |
| [AC-dev.md](acceptance-criteria/AC-dev.md)                 | AC-DEV-001~002（dev server 模式固定）          |
| [AC-test.md](acceptance-criteria/AC-test.md)               | AC-TEST-006（parseTweet 全变体）               |
| [AC-llms.md](acceptance-criteria/AC-llms.md)               | AC-LLMS-001~002（llms.txt / openapi.json）     |
| [AC-vision.md](acceptance-criteria/AC-vision.md)           | AC-VISION-001~012（AI 视觉）                   |
| [AC-resolver.md](acceptance-criteria/AC-resolver.md)       | AC-RESOLVER-001（决策链收敛）                  |
| [AC-decouple.md](acceptance-criteria/AC-decouple.md)       | AC-DECOUPLE-001~002（GET 解耦 + AI 超时）      |
| [AC-sec.md](acceptance-criteria/AC-sec.md)                 | AC-SEC-001（baseUrl 白名单，可选加固）         |
| [AC-obs.md](acceptance-criteria/AC-obs.md)                 | AC-OBS-001（可观测性结构化日志）               |
| [AC-pwa.md](acceptance-criteria/AC-pwa.md)                 | AC-PWA-001~008（PWA 安装壳 + Web Share）       |
| [AC-ui.md](acceptance-criteria/AC-ui.md)                   | AC-UI-VISION-001 / AC-UI-A11Y-001（Storybook） |

## 诚实边界（已知限制）

- **源码扫描型 AC** 只证明「结构与文案如预期」，不证明运行时行为。这类条目标注为
  「静态检查 / 辅助检查」，其行为面另有测试（如 AC-SEC-001 的 P1 白名单语义由
  `test/unit/ai-base-url.spec.ts` 覆盖）。关键路径正逐步改为行为测试（F6）。
- **`bun run test` 不含 integration**，仅 unit + acceptance；全三层用 `bun run verify/index.ts`。
- **Storybook 浏览器测试**（`bun run test:storybook`，需 chromium）是独立视觉基线，
  不进 `verify` / pre-push / CI，避免依赖浏览器二进制下载。
- **ac-contract 元测试只校验「编号在测试名里出现」**，不校验该测试是否真的断言了对应语义；
  语义质量仍需人工评审（这正是 2026-09-11 审查的教训）。

## 目录结构

```
verify/
├── index.ts                    ← 薄 CLI（参数映射 + 零匹配守卫 + 模块白名单）
├── README.md                   ← 本文件
├── log.md                      ← 建设日志（历史）
└── acceptance-criteria/        ← AC 契约文档（测试实现位于 test/ 三层）
```

> 🔄 迁移记录（2026-08-14）：自研 VerifyRunner/Verifier 框架已删除，57 条 AC 全部迁入
> `test/` 三层；`verify/sdk` → `test/support`、`verify/fixtures` → `test/fixtures`。
> 2026-09-12：验证诚信修复 F1~F13（dev server 崩溃、空跑报绿、死断言、注释冒充步骤、
> 静态扫描冒充行为、fixture 自证、AC 命名断链、断言 lint、readme 失实）。
