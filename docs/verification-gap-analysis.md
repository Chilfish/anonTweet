# 验证体系差距分析 & 下阶段路线图

> 对比参考：CLI/SDK 闭环验证方案（Remote Log Viewer）
> 分析日期：2026-07-04
> 状态：draft

---

## 1. 现状盘点

### 1.1 已有的测试基础设施

| 资产                                  | 覆盖范围                                                                                                                                | 说明                                     |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `test/` (11 个 Vitest 单元测试)       | AI 翻译、tweet API、entity parser、env server、getTweet、provider 策略、resolveEntities、resolveTranslationView、translationMaterialize | 全部为纯 Node 环境单元测试，不启动服务器 |
| `bun run typecheck`                   | 全量类型检查                                                                                                                            | TSC 类型验证                             |
| `bun run lint`                        | 全量 ESLint                                                                                                                             | `@antfu/eslint-config` + autofix         |
| Storybook (`app/stories/` 4 个 story) | IG Post Card、Settings、Tweet Components                                                                                                | 无交互测试，仅视觉 story                 |
| `postmortem/` (8 份报告)              | 历史根因记录                                                                                                                            | 手动流程，无自动化预发布检查             |
| `scripts/debug-entity-parser.ts`      | 零散调试脚本                                                                                                                            | 无结构化输出，无 CI 集成                 |

### 1.2 统计口径

```
测试文件：11
调试脚本：1
CI/CD workflow：0
CLI 验证工具：0
API/SDK 客户端封装：0
测试 fixture（JSON payload）：0
自动化验收标准（AC）：0 条
截图/视觉回归测试：0
Postmortem 预发布自动化检查：0
```

**核心结论：当前没有任何"AI 实现 → 自验证 → Pass/Fail 反馈"的闭环。所有验证依赖浏览器手动测试。**

---

## 2. 对照参考方案的缺失项

### 2.1 CLI 验证工具（🔴 缺失 — 最高优先级）

| 维度       | 参考方案                            | 本项目 |
| ---------- | ----------------------------------- | ------ |
| CLI 入口   | `script-ui log-viewer <subcommand>` | ❌ 无  |
| 子命令体系 | server / connect / verify / tail    | ❌ 无  |
| 验证套件   | `verify` 命令，16 步 Pass/Fail      | ❌ 无  |
| 单项验证   | `--test rotation` 等按模块筛选      | ❌ 无  |
| 格式化输出 | ✓/✗ + 耗时 + 汇总                   | ❌ 无  |

**本项目需要**：每个核心子系统（Tweet 解析、翻译管线、AI 翻译、IG 抓取、截图导出）都应有一个 `verify` 子命令。

### 2.2 Verifier 接口/框架（🔴 缺失）

参考方案定义了标准化的 `Verifier` 接口：

```typescript
interface Verifier {
  id: string
  name: string
  run(client: Client, env: TestEnvironment): Promise<VerificationResult[]>
}
```

本项目没有任何可插拔的验证框架。所有测试通过 Vitest 运行，但 Vitest 不如 CLI 更适合 AI 的自验证场景（AI 需要即时的、人类可读的 Pass/Fail 反馈，而非 vitest 的 pass/fail 计数）。

### 2.3 SDK/API 客户端（🔴 缺失）

参考方案封装了 `LogViewerClient` 用于程序化访问服务。本项目缺少对应的 API 客户端封装，导致：

- 无法在测试中脚本化地调用自己的 API 端点
- AI 必须打开浏览器才能验证功能
- CI 无法集成端到端 API 测试

### 2.4 测试 Fixture 库（🔴 缺失）

Postmortem #001 已明确提出需要 snapshot test：

> "Would need a snapshot test suite of known tweet payloads (`raw_in.json` → `expected_out.json`) run in CI"

当前仍为空白。需要覆盖：

- Twitter tweet payloads（note_tweet、quoted、media、player card、poll 等变体）
- Instagram post payloads（post、reel、story、carousel）
- 翻译输入/输出配对

### 2.5 CI/CD 集成（🔴 缺失）

项目根目录无 `.github/workflows/`，无任何自动化 CI pipeline。

参考方案有完整的 GitHub Actions 配置，按 `paths` 过滤触发验证。

### 2.6 自动化验收标准（🔴 缺失）

> "整个文档没有一条可以自动化验证的行为断言"

这是参考笔记的核心批评，完全适用于本项目：

- `docs/project_architecture.md` — 描述性文档，无 AC
- `docs/feature_translation.md` — 设计说明，无 AC
- `docs/integration_instagram.md` — 实施追踪，无 AC

每个模块的定义只有描述，没有"实现完成后 AI 可以运行来验证"的断言集合。

