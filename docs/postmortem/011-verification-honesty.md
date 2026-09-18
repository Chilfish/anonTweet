# Postmortem 011: 验证名实不符，空跑报绿与静态扫描冒充行为

- **日期**: 2026-09-12
- **严重级别**: SEV-1
- **分类**: 流程
- **状态**: Active
- **根因归类**: 工具反馈

## 摘要

被 CLAUDE.md、`verify/README`、CI 和 pre-push 同时引用的命令 `bun run verify/index.ts --exit-on-fail`，对相当一部分功能不携带信号：`--ac` / `--module` 选不中用例时，vitest 按过滤语义 `exit 0`；acceptance 层大量 AC 用「读源码 `toContain('字面量')`」冒充行为断言（AC-CI-003 甚至被 workflow 里的一句注释满足）；`ac-sec.spec.ts` 有一条 `// 暂时不管他` 的死 `return`。同时该命令在本机因 dev server 继承外层 `NODE_ENV=production` 崩溃而直接变红。「全绿」既不可复现，也不代表被验证。修复分三阶段（F1~F13）落地，并把「编号 ↔ 测试名」做成元测试、把「每条 `it` 至少一条断言」做成 lint 规则。

状态为 Active：核心缓解已落地（F2/F4/F5/F10），但 F6、F7、F11 未完成，静态扫描型 AC 这个复发面还在。

## 影响

- 一次系统性审查（`docs/reviews/review-2026-09-11-test-suite-honesty.md`）暴露 P1×6 / P2×3，修复 backlog F1~F13（估 10~20 人日），本次落地 F1~F5、F8~F10、F12、F13。
- 最危险的是空跑报绿：按文档执行 `--module translation|screenshot|postmortem` 会得到一次成功的空跑（368 skipped / `exit 0`），操作者却以为该子系统已验证。
- 门禁红不可复现：integration 层声明过的绿灯在当前树跑不出来（dev server 500），三层门禁名存实亡。
- 同类问题已复发：`review-2026-08-19` P1-1 与本次 P1-3 是同一模式。

## 时间线

| 日期 | 事件 |
| ---- | ---- |
| 2026-09-11 | 验证套件诚信审查，产出 review 全文与 backlog F1~F13（F1 为阻塞项） |
| 2026-09-11 | 依赖升级导致 `.tsx` 构建失败（独立问题，见 #010） |
| 2026-09-12 | 定位 dev server 崩溃根因：外层 `NODE_ENV=production` 被 `react-router dev` 继承 |
| 2026-09-12 | F1~F5、F8~F10、F12、F13 落地；F4 元测试先红后绿，精确复现 review 的编号差集 |

## 根因分析

1. CLI 包装层把「过滤」当「通过」。vitest 的 `-t` 是过滤语义，0 匹配本就 `exit 0`。错在这个薄 CLI 没有把「0 executed」当失败，问题在包装层，不在 vitest。
2. 模块别名与 AC 前缀靠记忆维护。`translation→AC-TRANS`、`screenshot→AC-SHOT`、`postmortem→AC-PM` 的映射没有单一事实源，写错就静默空跑。
3. AC 的「验证方法」缺分层纪律。源码扫描能拦结构性手误，成本也低，本身不算错；错在把它写进 AC 的 Pass 条件并叫成行为验收，「绿」就不再携带行为信号。
4. 没有机器可查的「命名契约」与「断言存在」。AC 编号可以在文档里有、测试里没有，或反之；死 `return`、条件断言、无断言用例都不会被任何工具发现。
5. 门禁变红是因为 dev 模式依赖外层环境而非自证。`react-router dev` 继承宿主 `NODE_ENV`，Vite 仍按 dev 产出 `react/jsx-dev-runtime` 导入，而 React 的 CJS shim 在 `NODE_ENV=production` 下返回不含 `jsxDEV` 的构建，根页 500。任何外层是 production 的环境（CI、agent 壳）都会把整条门禁拖红。

一句话归纳：验证命令既不拒绝空跑、也不区分行为与源码扫描，AC 编号与断言又没有机器校验，于是「绿」只说没有断言失败，不说功能被验证。

## 触发条件

按文档执行带 `--ac` / `--module` 的验证命令；在 CI 或 agent 壳等外层 `NODE_ENV=production` 的环境里启动 dev。

## 检测

