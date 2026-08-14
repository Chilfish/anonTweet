# 下阶段行动计划 & 验收标准

> 日期：2026-07-04
> 基于：`docs/verification-gap-analysis.md`（差距分析）
> 当前进度：P0 已完成（Fixture + SDK + CLI + 25 AC）
>
> ⚠️ **本文档为 Phase 2 工作底稿，Phase 2（S5~S10）已全部完成。**
> 下一阶段为**测试验证基建重构**（自研 verify 引擎 → Vitest 三层架构），
> 完整审计与行动计划见 [docs/planning/testing-infra-refactor.md](planning/testing-infra-refactor.md)。

---

## Five 层的当前状态

```
L5: CI/CD Pipeline           ← ✅ 已实施 (S5，AC-CI-001~004)
L4: CLI Verify Tool (bun verify) ← ✅ 26 PASS / 0 FAIL / 2 SKIP（--server 模式）
L3: SDK / API Client          ← ✅ AnonTweetClient + TestServer（S8 端口复用/隔离）
L2: Test Fixtures              ← ✅ 7 fixtures (3 tweet, 1 IG, 1 translation)
L1: Acceptance Criteria        ← ✅ 25 AC (4 份文档)
```

---

## Phase 2 行动计划

### S5 — CI/CD Pipeline（优先级 P2，~1 天）

```yaml
# .github/workflows/verify.yml
name: Verification Suite
on:
  push:
    paths:
      - 'app/lib/**'
      - 'app/routes/api/**'
      - 'app/components/**'
      - 'verify/**'
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
      - run: bun run verify/index.ts --exit-on-fail
```

#### 验收标准（AC-CI-001 ~ AC-CI-004）

| AC ID     | 描述             | Pass 条件                                               |
| --------- | ---------------- | ------------------------------------------------------- |
| AC-CI-001 | CI workflow 存在 | `.github/workflows/verify.yml` 文件可读                 |
| AC-CI-002 | 类型检查自动运行 | 每次 push 触发 `tsc`                                    |
| AC-CI-003 | 单元测试自动运行 | 每次 push 触发 `bun test`                               |
| AC-CI-004 | CLI 验证自动运行 | 每次 push 触发 `bun run verify/index.ts --exit-on-fail` |

---

### S6 — Screenshot Verifier（优先级 P2，~1 天）

基于 `acceptance-criteria/AC-screenshot.md` 的 4 条 AC，补全截图子系统验证：

- AC-SHOT-001：Tweet 截图端点 `GET /plain` 返回 HTML
- AC-SHOT-002：IG 截图端点 `GET /plain-ig` 返回 HTML
- AC-SHOT-003：截图组件使用 `waitForRenderReady`
- AC-SHOT-004：字体加载不阻塞截图

**实现**：创建 `verify/modules/screenshot.verifier.ts`

#### 验收标准

```
bun run verify/index.ts --module screenshot

  SCREENSHOT
    ✓ Plain tweet endpoint returns HTML          ✓  · GET /plain?tweetId=...
    ✓ Plain IG endpoint returns HTML             ✓  · GET /plain-ig?igId=...
    ✓ Component uses waitForRenderReady          ✓  · source scan
    ✓ Font rendering non-blocking                ✓  · font-display check

  PASS: 4  FAIL: 0
```

---

### S7 — Media Proxy Verifier（优先级 P3，~1 天）✅ 已完成（2026-08-09）

基于 Postmortem #005（媒体管线重复），验证 `/api/proxy/image` 端点和 URL 转换逻辑。

> **确定性实现说明**：AC-MEDIA-001/002 不用真实 CDN URL（上游状态漂移、离线不可用），
> 改为启动本地像素图服务器（`Bun.serve` 随机端口），构造同时满足白名单与本地可达的 URL 由代理真实转发。
> 后缀白名单（AC-001）与 IG 域名白名单（AC-002）两条路径均被覆盖，完全离线确定。

#### 验收标准（AC-MEDIA-001 ~ AC-MEDIA-006）

