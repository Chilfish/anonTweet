# Verification Suite

> AI 自验证体系 — AC 验收标准 + Vitest 三层测试架构
> 项目：[AnonTweet](..)
> 版本：0.2.0（2026-08-14 重构：自研引擎 → Vitest 三层）

---

## 验证理念

「验证先行」：每个功能先有 AC（验收标准），再写测试，最后实现。AC 编号即测试名
（`it('AC-TWEET-001: ...')`），文档 ↔ 代码 1:1 可追溯，AI 与人都可精确指定某条验收。

执行引擎为 [Vitest](https://vitest.dev) 三层架构（见 [docs/archive/testing-infra-refactor.md](../docs/archive/testing-infra-refactor.md)）：

```
test/
├── unit/        # L1 纯函数/解析器单测（parseTweet/entitytParser/vision/providers...）
├── acceptance/  # L3 AC 语义层：fixture 回归 + 仓库级静态检查（ac-tweet/ac-ig/ac-pm/ac-ci...）
├── integration/ # L2 BFF API 集成（globalSetup 自动起 TestServer：tweet/ig/media/screenshot）
├── helpers/     # 共享工具（load-fixture / read-project-file / pixel-server / env / test-context）
├── fixtures/    # 真实抓取快照（tweets ×3 / ig-posts / translations / vision）
└── support/     # AnonTweetClient + TestServer（原 verify/sdk 迁移）
```

## 快速开始

```bash
bun run test                   # unit + acceptance（离线全绿，~10s，无需服务器/key）
bun run test:integration       # 集成层（自动起 TestServer，外部 key 缺省 SKIP）
bun run verify/index.ts        # 全三层（= vitest run，含 integration）
bun run verify/index.ts --ac AC-TWEET-001   # 单个 AC
bun run verify/index.ts --module tweet      # 子系统（-t 'AC-TWEET' 跨项目过滤）
bun run verify/index.ts --exit-on-fail      # CI 模式（失败 exit 1）
```

SKIP 语义：无 `TWEET_KEYS` / `INS_COOKIES` 等外部凭据时，相关集成 AC 自动 `skipIf`，
裸跑永远绿；有凭据时显式 `VERIFY_ISOLATE=false bun run test:integration` 激活真实集成。

## 验收标准（AC）

| 文档                                                       | 覆盖                           |
| ---------------------------------------------------------- | ------------------------------ |
| [AC-tweet.md](acceptance-criteria/AC-tweet.md)             | AC-TWEET-001~008（解析 + API） |
| [AC-translation.md](acceptance-criteria/AC-translation.md) | AC-TRANS-001~007（占位符管线） |
| [AC-ig.md](acceptance-criteria/AC-ig.md)                   | AC-IG-001~009（IG 集成）       |
| [AC-screenshot.md](acceptance-criteria/AC-screenshot.md)   | AC-SHOT-001~004（截图）        |
| [AC-media.md](acceptance-criteria/AC-media.md)             | AC-MEDIA-001~006（媒体代理）   |
| [AC-postmortem.md](acceptance-criteria/AC-postmortem.md)   | AC-PM-001~007（预发布检查）    |
| [AC-ci.md](acceptance-criteria/AC-ci.md)                   | AC-CI-001~004（CI workflow）   |
| [AC-vision.md](acceptance-criteria/AC-vision.md)           | AC-VISION-001~012（AI 视觉）   |
| [AC-resolver.md](acceptance-criteria/AC-resolver.md)       | AC-RESOLVER-001（决策链收敛）  |

## 目录结构

```
verify/
├── index.ts                    ← 薄 CLI（参数映射到 vitest，兼容旧命令）
├── README.md                   ← 本文件
├── log.md                      ← 建设日志（历史）
└── acceptance-criteria/        ← AC 契约文档（测试实现位于 test/ 三层）
```

> 🔄 迁移记录（2026-08-14）：自研 VerifyRunner/Verifier 框架已删除，57 条 AC 全部迁入
> `test/` 三层；`verify/sdk` → `test/support`、`verify/fixtures` → `test/fixtures`。
