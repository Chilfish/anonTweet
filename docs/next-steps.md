# 下阶段行动计划 & 验收标准

> 日期：2026-07-04
> 基于：`docs/verification-gap-analysis.md`（差距分析）
> 当前进度：P0 已完成（Fixture + SDK + CLI + 25 AC）

---

## Five 层的当前状态

```
L5: CI/CD Pipeline           ← 🟡 待实施 (Phase 2)
L4: CLI Verify Tool (bun verify) ← ✅ 17 PASS / 0 FAIL / 3 SKIP
L3: SDK / API Client          ← ✅ AnonTweetClient + TestServer
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

### S7 — Media Proxy Verifier（优先级 P3，~1 天）

基于 Postmortem #005（媒体管线重复），验证 `/api/proxy/image` 端点和 URL 转换逻辑。

#### 验收标准（AC-MEDIA-001 ~ AC-MEDIA-006）

| AC ID        | 描述                 | Pass 条件                               |
| ------------ | -------------------- | --------------------------------------- |
| AC-MEDIA-001 | Tweet 图片代理可达   | `GET /api/proxy/image?url=...` 返回 200 |
| AC-MEDIA-002 | IG 图片代理可达      | `GET /api/proxy/image?url=...` 返回 200 |
| AC-MEDIA-003 | 无效 URL 返回错误    | 400 或 5xx                              |
| AC-MEDIA-004 | URL 转换无重复协议   | 不出现 `https://https://`               |
| AC-MEDIA-005 | 截图组件使用统一代理 | 代码扫描确认无硬编码 CDN URL            |
| AC-MEDIA-006 | Video URL 正确处理   | 视频类型媒体有 `video_url` 字段         |

---

### S8 — 服务器自动管理（优先级 P3，~0.5 天）

使 `bun verify --server` 自动启动/停止测试服务器：

- `TestServer.start()` 内部调用 `bun run dev`
- 通过 idle 检测自动停止
- 支持自定义 PORT（默认 9081）

#### 验收标准

```
$ bun run verify/index.ts --server --exit-on-fail
[TestServer] Starting on port 9081...
[TestServer] Ready at http://localhost:9081 (5.2s)

  TWEET
    ✓ Normal tweet parsing          ✓
    ✓ API endpoint returns tweet    ✓  (新增：AC-TWEET-005 通过)
    ✓ Invalid tweet returns empty   ✓  (新增：AC-TWEET-006 通过)
    ✓ GET/POST consistency          ✓  (新增：AC-TWEET-008 通过)

  PASS: 20  FAIL: 0
```

---

### S9 — IG 集成测试扩展（优先级 P3，~2 天）

当前 IG Verifier 的 5 条 AC 均为离线检测。需要添加需要 `INS_COOKIES` 的集成测试：

- AC-IG-006：Posts 端点 POST /api/ig/:id 返回正确
- AC-IG-007：Stories 端点 POST /api/stories/:id 返回正确
- AC-IG-008：未配置 cookies 时返回 500 错误
- AC-IG-009：翻译后的 caption 不丢失

---

### S10 — Postmortem 预发布检查自动化（优先级 P4，~1 天）

当前 [CLAUDE.md](../CLAUDE.md) 定义了 Phase 2 预发布检查流程，但需手动执行。用脚本自动化：

```
scripts/postmortem-check.ts
├── 获取本次改动的 commit 列表
├── 读取 docs/postmortem/*.md
├── 逐份交叉比对 Changed Files + Root Cause
└── 输出 PASS / WARN / FAIL

用法：bun run scripts/postmortem-check.ts <base-ref> <head-ref>
```

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

| 优先序 | 任务                      | 工期   | 依赖             |
| ------ | ------------------------- | ------ | ---------------- |
| P2     | S5 CI/CD Pipeline         | 1 天   | 无               |
| P2     | S6 Screenshot Verifier    | 1 天   | 无               |
| P3     | S8 服务器自动管理         | 0.5 天 | 无               |
| P3     | S7 Media Proxy Verifier   | 1 天   | S8（需要服务器） |
| P3     | S9 IG 集成测试扩展        | 2 天   | S8（需要服务器） |
| P4     | S10 Postmortem 预发布检查 | 1.5 天 | 无               |

**推荐执行顺序：S5 → S6 → S8 → S7 → S9 → S10**

---

## 目标状态

完成后，`bun verify` 应该是：

```bash
$ bun verify --server --exit-on-fail

  TWEET         ✓✓✓✓✓✓✓✓  (8/8)
  TRANSLATION   ✓✓✓✓✓✓✓   (7/7)
  IG            ✓✓✓✓✓     (5/5)
  SCREENSHOT    ✓✓✓✓       (4/4)
  MEDIA         ✓✓✓✓✓✓     (6/6)
  POSTMORTEM    ✓✓✓✓✓✓✓✓  (8/8)

  PASS: 38  FAIL: 0
  Duration: ~30s
```

_本文件为 Phase 2 工作底稿，实际执行时依赖 `verify/log.md` 的记录。_
