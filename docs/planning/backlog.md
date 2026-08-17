# Backlog（任务清单）

**项目**: anonTweet | **最后更新**: 2026-08-17

> 未决任务跨阶段收拢。规划下一个阶段时从这里选任务；完成后勾选并（如为阶段计划）`git mv` 到 `docs/archive/`。
> 历史完成记录见 `docs/archive/TODO.md`。
> 本版排期依据：`docs/reviews/review-2026-08-17-apple-critique.md`（Apple 视角锐评与行动计划，最终版）。

## 约定

- 每个条目：`- [ ] <主题>（前置：... / 关联文档：...）`
- 技术债/重构用 `[refactor]` 前缀；UI 精修用 `[ui]` 前缀；体验/稳定性用 `[ux]` 前缀
- 需求变更需要文档跟进时，标注关联文档路径
- 条目尾注 `（工作量：X 人日 / DRI：X / 风险：X）` 便于排期
- 裁决语义：**采纳**（按排期做）/ **延后**（注明并入阶段）/ **删除**（进不做清单，附理由）
- 里程碑发布前，本清单应为空或全部注明延后理由

## 三阶段排期（2026-08-17 起）

### 阶段一（1-2 周）止血：门禁、规范、命门组件

> 验收：`bun run test` 190+ 全绿；`bun test` 不再红；`bun run verify/index.ts --exit-on-fail` 全绿；`bun run lint` 0 error；新增 `AC-RESOLVER-001`（三处选择链一致性）+ `test/unit/smart-pool.spec.ts`（≥6 用例）。

- [x] [refactor] 门禁命令统一与集成测试守卫（关联：review P3-1；文件：`CLAUDE.md`、`README.md`、`test/integration/*.spec.ts`；工作量：0.5 人日 / DRI：维护者 / 风险：低）— ✅ 完成（2026-08-17）：CLAUDE.md 强制命令改指 `bun run test`；`testEnv.hasServer` 无服务器时 `describe.skipIf`；`env.server.ts` 抽 `createEnv` 纯函数（双 runner 兼容）；裸 `bun test` 的并行 export 竞态（Bun 1.3.14/1.4 均有）以 `--parallel=2` 规避
- [x] [refactor] SmartPool 限流/冷却/失败隔离重构 + 单测（关联：review P1-1；文件：`app/lib/SmartPool.ts`、`test/unit/smart-pool.spec.ts`；工作量：2-3 人日 / DRI：核心后端 / 风险：中，改核心链路需 mock 回归）— ✅ 完成（2026-08-17）：per-key `cooldownUntil` / `failStreak` / `inFlight`，单 Key 指数退避，耗尽抛聚合错误；`test/unit/smart-pool.spec.ts` 8 用例
- [x] [refactor] Translation View Resolver 收敛（原 backlog L24 采纳；关联：review P2-3；文件：`app/hooks/use-translation-editor-logic.ts`、`use-alt-translation-logic.ts`、`app/lib/translation/resolveEntities.ts`；工作量：1-2 人日 / 风险：中，hot files）— ✅ 完成（2026-08-17）：新增 `deriveManualTranslation` 纯函数 + `AC-RESOLVER-001`（源码扫描 + 7 组单测一致性断言），两 hook 复用，无内联选择链
- [x] [refactor] `catch any` / 空 catch 清零（关联：review P2-2；文件：`app/routes/api/tweet/get.ts` L54/L142、`ai-translation.ts` L118/L142/L190、`bili-post.tsx` L111；工作量：1 人日 / 风险：低）— ✅ 完成（2026-08-17）：全部收窄为 `catch (error: unknown)` + `instanceof Error`，空 catch 补结构化 console
- [x] [ux] Bili 隐藏功能卫生化（关联：review P2-1；文件：`app/routes/api/bili-post.tsx`、`docs/INDEX.md`、`docs/planning/project-architecture.md`；工作量：1 人日 / 风险：低）— ✅ 完成（2026-08-17）：`ENABLE_BILI` 开关（**默认开启**，所有者手动确认；隐藏自用入口始终可用）+ INDEX/§2.5 文档标注 + IP 暴露与明文 Cookie 过境列入已知限制

### 阶段二（3-6 周）核心体验：翻译不阻塞、性能基座、隐私加固

> 验收：新增 `AC-PERF-001`（截图渲染时长基线×回归阈值）与 `AC-SEC-001`（非白名单 baseUrl 拒绝）且 verify 全绿；`GET /api/tweet/get` source scan 无内联 LLM 调用。

