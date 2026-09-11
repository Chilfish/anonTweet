# Backlog（任务清单）

**项目**: anonTweet | **最后更新**: 2026-09-11

> 本清单**只保留当前阶段关注的未决任务**，不累积已完成条目。规划下一阶段时从这里选任务；条目完成后移入归档。
> 已完成归档：[backlog-completed-2026-09-11.md](../archive/backlog-completed-2026-09-11.md)（三阶段排期已完成条目 + 原未决条目裁决明细）；历史完成记录：[TODO.md](../archive/TODO.md)。

## 约定

- 每个条目：`- [ ] <主题>（前置：... / 关联文档：...）`
- 技术债/重构用 `[refactor]` 前缀；UI 精修用 `[ui]` 前缀；体验/稳定性用 `[ux]` 前缀
- 需求变更需要文档跟进时，标注关联文档路径
- 条目尾注 `（工作量：X 人日 / DRI：X / 风险：X）` 便于排期
- 裁决语义：**采纳**（按排期做）/ **延后**（注明并入阶段）/ **删除**（进不做清单，附理由）
- 里程碑发布前，本清单应为空或全部注明延后理由

## 当前焦点：验证诚信修复（2026-09-11 审查发现）

> 来源：`docs/reviews/review-2026-09-11-test-suite-honesty.md`。**核心问题**：unit 层是真测试，但 acceptance 层大量「扫源码字符串」、integration 层「裸跑永远绿」，且 `--ac` / `--module` 选不中用例时 exit 0 → 「verify 全绿」对部分功能不携带信号；同时门禁命令当前因 dev server 崩溃而变红。编号 F1~F13 对应审查文档 §4。

### 阶段 0（P0）先做：让门禁重新可信

- [ ] [refactor] F1 修复 dev server 启动崩溃（`jsxDEV is not a function` / `Cannot access 'abort' before initialization`），恢复 `bun run verify/index.ts --exit-on-fail` 可跑满三层（关联：审查 P1-5；文件：待定位 `vite.config.ts` / React·Vite·Bun jsx runtime 配置；工作量：0.5-2 人日 / 风险：中，可能涉版本与 jsx runtime）— ⚠️ 阻塞项：不修则所有 integration 修复无法验证
- [ ] [refactor] F2 `verify/index.ts` 零匹配守卫 + 修正模块别名映射（translation→`AC-TRANS` / screenshot→`AC-SHOT`+`AC-PERF` / postmortem→`AC-PM`）+ `--module` 白名单启动校验（关联：审查 P1-1；文件：`verify/index.ts` L46-71；工作量：0.5 人日 / 风险：低）— 验收：未知 AC/模块 exit≠0，文档给出的 `--module` 命令真跑对应用例
- [ ] [refactor] F3 删除 `ac-sec.spec.ts` 死 `return`（`// 暂时不管他`），如实标注或补齐 AC-SEC-001 P3 设置页披露断言（关联：审查 P1-2；文件：`test/acceptance/ac-sec.spec.ts` L78-79（死分支）、`verify/acceptance-criteria/AC-sec.md`；工作量：0.1-0.5 人日 / 风险：低）
- [ ] [refactor] F4 新增 AC 编号 ↔ 测试名一致性元测试（扫描 `verify/acceptance-criteria/*.md` vs `test/**` 的 `it('AC-...')`，差集非空即失败）（关联：审查 P1-6；文件：`test/acceptance/ac-contract.spec.ts`（新）；工作量：0.5 人日 / 风险：低）

### 阶段 1（P1）把「假绿」改成「可失败」