### 2.7 Docker 测试环境（🟡 缺失 — 中等优先级）

参考方案用 Docker 启动测试 SSHD 容器。本项目的测试也需要：

- 可独立运行的 PostgreSQL 容器（目前依赖 `.env` 中的 `DB_URL`）
- 模拟 Twitter API 响应的 mock 服务

### 2.8 Postmortem 自动化预发布检查（🟡 缺失）

AGENTS.md 定义了 Phase 2 预发布检查流程，但完全是手动流程。无脚本自动化交叉比对。

### 2.9 视觉回归测试（🟡 缺失）

Postmortem #003 记录 20 次 CSS fix。没有：

- Storybook visual testing（Chromatic / Percy）
- 截图组件的像素级对比

---

## 3. 按 Postmortem 根因的覆盖缺失

将 8 份 Postmortem 报告的 Corrective Actions 与当前测试覆盖交叉比对：

| Postmortem # | 根因                  | 建议的 Corrective Action      | 当前覆盖                                                            | 缺口                                 |
| ------------ | --------------------- | ----------------------------- | ------------------------------------------------------------------- | ------------------------------------ |
| 001          | parseTweet 无测试     | Snapshot 测试 + CI fixture    | ❌ 0%                                                               | 全部缺失                             |
| 002          | 翻译系统耦合          | 翻译管线单元测试              | 🟡 ~30% (resolveEntities/resolveTranslationView/materialize 有测试) | verify 整体翻译闭环的集成测试缺失    |
| 003          | 20 次 CSS fix         | Visual regression             | ❌ 0%                                                               | 全部缺失                             |
| 004          | 构建边界不清          | Import 约束检查               | 🟡 typecheck 覆盖                                                   | 无自动检查 client/server import 边界 |
| 005          | 媒体管线重复          | 统一代理测试                  | ❌ 0%                                                               | 无媒体管线测试                       |
| 006          | Zustand 整 store 订阅 | Store selector lint rule      | 🟢 已缓解                                                           | —                                    |
| 007          | IG 集成无验收         | IG fixture + integration test | ❌ 0%                                                               | 无 IG 测试 fixture                   |
| 008          | 字体渲染竞争          | 字体加载测试                  | 🟢 已缓解                                                           | —                                    |

**8 份 Postmortem 中，2 份已缓解，6 份的 Corrective Actions 未实施。**

---

## 4. 总体缺失框架：待建立的 5 层验证体系

```
┌─────────────────────────────────────────────────┐
│ L5: CI/CD Pipeline                              │
│     GitHub Actions workflow → 自动触发验证        │
├─────────────────────────────────────────────────┤
│ L4: CLI Verify Tool                             │
│     bun verify → 统一入口，模块化 Pass/Fail       │
│     bun verify --module tweet                   │
│     bun verify --module translation             │
│     bun verify --module ig                      │
│     bun verify --module screenshot              │
│     bun verify --module media                   │
├─────────────────────────────────────────────────┤
│ L3: SDK / API Client                            │
│     TestableApiClient → 程序化调用 API           │
│     提供：getTweet / getIGPost / translate       │
│     / screenshot / proxy                        │
├─────────────────────────────────────────────────┤
│ L2: Test Fixtures                               │
│     fixtures/tweets/*.json (10+ payload 变体)    │
│     fixtures/ig-posts/*.json (5+ 变体)          │
│     fixtures/translations/*.json (5+ 配对)      │
│     fixtures/screenshots/* (期望输出)            │
├─────────────────────────────────────────────────┤
│ L1: Acceptance Criteria (AC)                    │
│     每个模块 5-10 条可验证行为断言                 │
│     格式：AC-TWEET-001 ~ AC-TWEET-NNN            │
│     AC → Verifier → CLI verify step 对应链       │
└─────────────────────────────────────────────────┘
```

**当前状态：5 层全部为零。**

---

## 5. 下阶段行动计划（Phase 1: 打基础）

### S1 — 测试 Fixture（~2 天）

为最脆弱模块建立 snapshot fixture：

1. **Tweet Fixtures**：收集 10-20 个真实 tweet JSON payload，覆盖所有已知变体
2. **IG Fixtures**：5+ Instagram post JSON（post/reel/story/carousel）
3. **Translation Fixtures**：5+ (raw text, entities, expected translation) 三元组

### S2 — API 测试客户端（~2 天）

封装 `TestableApiClient`：

```typescript
// test/sdk/api-client.ts
class AnonTweetTestClient {
  constructor(baseUrl: string)
  async tweet: {
    get(id: string): Promise<TweetResponse>
    list(ids: string[]): Promise<TweetListResponse>
    replies(id: string): Promise<RepliesResponse>
  }
  async ig: {
    get(url: string): Promise<IGPostResponse>
    translate(postId: string): Promise<TranslationResponse>
  }
  async ai: {
    translate(text: string): Promise<AITranslationResponse>
  }
}
```

