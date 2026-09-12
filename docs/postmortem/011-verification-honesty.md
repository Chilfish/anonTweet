# Postmortem 011: 验证名实不符 —— 空跑报绿 / 静态扫描冒充行为 / 死断言

- **日期**: 2026-09-12
- **严重级别**: 中
- **状态**: Mitigated
- **根因归类**: 工具反馈（门禁不携带信号）+ 决策滞后（AC 命名/分层未制度化）

## 摘要

被 CLAUDE.md、verify/README、CI、pre-push 同时引用的「护城河」命令 `bun run verify/index.ts
--exit-on-fail`，对相当一部分功能**不携带信号**：`--ac` / `--module` 选不中用例时 vitest
按过滤语义 `exit 0`；acceptance 层大量 AC 用「读源码 `toContain('字面量')`」冒充行为断言
（AC-CI-003 甚至被 workflow 的一句注释满足）；`ac-sec.spec.ts` 有一条 `// 暂时不管他` 的死
`return`；同时该命令在本机因 dev server 继承外层 `NODE_ENV=production` 崩溃而**直接变红**——
「全绿」既不可复现、也不代表被验证。修复分三阶段（F1~F13）落地，并把「编号 ↔ 测试名」契约
变成元测试、把「每条 `it` 至少一条断言」变成 lint 规则。

## 影响

- **一次系统性审查**（`docs/reviews/review-2026-09-11-test-suite-honesty.md`）暴露 P1×6 / P2×3，
  修复 backog F1~~F13（估 10~~20 人日），本次落地 F1~~F5、F8~~F10、F12、F13，F6/F7/F11 部分/延后
- **隐藏风险最高的是「空跑报绿」**：`--module translation|screenshot|postmortem` 按文档执行会
  得到一次成功的空跑（`368 skipped` / `exit 0`），操作者却以为「该子系统已验证」
- **门禁红不可复现**：integration 层声明过的绿灯在当前树跑不出来（dev server 500），
  三层门禁名存实亡
- **同类问题已复发**：`review-2026-08-19` P1-1（AC-CARD-005 源码扫描冒充渲染断言）→ 本次 P1-3，
  符合同一 Bug 模式复发条件

## 时间线

| commit / 事件 | 说明                                                                            |
| ------------- | ------------------------------------------------------------------------------- |
| 2026-09-11    | 验证套件诚信审查；产出 review 全文 + backlog F1~F13（F1 dev server 为阻塞项）   |
| 2026-09-11    | 依赖升级导致 `.tsx` 构建失败（另一条独立问题 → postmortem 010）                 |
| 2026-09-12    | 定位 dev server 崩溃根因：外层 `NODE_ENV=production` 被 `react-router dev` 继承 |
| 2026-09-12    | F1~~F5、F8~~F10、F12、F13 落地；F4 元测试先红后绿，精确复现 review 的编号差集   |

## 根因分析（blameless）

- **贡献因素 1：CLI 包装层把「过滤」当「通过」**。vitest `-t` 是过滤语义，0 匹配本就 `exit 0`；
  错在薄 CLI 没有把「0 executed」当失败——包装层缺陷，不是 vitest 的锅。
- **贡献因素 2：模块别名与 AC 前缀靠记忆维护**。`translation→AC-TRANS` / `screenshot→AC-SHOT` /
  `postmortem→AC-PM` 的映射没有任何单一事实源；写错即静默空跑。
- **贡献因素 3：AC 的「验证方法」缺少分层纪律**。「源码扫描」能拦住结构手滑且成本极低，
  本身不是错；错在把它**写进 AC 的 Pass 条件并叫成行为验收**，于是「绿」不携带行为信号。
- **贡献因素 4：没有机器可查的「命名契约」与「断言存在」**。AC 编号可以在文档里有、测试里没有
  （或反之）；`return` 短路、条件断言、无断言用例都不会被任何工具发现。
- **贡献因素 5（门禁红）：dev 模式依赖外层环境而非自证**。`react-router dev` 继承宿主
  `NODE_ENV`；Vite 仍按 dev 产出 `react/jsx-dev-runtime` 导入，而 React 的 CJS shim 在
  `NODE_ENV=production` 下返回**不含 `jsxDEV`** 的构建 → 根页 500。`dev` 脚本未自证自身模式，
  于是任何「外层是 production」的环境（agent/CI 壳）都会把整条门禁拖红。

