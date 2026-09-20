# Postmortem 016: 门禁基建不稳定，红色基线被接受

- **日期**: 2026-09-18
- **严重级别**: SEV-1
- **分类**: 流程
- **状态**: Active
- **根因归类**: 工具反馈

## 摘要

验证门禁有过一段「红着但不修」的时期。2026-08-13 起 `bun run test` 全量存在不稳定失败集，被记为「既有基线红灯」，而它正挡在 pre-push 与 CI 的 unit 步骤上——等于门禁被打了个洞，review-2026-08-13 直接点了名。真因不是逻辑 bug：vitest 默认 `testTimeout: 5000` 对冷加载大依赖图太短，失败集每轮漂移（110/5、111/4）。同期还有一批基建噪声：`bun test` 与 `bun run test` 命令面不一致（文档还写错）、孤儿 dev server 占端口导致 AC 假红、自研 VerifyRunner 与 Vitest 双轨重复实现。

## 影响

- 门禁不可信：红是常态，且失败集每次不同，没人能判断「是不是我改坏了」。
- 阻塞：pre-push 与 CI 都被挡住，只能绕过门禁推进 PR。
- 返工：冷加载超时排查三轮；自研框架切到 Vitest 跨 Phase A 到 E。
- 隐藏风险：被接受的红色基线是 #011「门禁不携带信号」的前置条件，两者同源。

## 时间线

| 日期 | commit | 事件 |
| ---- | ------ | ---- |
| 2026-08-09 | `2bf8af4` | 修既有 test / verify 失败 |
| 2026-08-13 | — | review 记录基线红灯，并指出「pre-push gate 打洞」 |
| 2026-08-14 | `90f448f` | 文档先行：vitest 冷加载超时的修复计划 |
| 2026-08-14 | `ee5f1eb` | `maxWorkers: 2` + 全局 30s 超时，基线清零（连续 5 次 115/115） |
| 2026-08-14 | `e7a120d` | 删除自研框架，薄 CLI 收口，引擎切换 Vitest 三层 |
| 2026-08-17 | `20af27e` | 新增报告 009 打红 AC-PM（`REPORT_IDS` 硬编码），补注册 |
| 2026-08-17 | — | TestServer `readyTimeoutMs` 30s → 90s（冷启动波动） |
| 2026-08-19 | — | 8081 端口残留孤儿 dev server 被 `TestServer.probe()` 复用，AC-IG-009 假红 |
| 2026-08-19 | `60dbea4` | 补 `@types/react-dom` 解 typecheck 门禁 |
| 2026-08-20 | `e30b45b` | 把 storybook 浏览器项目移出门禁 |

## 根因分析

1. 把「不是我引入的失败」当成可以不修。既有失败被接受为基线，但门禁是二值的——红就是红，它不区分来源。
2. 默认配置不适合本仓库的冷加载路径。vitest 默认 5s 对「路由 → lib → provider → AI SDK」这条大依赖图的首次动态 import 太短，失败集随并行度漂移。
3. 命令面不统一。`bun test`（Bun 原生 runner，不支持 `vi.resetModules`）与 `bun run test`（vitest）行为不同，而文档写的是前者，制造过假失败与假诊断。
4. 环境残留污染结果。上次 verify 遗留的孤儿 dev server 占着 8081，被 `TestServer.probe()` 判定为可复用，产生与代码无关的假红。
5. 双轨实现。自研 VerifyRunner 与 Vitest 并行维护同一批逻辑，两边断言质量与维护成本同时退化。
6. 契约登记表硬编码。给报告加一个新编号就要同时改测试里的 `REPORT_IDS`、脚本里的 `HOT_FILES` 和 AC 文档的范围，漏一处门禁就红。

一句话归纳：门禁的失败必须能归因到代码，否则它会被当成噪声并被接受成基线；而配置、命令面、环境残留、硬编码登记都会制造这种噪声。

## 触发条件

全量并行跑测试（冷加载竞争）；误用 `bun test` 而非 `bun run test`；本机存在残留 dev server；新增报告编号。

## 检测

靠「失败集在多次运行间漂移」判定为基建问题而非逻辑问题（三轮实测）。review 指出「gate 打洞」。当时的盲区是没有把「基线红灯」当成必须清零的阻塞项。

## 处置

收紧 vitest 配置（`maxWorkers: 2` + 30s `testTimeout` / `hookTimeout`），删除冗余的 per-test timeout；把文档与脚本统一到 `bun run test`；引擎切到 Vitest 三层并删除自研框架；清理环境残留（`taskkill /T /F` 杀进程树、TestServer ready 超时 30s → 90s）；把 storybook 浏览器项目移出正式门禁。

## 做得对的地方

用「失败集是否漂移」作为区分基建与逻辑的判据，而不是逐个去改测试。修复只动测试隔离层、独立 commit，不混入功能 PR。迁移分 Phase A 到 E，每个阶段新旧双跑都绿才切换。

## 行动项

### 缓解

- [x] vitest `maxWorkers: 2` + 全局 30s 超时，清零基线（`ee5f1eb`）
- [x] 删除冗余的 per-test timeout
- [x] 引擎切换 Vitest 三层，删除自研 VerifyRunner（`e7a120d`）
- [x] 文档与门禁统一到 `bun run test`
- [x] 补 `@types/react-dom` 解 typecheck 门禁（`60dbea4`）
- [x] storybook 浏览器项目移出正式门禁（`e30b45b`）
- [x] 新增报告后同步 `REPORT_IDS` / `HOT_FILES` / AC 文档范围（`20af27e`）

### 预防

- [ ] 明确「基线红灯不得合入」：任何门禁失败在合并前清零，不做例外登记（维护者）
- [ ] 门禁失败必须可归因：输出带上失败命令与失败集，禁止用「已知不稳定」代替修复（维护者）
- [ ] 统一命令面：文档、lefthook、CI 只允许一个测试入口（`bun run test`）（维护者）
- [ ] 测试环境隔离：TestServer 启动前检测并清理残留端口与进程（维护者）
- [ ] 把 `REPORT_IDS` / `HOT_FILES` 的登记改为从目录与 README 派生，消除硬编码副本（维护者）

## 教训

门禁一旦允许「已知红灯」，它就退化成噪声。任何被接受的失败，最终都会变成没人看的绿灯。

## Changed Files

```
vitest.config.ts
lefthook.yml
.github/workflows/verify.yml
test/support/test-server.ts
test/helpers/env.ts
verify/index.ts
package.json
CLAUDE.md
```

## 关联报告

- #011 验证名实不符：门禁不携带信号的另一半，本篇是其前置条件
- #010 Babel 主版本漂移：同类「门禁覆盖不到的地方被穿透」
- #004 构建配置：最初缺失构建门禁的记录
