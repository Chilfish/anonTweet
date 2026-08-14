# Verification Suite

> AI 自验证 CLI 工具 + Fixture 库 + API 测试 SDK
> 项目：[AnonTweet](..)
> 版本：0.1.0

> 🔄 **重构进行中（2026-08-14 起）**：自研验证引擎（VerifyRunner）将被替换为标准 Vitest 三层架构
> （unit / integration / acceptance），AC 编号保留为 test 名约定，SDK / fixtures / AC 文档保留。
> 迁移期间新旧并行、双跑绿灯后才切。详见 [docs/planning/testing-infra-refactor.md](../docs/planning/testing-infra-refactor.md)。

---

## 快速开始

```bash
# 运行所有离线验证（无需服务器、无需 API key）
bun run verify/index.ts

# 运行特定模块
bun run verify/index.ts --module tweet
bun run verify/index.ts --module translation
bun run verify/index.ts --module ig

# 运行单个 AC
bun run verify/index.ts --ac AC-TWEET-001

# verbose 模式
bun run verify/index.ts --verbose

# CI 模式（失败时 exit 1）
bun run verify/index.ts --exit-on-fail

# 自动启动测试服务器（默认 9081），运行集成 AC，结束后自动停止
bun run verify/index.ts --server
bun run verify/index.ts --server --server-port 9080  # 自定义端口；已有服务器则复用
```

---

## 目录结构

```
verify/
├── index.ts                    ← CLI 入口（bun verify）
├── README.md                   ← 本文件
├── log.md                      ← 建设日志
├── fixtures/                   ← S1：测试数据
│   ├── tweets/                 ← 3 个 EnrichedTweet JSON 快照
│   ├── ig-posts/               ← 1 个 IGPost JSON 快照
│   └── translations/           ← 3 组实体往返测试用例
├── sdk/                        ← S2：API 测试客户端
│   ├── api-client.ts           ← AnonTweetClient（程序化调用 API）
│   ├── test-server.ts          ← TestServer（服务器生命周期管理）
│   └── types.ts                ← 共享类型
├── framework/                  ← S3：验证框架
│   ├── types.ts                ← Verifier 接口 + StepResult + SuiteResult
│   └── runner.ts               ← VerifyRunner（执行 + 格式化输出）
├── modules/                    ← S3：按子系统的 Verifier
│   ├── tweet.verifier.ts       ← AC-TWEET-001 ~ 008
│   ├── translation.verifier.ts ← AC-TRANS-001 ~ 007
│   ├── ig.verifier.ts          ← AC-IG-001 ~ 009
│   ├── screenshot.verifier.ts  ← AC-SHOT-001 ~ 004
│   ├── media.verifier.ts       ← AC-MEDIA-001 ~ 006
│   ├── postmortem.verifier.ts  ← AC-PM-001 ~ 007
│   └── ci.verifier.ts          ← AC-CI-001 ~ 004
└── acceptance-criteria/        ← S4：验收标准文档
    ├── AC-tweet.md             ← 8 条 tweet AC
    ├── AC-translation.md       ← 7 条 translation AC
    ├── AC-ig.md                ← 9 条 IG AC
    ├── AC-screenshot.md        ← 4 条 screenshot AC
    ├── AC-media.md             ← 6 条 media AC
    ├── AC-postmortem.md        ← 7 条 postmortem AC
    └── AC-ci.md                ← 4 条 CI/CD AC
```

---

## 待实施

- [x] Screenshot Verifier（AC-SHOT-001 ~ 004）✅ 已完成（S6）
- [x] Media Proxy Verifier（Postmortem #005）✅ 已完成（S7，AC-MEDIA-001~006）
- [x] IG integration tests（需要 INS_COOKIES）✅ 已完成（S9，AC-IG-001~009）
- [x] `--server` 自动启动/停止服务器 ✅ 已完成（S8）
- [x] Postmortem 预发布自动化检查脚本 — S10 ✅ 已完成（AC-PM-001~007，7/7 PASS）