用反向审计回答「这条命令证明了什么」——列文件、行号、可复现命令。当时的盲区是没有元测试保证 AC 编号与测试用例 1:1。

## 处置

F1~F13 分阶段修复，见行动项。

## 做得对的地方

用反向审计而不是「再跑一次测试」。修复坚持「先让守卫变红、再变绿」，F4 元测试首次运行就精确吐出 review 的编号差集。F5 用解析 workflow 的 `run:` 步骤替代删除断言，并额外断言注释里的命令不在解析结果里，直接反证旧的假阳性。F1 同时上行为守卫与结构守卫。

## 行动项

### 缓解

- [x] F1 `dev` / `build` 脚本经 `cross-env` 固定 `NODE_ENV`（AC-DEV-001 行为 + AC-DEV-002 结构；维护者）
- [x] F2 `verify/index.ts` 零匹配非零退出 + 模块别名修正 + `--module` 白名单启动校验（维护者）
- [x] F3 删除 `ac-sec.spec.ts` 死 `return`；移除过噪的隐私披露文案及对应断言（维护者）
- [x] F4 新增 `ac-contract.spec.ts`：文档 AC 编号与 `describe/it` 名 1:1 元测试（维护者）
- [x] F5 AC-CI-002/003/004 改为解析 workflow 的 `run:` / `uses:` 步骤（维护者）
- [x] F8 AC-TWEET-001~004/007、AC-IG-001/006 改为「fixture → 真实纯函数 → 断言产出」（维护者）
- [x] F9 补 AC-TRANS-005/006/007 命名，登记 AC-TEST-006（维护者）
- [x] F10 `test/expect-expect`、`test/no-conditional-expect`、`test/no-standalone-expect` 入 lint（维护者）
- [x] F12 修订 `verify/README.md` 的失实表述（维护者）
- [x] F13 `--server` / `--server-port` 标注 deprecated；`hasEntityType` 形参收窄（维护者）

### 预防

- [x] AC 编号与测试名 1:1 由 `test/acceptance/ac-contract.spec.ts` 强制（维护者）
- [x] 每条 `it` 至少一条断言、禁止条件断言，由 eslint `test/*` 规则机器可查（维护者）
- [x] CLI 层「0 executed = 失败」写进 `verify/index.ts` 与 README（维护者）
- [x] 把本篇的高频雷区补进 README 自查清单（维护者）
- [ ] F6 静态扫描型 AC 逐条处置：关键路径改行为测试，其余如实降级为辅助检查（维护者）
- [ ] F7 集成层可失败化：录制 fixture + msw；需先解决 dev server 独立进程内 msw 无法拦截上游的架构问题（维护者）
- [ ] F11 Stryker 一次性变异体检（`app/lib/**` 纯函数），不入正式门禁（维护者）

## 教训

「绿」必须可失败才有意义。改任何门禁前先问：故意改坏被测行为，它会红吗？验证命令要自证——CLI 包装层拒绝 0 匹配，进程启动自证运行模式。

## Changed Files

```
package.json
verify/index.ts
verify/README.md
verify/acceptance-criteria/AC-ci.md
verify/acceptance-criteria/AC-dev.md
verify/acceptance-criteria/AC-ig.md
verify/acceptance-criteria/AC-sec.md
verify/acceptance-criteria/AC-test.md
verify/acceptance-criteria/AC-translation.md
test/acceptance/ac-ci.spec.ts
test/acceptance/ac-contract.spec.ts
test/acceptance/ac-dev.spec.ts
test/acceptance/ac-ig.spec.ts
test/acceptance/ac-sec.spec.ts
test/acceptance/ac-tweet.spec.ts
test/integration/api.screenshot.spec.ts
test/integration/api.tweet.spec.ts
test/integration/dev-server.spec.ts
test/unit/llms.spec.ts
test/unit/provider-strategy.spec.ts
test/unit/resolveTranslationView.spec.ts
test/unit/share.spec.ts
test/unit/translationMaterialize.spec.ts
eslint.config.mjs
```

## 关联报告

- #007 Instagram 集成：同一「验证先行」缺失的下游表现
- #010 Babel 主版本漂移：同期另一条缺口，本篇 F1 在其修复后才浮出门禁红
- 复发链：`review-2026-08-19` P1-1 → `review-2026-09-11` P1-3，同一模式
