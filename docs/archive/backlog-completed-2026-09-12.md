# Backlog 归档：验证诚信修复 F1~F13（2026-09-12）

> **状态**：收口（主体 F1~~F5 / F8~~F10 / F12 / F13 已完成；剩余 F6 / F7 / F11 由所有者裁定「暂不修复」延后归档）
> **来源**：`docs/reviews/review-2026-09-11-test-suite-honesty.md` §4 行动计划
> **实施记录**：`docs/development-log/2026-09-12.md`；**沉淀**：`docs/postmortem/011-verification-honesty.md`
> **所有者裁决（2026-09-12）**：集成策略 = 录制 fixture + msw；静态扫描 = 关键路径重写、其余降级；
> mutation testing = 一次性体检，不入正式门禁。
>
> **收口裁决（2026-09-12）**：测试相关基建到此为止，后续转功能开发；未完成的三条**暂不修复**，
> 延后归档于本文件（理由见「暂不修复」小节），不再占用活跃清单。

## 阶段 0（P0）：让门禁重新可信

- [x] [refactor] F1 修复 dev server 启动崩溃，恢复 `bun run verify/index.ts --exit-on-fail` 跑满三层（关联：审查 P1-5）
      — ✅（2026-09-12）根因 = 宿主 `NODE_ENV=production` 被 `react-router dev` 继承，Vite dev 产物导入
      `react/jsx-dev-runtime` 而 React 的 CJS shim 在 production 下返回不含 `jsxDEV` 的构建 → 根页 500。
      修复：`dev`/`build` 脚本经 `cross-env` 固定 `NODE_ENV`。守卫：AC-DEV-001（集成行为）+ AC-DEV-002
      （脚本结构，新增 `AC-dev.md`）。
- [x] [refactor] F2 `verify/index.ts` 零匹配守卫 + 修正模块别名映射 + `--module` 白名单启动校验（关联：审查 P1-1）
      — ✅（2026-09-12）json reporter 统计 executed（passed+failed），为 0 即 exit 1；别名修正
      translation→`AC-TRANS` / screenshot→`AC-(SHOT|PERF)` / postmortem→`AC-PM`；未知模块启动期拒绝。
- [x] [refactor] F3 删除 `ac-sec.spec.ts` 死 `return`，如实标注或补齐 AC-SEC-001 P3 设置页披露断言（关联：审查 P1-2）
      — ✅（2026-09-12）所有者裁定长段隐私披露「太吵」并删除，对应断言一并移除；`AC-sec.md` 升 v1.2 如实记录；
      白名单行为由 `test/unit/ai-base-url.spec.ts` 覆盖。
- [x] [refactor] F4 新增 AC 编号 ↔ 测试名一致性元测试（关联：审查 P1-6）
      — ✅（2026-09-12）`test/acceptance/ac-contract.spec.ts`：文档编号集合 vs `describe/it` 名编号集合，
      双向差集非空即红（支持 `AC-X-001/002` 斜杠简写展开）。先红（精确复现审查差集）后绿。

## 阶段 1（P1）：把「假绿」改成「可失败」

- [x] [refactor] F5 AC-CI-003 改为解析 workflow `run:` / `uses:` 步骤，禁止 substring（关联：审查 P1-3）
      — ✅（2026-09-12）`ac-ci.spec.ts` 极简步骤解析器（跳过注释、支持块标量）；AC-CI-002/003/004 按
      `run:` 命令断言；并反证注释里的 `bun run test` 不在解析结果中。
- [x] [refactor] F8 去 fixture 自证：AC-TWEET-001~004/007、AC-IG-001/002/006 改为「fixture 作输入 → 调解析/翻译函数 → 断言产出」（关联：审查 P2-1）
      — ✅（2026-09-12）改用 `mergeEntityTranslationsByIndex` / `stripTranslationsFromTweets` / `extractIGId`；
      AC-IG-006 真实调用 `translateIGCaption`（LLM 打桩），断言不改写 `post.description`；AC-TWEET-004
      恒真正则删除，改为实体文本前缀不变量。AC-IG-002 如实标注为 fixture 快照辅助检查。
- [x] [refactor] F9 补 AC-TRANS-002/005/006/007 的 `it('AC-...')` 命名 + 登记 `AC-TEST-006`（关联：审查 P1-6）
      — ✅（2026-09-12）三个 unit spec 的 `describe` 补 005/006/007 命名（002 已由 `AC-TRANS-001/002` 覆盖）；
      新增 `verify/acceptance-criteria/AC-test.md` 登记 `AC-TEST-006`；`AC-translation.md` 升 v1.1。

## 阶段 2（P2）：防复发

- [x] [refactor] F10 接入 `eslint-plugin-vitest`（`expect-expect` / `no-conditional-expect` / `no-standalone-expect`）（关联：审查 P2-3）
      — ✅（2026-09-12）复用 `@antfu/eslint-config` 已带的 `@vitest/eslint-plugin`（`test/` 命名空间）；
      立刻抓出 3 处条件断言（`api.screenshot.spec.ts`、`llms.spec.ts`、`share.spec.ts`）并修正。
- [x] [refactor] F12 修订 `verify/README.md` 不实表述（关联：审查 P1-1/P1-6）
      — ✅（2026-09-12）「1:1 可追溯」改为「由 `ac-contract.spec.ts` 元测试强制」；「裸跑永远绿」改为
      「诚实边界」小节；补 `--module` 白名单/零匹配守卫与 AC 文档总表。
- [x] [refactor] F13 清理 `--server` / `--server-port` no-op 参数标注 deprecated，并做 P3 类型打磨（关联：审查 P3）
      — ✅（2026-09-12）help 标 deprecated + 传参时打印弃用警告；`hasEntityType` 形参收窄为 `Entity['type']`。

## 暂不修复（所有者裁定 2026-09-12 延后归档）

> 裁决：测试相关基建收口，后续转功能开发；以下三条**暂不修复**，从活跃清单移除并归档于此。
> 若日后重启验证基建，可按此处的「剩余」描述直接续做。

- [~] [refactor] F7 集成层可失败化（关联：审查 P1-4）— 已修 AC-TWEET-006 `catch { return }` 半恒真 +
  AC-SHOT-001/002 条件断言（拆分 `it.skipIf`，有凭据用真实 fixture id 断言内容特征）。
  **剩余（暂不做）**：录制 fixture + msw 全量替换——需先解决「dev server 独立进程内 msw 拦不到其上游请求」
  的架构问题（进程内 route harness 或上游 base URL 注入）
- [~] [refactor] F6 静态扫描型 AC 逐条处置（关联：审查 P1-3）— 多数 AC 文档已如实标注「源码扫描/辅助检查」。
  **剩余（暂不做）**：逐条改名（`AC-*-SRC`）+ 关键路径改行为测试（多处需渲染/请求桩或 React hook 测试环境）
- [~] [refactor] F11 mutation testing 试点（关联：审查 P2-3）— **未执行**。
  **剩余（暂不做）**：Stryker 对 `app/lib/**` 纯函数跑一次变异体检（不入正式门禁）

> ⚠️ 复发性备忘：本类问题（验证名实不符）已复发一次（`review-2026-08-19` P1-1「AC-CARD-005 源码扫描冒充
> 渲染断言」→ `review-2026-09-11` P1-3）。防复发机制已落地（`ac-contract.spec.ts` 契约元测试 + eslint
> `test/*` 断言规则 + CLI 零匹配守卫 + `NODE_ENV` 自证），故可安全收口；详见
> [postmortem 011](../postmortem/011-verification-honesty.md)。