| AC ID        | 描述               | Pass 条件                                                                      |
| ------------ | ------------------ | ------------------------------------------------------------------------------ |
| AC-MEDIA-001 | Tweet 图片代理可达 | `GET /api/proxy/image?url=<*.png 本地>` 返回 200 + image/\*                    |
| AC-MEDIA-002 | IG 图片代理可达    | `GET /api/proxy/image?url=<含 cdninstagram.com>` 返回 200 + image/\*           |
| AC-MEDIA-003 | 无效 URL 返回错误  | 缺 `url` → 400；白名单外 → 403                                                 |
| AC-MEDIA-004 | URL 转换无重复协议 | `useProxyMedia` 含 `startsWith(mediaProxyUrl)` 幂等守卫；无 `https://https://` |
| AC-MEDIA-005 | Tweet 组件统一代理 | `useProxyMedia` 导出 + `TweetCard`/`utils` 调用 `proxyMedia`，无硬编码 twimg   |
| AC-MEDIA-006 | Video URL 正确处理 | `IGMedia` 类型含 `video_url`；`IGMediaGrid` video 分支使用 `video_url`         |

#### 验收结果（本地实测）

```
$ bun run verify/index.ts --server --module media
  MEDIA
    ✓ Tweet image proxy reachable    · GET /api/proxy/image?url=*.png → 200 image/png
    ✓ IG image proxy reachable       · GET /api/proxy/image?url=…cdninstagram.com… → 200 image/png
    ✓ Invalid URL returns error      · missing url → 400 · non-allowlist → 403
    ✓ No double-proxy URL            · useProxyMedia idempotent guard ✓
    ✓ Tweet media uses unified proxy · useProxyMedia entry ✓
    ✓ Video media URL handled        · IGMediaGrid video branch reads media.video_url

  PASS: 6  FAIL: 0  SKIP: 0
```

全量：**32 PASS / 0 FAIL / 2 SKIP**；`--module media` 离线 3 PASS / 3 SKIP；typecheck / lint / test 44/44 全绿。

---

### S8 — 服务器自动管理 ✅ 已完成（2026-08-09）

`bun run verify/index.ts --server` 自动启动/停止测试服务器（此前为占位实现）：

- `TestServer.start()` spawn `bun run dev`（`PORT` env 生效，修复 `vite.config.ts` 硬编码 9080）
- 端口复用：目标端口已有 HTTP 服务 → `Reusing`，不重复 spawn，结束时保留
- Windows 进程树清理：`taskkill /T /F`（裸 SIGTERM 会残留 dev server 挂住 CLI）
- `isolateExternal` 隔离外部 API key（`DOTENV_CONFIG_PATH` + 空串/delete），保证确定性
- 支持自定义 PORT（默认 9081）

#### 验收结果（本地实测）

```
$ bun run verify/index.ts --server
[TestServer] Starting on port 9081...
[TestServer] Ready at http://localhost:9081 (12783ms)
[TestServer] Stopping... / Stopped

  TWEET
    ✓ Invalid tweet returns empty   ✓  (AC-TWEET-006 激活 PASS)
    ○ AC-TWEET-005/008 需真实 TWEET_KEYS → SKIP
  SCREENSHOT
    ✓ Plain tweet endpoint returns HTML  ✓  (AC-SHOT-001 激活)
    ✓ Plain IG endpoint returns HTML     ✓  (AC-SHOT-002 激活)

  PASS: 26  FAIL: 0  SKIP: 2
```

真实 `TWEET_KEYS`/`INS_COOKIES` 时 AC-TWEET-005/008 与 AC-SHOT-002 内容断言会进一步激活（见 S9）。

---

### S9 — IG 集成测试扩展（优先级 P3，~2 天）✅ 已完成（2026-08-09）

当前 IG Verifier 的 5 条 AC 均为离线检测。扩展为 9 条，添加需要 `INS_COOKIES` 的集成测试（**端点已校准**——IG 帖子/故事统一走 `POST /api/ig/get/:id`，action handler 内置 stories 分支，无独立 stories 路由）：

- AC-IG-006（合并 next-steps 的「翻译 caption 不丢失」）：Caption 翻译不破坏原文 —— fixture 验证 `description` 不变、`captionTranslation` 非空
- AC-IG-007：Posts 端点 `POST /api/ig/get/:id` 集成（需 INS_COOKIES）
- AC-IG-008：Stories 端点 `POST /api/ig/get/:username/:story_id` 集成（需 INS_COOKIES + `IG_STORY_FIXTURE`）
- AC-IG-009：未配置 cookies 时返回 500（隔离环境确定性 PASS）