- [ ] [refactor] F5 AC-CI-003 改为解析 workflow `run:` / `uses:` 步骤，禁止 substring（当前被 `verify.yml` L48 注释误判为通过）（关联：审查 P1-3；文件：`test/acceptance/ac-ci.spec.ts`；工作量：0.3 人日 / 风险：低）
- [ ] [refactor] F6 静态扫描型 AC 逐条处置：降级为「辅助检查」并如实改名，或改真行为测试（media 004/005/006、obs、decouple、resolver、sec P2、shot 003/004、vision 008/009/010、ui、pwa、card 004/009）（关联：审查 P1-3；文件：`test/acceptance/*` + 对应 `AC-*.md`；前置：所有者裁决「降级 vs 重写」；工作量：3-6 人日 / 风险：中，需引入 msw 等）
- [ ] [refactor] F7 集成层可失败化：CI 注入真 key 或录制 fixture + msw；AC-SHOT-001/002 改真实 fixture id 并断言内容特征；AC-TWEET-006 去掉 `catch { return }` 半恒真（关联：审查 P1-4；文件：`test/integration/*`、`.github/workflows/verify.yml`；前置：所有者裁决集成策略；工作量：2-4 人日 / 风险：中）
- [ ] [refactor] F8 去 fixture 自证：AC-TWEET-001~004/007、AC-IG-001/002/006 改为「fixture 作输入 → 调解析/翻译函数 → 断言产出」（AC-IG-006 需真正调用 `translateIGCaption`）（关联：审查 P2-1；文件：`test/acceptance/ac-tweet.spec.ts`、`ac-ig.spec.ts`；工作量：1-2 人日 / 风险：低）
- [ ] [refactor] F9 补 AC-TRANS-002/005/006/007 的 `it('AC-...')` 命名（部分语义已有单测覆盖，仅需对齐命名/文档，不重复造测试）+ 登记 `AC-TEST-006`（关联：审查 P1-6；文件：`test/unit/*`、`verify/acceptance-criteria/AC-translation.md`；工作量：0.5-1 人日 / 风险：低）

### 阶段 2（P2）防复发

- [ ] [refactor] F10 接入 `eslint-plugin-vitest`（`expect-expect` / `no-conditional-expect` / `no-standalone-expect`），把「每条 `it` 至少一条断言」变为机器可查（关联：审查 P2-3；文件：`eslint.config.mjs`；工作量：1 人日 / 风险：低）
- [ ] [refactor] F11 mutation testing 试点（Stryker，先跑 `app/lib/**` 纯函数，观察存活变异体）（关联：审查 P2-3；前置：所有者裁决是否入正式门禁；工作量：2-3 人日 / 风险：低）
- [ ] [refactor] F12 修订 `verify/README.md` 不实表述（「AC 编号即测试名，1:1 可追溯」不成立；「裸跑永远绿」是缺陷而非卖点）（关联：审查 P1-1/P1-6；文件：`verify/README.md`；工作量：0.2 人日 / 风险：低）
- [ ] [refactor] F13 清理 `--server` / `--server-port` no-op 参数标注 deprecated，并做 P3 类型打磨（`hasEntityType` 形参收窄为联合类型）（关联：审查 P3；文件：`verify/index.ts`、`test/acceptance/ac-tweet.spec.ts`；工作量：0.3 人日 / 风险：低）

> ⚠️ 复发性：本类问题已复发一次（`review-2026-08-19` P1-1「AC-CARD-005 源码扫描冒充渲染断言」→ 本次 P1-3）。开放问题 4：是否按 CLAUDE.md 规则 4 沉淀 postmortem 010（「验证名实不符 / 空跑报绿」）。

## 下一阶段候选（原三阶段排期剩余）

> 阶段一/二已完成、阶段三部分完成，已完成条目见 [归档](../archive/backlog-completed-2026-09-11.md)。以下为尚未开工的条目，规划下一阶段时按价值取舍。

- [ ] [ux] AI 端点 stream 化 + 编辑器兼容 stream（合并原「AI 端点 stream 化」与「编辑器兼容 stream」两项；文件：`app/routes/api/ai/ai-translation.ts`、`app/components/translation/TranslationEditor.tsx`、`app/lib/translation/resolveTranslationView.ts` isAIStream 扩展、客户端 hooks；工作量：3-5 人日 / 风险：高）— 当前管线为非流式 `generateText`；先做端点流式化，再把 stream 映射到 overlay 编辑器
- [ ] [refactor] AI Vision 截图导出 E2E 闭环（关联：review-2026-08-17 阶段三；文件：`plain.tsx`、`app/components/tweet/AIVisionBlock.tsx`；前置：阶段二可观测性）
- [ ] [refactor] 三层缓存规模化与命中率指标（文件：`app/lib/service/getTweet.server.ts`；前置：阶段二可观测性）
- [ ] [ux] Instagram Story 接入（关联：review-2026-08-17 不做清单末行；文件：`app/routes/api/ig/get.ts` 扩展、`IGCaption`/`PlainIGPost` 渲染；前置：SDK `@chilfish/gallery-dl-instagram` 已验证；先写 `AC-IG-STORY` + fixture 再实现；风险：中，上游接口漂移需 fixture 维护余量）
- [ ] [refactor] 视觉基线接入：chromatic 或本地截图 diff 对比（文件：`.storybook/main.ts`、CI；工作量：1-2 人日 / 风险：中，需 owner 定基线形态）— 🔄 大进展（2026-08-19）：**addon-vitest 接线完成**——`@vitest/browser` + `@vitest/browser-playwright` + chromium 已装，`vitest.config.ts` 新增 `storybook` 项目，`bun run test:storybook` 28 files / 137 tests 全过（真实浏览器渲染 + axe）；AC-UI-VISION-001 / AC-UI-A11Y-001 已落地；`bun run build-storybook` 已并入 pre-push。**剩余：基线形态待 owner 拍板**（review 开放问题 1：chromatic 云服务 vs 本地截图 diff）与 CI 中 chromium 安装/门禁收编（storybook 测试暂不进 pre-push，避免 CI 依赖浏览器二进制下载）