### S3 — Verifier 框架 + CLI（~3 天）

建 `scripts/verify/` 目录：

```
scripts/verify/
├── index.ts              # CLI 入口 (bun verify [--module X])
├── framework/
│   ├── types.ts          # Verifier / VerificationResult 接口
│   └── runner.ts         # 运行所有 Verifier 并输出结果
├── modules/
│   ├── tweet.verifier.ts
│   ├── translation.verifier.ts
│   ├── ig.verifier.ts
│   ├── screenshot.verifier.ts
│   └── media.verifier.ts
└── helpers/
    ├── test-server.ts    # 启动/停止测试服务器
    └── test-db.ts        # 测试数据库管理
```

CLI 体验目标：

```bash
$ bun verify
Tweet Parsing ........... ✓ (12/12 variants)
Translation Pipeline .... ✓ (6/6 test cases)
AI Translation .......... ✓ (3 providers, 2.1s avg)
IG Post Fetching ........ ⚠ (4/5 variants, 1 timeout)
Screenshot Export ....... ✓ (4/4 formats)
Media Proxy ............. ✓ (8/8 URL patterns)

PASS: 5/6  WARN: 1/6  FAIL: 0/6
Duration: 18.3s
```

### S4 — 验收标准文档化（~1.5 天）

为 `docs/` 下的每个模块补充 AC 文件：

```
docs/
├── acceptance-criteria/
│   ├── AC-tweet.md         (AC-TWEET-001 ~ AC-TWEET-015)
│   ├── AC-translation.md   (AC-TRANS-001 ~ AC-TRANS-012)
│   ├── AC-ig.md            (AC-IG-001 ~ AC-IG-010)
│   ├── AC-screenshot.md    (AC-SHOT-001 ~ AC-SHOT-008)
│   └── AC-media.md         (AC-MEDIA-001 ~ AC-MEDIA-006)
```

每个 AC 格式：

```markdown
#### AC-TWEET-001：正常推文解析不丢实体

- **输入**：`fixtures/tweets/normal.json`
- **预期输出**：实体数量 = 4 (2 mention, 1 hashtag, 1 url)
- **验证方法**：`bun verify --ac AC-TWEET-001`
- **通过条件**：解析后 `entities.length === 4`
```

### S5 — CI/CD Pipeline（~1 天）

```yaml
# .github/workflows/verify.yml
name: Verification Suite
on:
  push:
    paths:
      - 'app/lib/**'
      - 'app/routes/api/**'
      - 'app/components/**'
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run typecheck
      - run: bun run lint
      - run: bun test
      - run: bun verify --exit-on-fail # ← 新增
```

---

## 6. 实施优先级矩阵

```
                    紧急程度
                高              低
           ┌──────────────┬──────────────┐
重   高    │ S1 Fixtures  │ S4 AC 文档   │
要        │ S2 SDK 客户端  │              │
性        ├──────────────┼──────────────┤
     低    │ S3 CLI 验证   │ S5 CI/CD     │
           └──────────────┴──────────────┘
```

| 优先序 | 任务                   | 工期   | 对 AI 自验证的直接贡献      |
| ------ | ---------------------- | ------ | --------------------------- |
| P0     | S1 测试 Fixture        | 2 天   | 提供"正确输出"的参考标准    |
| P0     | S2 API 测试客户端      | 2 天   | AI 无需浏览器即可调用 API   |
| P1     | S3 Verifier 框架 + CLI | 3 天   | 可执行的 Pass/Fail 验证     |
| P1     | S4 验收标准文档        | 1.5 天 | 每个功能明确的行为契约      |
| P2     | S5 CI/CD Pipeline      | 1 天   | 自动化触发 + 阻断不合规变更 |

**总计工期：~9.5 天**

---

## 7. 风险与约束

- **Fixture 来源**：需要真实的 Twitter/Instagram API 响应。当前依赖手动抓取或运行中的 API token。建议：从已缓存的 PostgreSQL 数据中导出。
- **CLI 工具定位**：`bun verify` 是**开发者 + AI 工具**，不是面向终端用户的命令。不要与现有的 `bun run dev/build/test` 混淆。
- **不引入新依赖**：CLI 验证工具应使用项目已有的 Bun + TypeScript 栈，不额外引入 Puppeteer/Playwright。
- **Postmortem 检查自动化**：在 S5 之后推进，作为 `.github/workflows/postmortem-check.yml` 独立 workflow。

---

_本文件为下阶段行动计划的工作底稿，待确认后启动实施。_