- [ ] [ux] GET 与 AI 翻译解耦 + AI 端点流式化（原 backlog L26 前半采纳；关联：review P1-2；文件：`app/routes/api/tweet/get.ts`、`app/routes/api/ai/ai-translation.ts`、客户端 hooks；工作量：3-5 人日 / 风险：高，数据流变更涉及编辑器联动）— GET 默认只回缓存/原文；翻译走 `/api/ai-translation` 客户端触发；服务端 AI 调用加 `AbortController.timeout`
- [ ] [ux] 长链推文/大量媒体渲染与截图性能（原 backlog L19 采纳；关联：review 阶段二；文件：`verify/acceptance-criteria/AC-screenshot.md` 扩、`plain.tsx`、`plain-ig.tsx`；工作量：2-3 人日 / 风险：中）— 与 ADR-008 媒体代理统一（S7 待实施）耦合，一并做
- [ ] [refactor] 可观测性：翻译耗时/缓存命中率/RettiwtPool 状态结构化日志（原 backlog L26 后半采纳；关联：review 阶段二；文件：`app/lib/translation/`、`app/lib/SmartPool.ts`；工作量：2 人日）— 为阶段三缓存规模化提供指标
- [ ] [ux] 隐私加固：`baseUrl` 白名单 + 隐私页披露（关联：review P1-3；文件：`app/routes/api/ai/vision.ts`、`ai-translation.ts`、设置页；工作量：1-2 人日）— 仅放行已知提供商域名；设置页声明"Key 经服务器中继"

### 阶段三（7-8 周+）护城河：Vision 闭环、流式编辑器、Story 接入、缓存规模化

> 验收：AC-VISION-008 手动项转自动断言；新增 `AC-IG-STORY-001~003`（story 提取/渲染/缓存）且 verify 全绿；缓存命中率 → 结构化日志报表。

- [ ] [refactor] AI Vision 截图导出 E2E 闭环（关联：review 阶段三；文件：`plain.tsx`、`app/components/tweet/AIVisionBlock.tsx`；前置：阶段二可观测性）
- [ ] [refactor] 编辑器兼容 stream（原 backlog L25 延后并入；关联：review；文件：`app/components/translation/TranslationEditor.tsx`、`resolveTranslationView.ts` isAIStream 扩展；前置：阶段二 GET 解耦流式化）
- [ ] [ux] Instagram Story 接入（原 backlog L20 采纳延后；关联：review 不做清单末行；文件：`app/routes/api/ig/get.ts` 扩展、`IGCaption`/`PlainIGPost` 渲染；前置：SDK `@chilfish/gallery-dl-instagram` 已验证；先写 `AC-IG-STORY` + fixture 再实现；风险：中，上游接口漂移需 fixture 维护余量）
- [ ] [refactor] 三层缓存规模化与命中率指标（文件：`app/lib/service/getTweet.server.ts`；前置：阶段二可观测性）

## 不做清单（裁决为删除/延后，Apple 式减法）

| 条目                         | 裁决           | 理由                                                                                      |
| ---------------------------- | -------------- | ----------------------------------------------------------------------------------------- |
| Threads / Bluesky 等新数据源 | 删除（不接）   | 产品定位（工具 vs 平台）裁决前一律不接（review Q1）                                       |
| Bili 发布功能扩展            | 延后（无限期） | 保留为隐藏自用入口，不宣传、不扩展、仅卫生化（review P2-1）                               |
| 编辑器 stream 单独立项       | 延后           | 与阶段二"翻译流式化"合并，不单独立项（review backlog 裁决）                               |
| IG Story 提前到阶段二        | 延后           | 价值密度低于核心体验修复；SDK 已验证但逆向接口随版本漂移，排期靠后（review 不做清单末行） |
| 视觉模型训练 / 微调          | 删除（不接）   | `docs/features/ai-vision/ai-vision.md` §1.3 已明确非目标，维持                            |

## 原未决条目裁决明细（2026-08-17）

| 原条目                                           | 裁决                                            | 理由                                                                                                       |
| ------------------------------------------------ | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| [ux] 长链推文/大量媒体渲染与截图性能（L19）      | **采纳** → 阶段二                               | 对应 review P1-2/性能预算；与 ADR-008 媒体代理统一耦合                                                     |
| [ux] Instagram Story 支持（L20）                 | **采纳（延后）** → 阶段三                       | 所有者确认保留 todo；SDK `@chilfish/gallery-dl-instagram` 已验证可接入，成本可控；价值密度低于核心体验修复 |
| [refactor] Translation View Resolver 收敛（L24） | **采纳** → 阶段一                               | review P2-3 证据确凿（两 hook 重复链），低风险高收益                                                       |
| [refactor] 编辑器兼容 stream（L25）              | **延后** → 阶段二/三                            | 当前管线为非流式 generateText；先做"GET 不阻塞"再谈流式编辑                                                |
| [refactor] 性能：并发/限流策略 + 可观测性（L26） | **采纳（拆分）** → 限流进阶段一、可观测进阶段二 | 限流 = SmartPool 重构（review P1-1）；可观测 = 阶段二任务                                                  |