#### 验收结果（本地实测）

```
$ bun run verify/index.ts --server --module ig
  IG
    ✓ Post structure complete            ✓ Caption translation preserves original
    ✓ Media array valid                  ✓ Stories URL parsing / Post URL parsing / formatIGTime
    ✓ Missing INS_COOKIES returns 500    · POST /api/ig/get/__no_cookies_verify__ → 500 INS_COOKIES
    ○ Posts/Stories endpoint  → SKIP     · INS_COOKIES not configured

  PASS: 6  FAIL: 0  SKIP: 3
```

全量：**34 PASS / 0 FAIL / 4 SKIP**；`--module ig` 离线 6 PASS / 3 SKIP；typecheck / lint / test 44/44 全绿。

---

### S10 — Postmortem 预发布检查自动化（优先级 P4，~1 天）✅ 已完成（2026-08-09）

当前 [CLAUDE.md](../CLAUDE.md) 定义了 Phase 2 预发布检查流程，但需手动执行。用脚本自动化：

```
scripts/postmortem-check.ts
├── 获取本次改动的文件列表（git diff --name-only base..head）
├── 读取 docs/postmortem/*.md 的 Changed Files 块
├── 逐份交叉比对重叠 → WARN；解析失败 → FAIL
├── 高危文件表（历史 fix 热点）命中 → 额外 WARN
└── 输出 PASS / WARN / FAIL

用法：bun run scripts/postmortem-check.ts <base-ref> <head-ref>
```

接入 verify 的 `POSTMORTEM` 模块（`verify/modules/postmortem.verifier.ts`，AC-PM-001~007）做静态完整性检查：报告目录/状态/Changed Files/索引覆盖/脚本存在与可运行。

#### 验收标准

```
$ bun run scripts/postmortem-check.ts main HEAD
Postmortem Pre-Release Check
  [001] tweet parser     · Changed files overlap? NO  ✓
  [002] translation sys  · Changed files overlap? NO  ✓
  [003] UI styling       · Changed files overlap? NO  ✓
  [004] build config     · Changed files overlap? NO  ✓
  [005] media pipeline   · Changed files overlap? YES ⚠
  [006] state management · Changed files overlap? NO  ✓
  [007] IG integration   · Changed files overlap? NO  ✓
  [008] fonts/rendering  · Changed files overlap? NO  ✓

RESULT: PASS (1 WARN / 0 FAIL)
```

---

## 实施顺序建议

| 优先序 | 任务                      | 工期   | 依赖             | 状态 |
| ------ | ------------------------- | ------ | ---------------- | ---- |
| P2     | S5 CI/CD Pipeline         | 1 天   | 无               | ✅   |
| P2     | S6 Screenshot Verifier    | 1 天   | 无               | ✅   |
| P3     | S8 服务器自动管理         | 0.5 天 | 无               | ✅   |
| P3     | S7 Media Proxy Verifier   | 1 天   | S8（需要服务器） | ✅   |
| P3     | S9 IG 集成测试扩展        | 2 天   | S8（需要服务器） | ✅   |
| P4     | S10 Postmortem 预发布检查 | 1.5 天 | 无               | ✅   |

**Phase 2 全部完成** 🎉

---

## 目标状态

> 当前实测（2026-08-09，S5/S6/S7/S8/S9 完成后）：**34 PASS / 0 FAIL / 4 SKIP**。POSTMORTEM（S10）模块尚未实现，下表为整个 Phase 2 完成后的目标态。

完成后，`bun verify --server` 应该是：

```bash
$ bun verify --server --exit-on-fail

  TWEET         ✓✓✓✓✓✓✓✓  (8/8)
  TRANSLATION   ✓✓✓✓✓✓✓   (7/7)
  IG            ✓✓✓✓✓✓✓✓✓ (9/9)
  SCREENSHOT    ✓✓✓✓       (4/4)
  MEDIA         ✓✓✓✓✓✓     (6/6)
  POSTMORTEM    ✓✓✓✓✓✓✓   (7/7)
  CI            ✓✓✓✓       (4/4)

  PASS: 45  FAIL: 0
  Duration: ~30s
```

_本文件为 Phase 2 工作底稿，实际执行时依赖 `verify/log.md` 的记录。_