## 独立增量

> 阶段计划之外、按需推进的增量项，完成后勾选、移入归档。

- [ ] [ux] 可安装 PWA + Web Share Target：系统分享 X/IG 链接直达推文/IG（方案：`docs/features/pwa/web-share-target.md`；AC：`verify/acceptance-criteria/AC-pwa.md`；域名：https://anon-tweet.chilfish.top/）— ✅ 已实现（AC-PWA-001/002/003 落地）；✅ 能力盘点（`docs/features/pwa/capability-audit.md`，2026-09-06：线上与仓库同步、SW #6900 健康）；✅ 场景落地（2026-09-06，AC-pwa.md v1.3 AC-PWA-004~008）：iOS 安装外壳 meta（apple-touch-icon + apple-mobile-web-app-\*）+ manifest shortcuts(/search)/screenshots(wide/narrow 真实截图) + share 出向（navigator.share，降级复制原文链接）+ share 截图（卡片图转 File 走 Web Share L2 files，不支持降级下载）+ 版本更新提示（可见/聚焦探测新 SW → 横幅「立即刷新」，首次访问不打扰，AC-PWA-008）。**剩余：真机验证**（安装 + 系统分享进出 + iOS 添加主屏幕 + 安装对话框截图，沙箱无设备）+ 视觉验收（图标/theme_color/maskable/apple-touch-icon 底色）。P2 候选（showSaveFilePicker / 最近查看 / 静态缓存需 ADR）见 capability-audit.md。

## 不做清单（裁决为删除/延后，Apple 式减法）

| 条目                         | 裁决           | 理由                                                                                             |
| ---------------------------- | -------------- | ------------------------------------------------------------------------------------------------ |
| Threads / Bluesky 等新数据源 | 删除（不接）   | 产品定位（工具 vs 平台）裁决前一律不接（review Q1）                                              |
| Bili 发布功能扩展            | 延后（无限期） | 保留为隐藏自用入口，不宣传、不扩展、仅卫生化（review P2-1）                                      |
| 编辑器 stream 单独立项       | 延后           | 与"翻译流式化"合并，不单独立项（review backlog 裁决）                                            |
| IG Story 提前到阶段二        | 延后           | 价值密度低于核心体验修复；SDK 已验证但逆向接口随版本漂移，排期靠后（review 不做清单末行）        |
| 视觉模型训练 / 微调          | 删除（不接）   | `docs/features/ai-vision/ai-vision.md` §1.3 已明确非目标，维持                                   |
| 外链离开匿名环境提示/设置项  | 删除（不接）   | **所有者裁定（2026-08-19）**：「外链这件事不用管它」；链接卡跳转外部为目标行为，不设提示         |
| jetfuel 官方改版巡检专项     | 删除（不接）   | **所有者裁定（2026-08-19）**：解析改版直接回退普通卡，用户感知反馈后再更新解析程序，不设巡检机制 |

## 归档记录

| 日期       | 内容                                                                          | 去向                                                                              |
| ---------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 2026-09-11 | 三阶段排期（阶段一全部 / 阶段二除 2 项 / 阶段三已完成 2 项）已完成条目 + 原未决条目裁决明细 | [archive/backlog-completed-2026-09-11.md](../archive/backlog-completed-2026-09-11.md) |
| 2026-08    | 历史规划（已完成记录 + 约束 + 待办）                                          | [archive/TODO.md](../archive/TODO.md)                                             |