## 做得对的地方

- 用「反向审计」而不是「再跑一次测试」来回答「这条命令证明了什么」——列文件 + 行号 + 可复现命令
- 修复坚持「先让守卫变红、再变绿」：F4 元测试首次运行精确吐出 review 的差集（AC-TRANS-005/006/007
  文档有测试无；AC-TEST-006 测试有文档无），证明它真能失败
- F5 用「解析 `run:` 步骤」而非删除断言：并额外断言注释里的 `bun run test` **不在**解析结果里，
  直接反证旧的假阳性
- F1 用两种守卫：行为（AC-DEV-001 根页健康）+ 结构（AC-DEV-002 脚本固定 NODE_ENV）

## 行动项

### 缓解（针对已发生的具体缺口）

- [x] F1 `dev`/`build` 脚本经 `cross-env` 固定 `NODE_ENV`（AC-DEV-001 行为 + AC-DEV-002 结构）（2026-09-12）
- [x] F2 `verify/index.ts` 零匹配非零退出 + 模块别名修正 + `--module` 白名单启动校验（2026-09-12）
- [x] F3 删除 `ac-sec.spec.ts` 死 `return`；所有者裁定移除过噪的隐私披露文案，对应断言一并删除（2026-09-12）
- [x] F4 新增 `ac-contract.spec.ts`：文档 AC 编号 ↔ `describe/it` 名 1:1 元测试（2026-09-12）
- [x] F5 AC-CI-002/003/004 改为解析 workflow `run:`/`uses:` 步骤（2026-09-12）
- [x] F8 AC-TWEET-001~004/007、AC-IG-001/006 改为「fixture → 真实纯函数 → 断言产出」（2026-09-12）
- [x] F9 补 AC-TRANS-005/006/007 命名 + 登记 `AC-TEST-006`（新增 `AC-test.md`）（2026-09-12）
- [x] F10 `test/expect-expect` / `test/no-conditional-expect` / `test/no-standalone-expect` 入 lint（2026-09-12）
- [x] F12 修订 `verify/README.md` 失实表述（1:1 可追溯改为「由元测试强制」；「裸跑永远绿」改为局限说明）（2026-09-12）
- [x] F13 `--server`/`--server-port` 标注 deprecated；`hasEntityType` 形参收窄为 `Entity['type']`（2026-09-12）
- [ ] F7 集成层全面可失败化：录制 fixture + msw（所有者裁定形态）。已先修 AC-TWEET-006 半恒真与
      AC-SHOT 条件断言；剩余需解决「dev server 独立进程内 msw 无法拦截上游」的架构问题
- [ ] F11 Stryker 一次性变异体检（`app/lib/**` 纯函数），不入正式门禁

### 预防（针对整类问题）

- [x] 「AC 编号 ↔ 测试名」1:1 由 `test/acceptance/ac-contract.spec.ts` 强制，漂移即红
- [x] 「每条 `it` 至少一条断言 / 禁止条件断言」由 eslint（`test/*` 规则）机器可查
- [x] CLI 层「0 executed = 失败」写进 `verify/index.ts` 与 README，杜绝空跑报绿
- [ ] F6 静态扫描型 AC 逐条处置：关键路径改行为测试、其余如实降级为「辅助检查」（AC 文档已大多标注；
      剩余「改名 + 关键路径重写」见 `backlog.md` F6）
- [ ] 把本篇的「高频雷区」条目补进 `docs/postmortem/README.md` 自查清单

## 教训

- **「绿」必须可失败才有意义**：任何门禁先问「故意改坏被测行为，它会红吗？」——不会红的绿灯是负担，
  比没有测试更危险（读者以为有覆盖）。
- **验证命令要自证**：CLI 包装层必须拒绝 0 匹配；进程启动必须自证运行模式（`NODE_ENV`），
  不能依赖外层环境。

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
docs/postmortem/011-verification-honesty.md
docs/postmortem/README.md
```

## 关联 Postmortem

- #007（新功能无验收清单）— 同一「验证先行」缺失的下游表现
- #010（依赖越过主版本打断构建）— 同期另一条独立缺口；本篇的 F1 是其修复后才浮出的门禁红
- 复发链：`review-2026-08-19` P1-1（源码扫描冒充渲染断言）→ `review-2026-09-11` P1-3（同模式）
