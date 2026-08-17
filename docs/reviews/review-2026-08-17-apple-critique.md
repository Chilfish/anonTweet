# Anon Tweet Apple 视角锐评与行动计划（2026-08-17 · 最终版）

> 依据：CLAUDE.md / docs/INDEX.md / planning/backlog.md / planning/architecture.md / planning/project-architecture.md / postmortem/README.md / features/{translation,instagram,ai-vision} / engineering/{code-style,git-workflow} / 代码抽查（SmartPool.ts、resolveTranslationView.ts、app/routes/api/_、verify/acceptance-criteria/_）及实测命令结果。修订说明：bili 经所有者确认为隐藏自用测试入口（不宣传、保留），IG Story 保留 todo（SDK 已验证可接入），本版按此裁决重写。

## 1. 执行摘要

- **P1 数据源命门**：RettiwtPool（`app/lib/SmartPool.ts`，零测试）无限流、无冷却、无失败隔离，多 Key 是轮盘赌不是池——全站数据源稳定性的第一风险。
- **P1 首访体验**：开启 AI 翻译后 `POST /api/tweet/get` 阻塞等待 1~2 次 LLM 完整返回（`app/routes/api/tweet/get.ts` L64-125），分钟级首屏，而现成解法的 AI 端点与 `isAIStream` 管线未接线。
- **P1 隐私面**："匿名"承诺与数据流相悖：自带 Key 全走服务端中继、客户端可传任意 `baseUrl`（`ai/vision.ts` L32）构成 SSRF/滥用面；bili 已定自用，该面部分收敛但 baseUrl 项独立存在。
- **P1 命令面失真**：CLAUDE.md 强制"每 commit 跑 `bun test`"，实测其拉起集成层、红 20 项；真实门禁 `bun run test` 190/190 绿——照文档跑的开发者必然撞墙。
- **P2 隐藏功能卫生**：bili 发布代理按所有者意图保留为自用隐藏入口，但未文档化、无 AC、`catch any`（L111）、且存在自记缺陷"IP 来源暴露在服务器"（project-architecture.md L94）——保留，但需加固。
- 亮点（事实非客套）：`bun run verify/index.ts --exit-on-fail` 实测 197/197 绿；AC-VISION-001~012 含反幻觉断言，验证体系是优良实践。
- backlog 五条裁决：3 采纳、2 延后/并入；IG Story 保留 todo（SDK 已验证，排期靠后）。
- 三阶段：1-2 周止血 → 3-6 周核心体验 → 7-8 周+ 护城河与规模化。
- 前提问题：产品定位（工具 vs 平台）仍待拍板，决定后续新功能取舍与宣传口径。

## 2. 评价框架（8 条检验标准）

| #   | 标准       | 探针问题                                                                       |
| --- | ---------- | ------------------------------------------------------------------------------ |
| 1   | 聚焦减法   | 主干上每个功能能否一句话说清"为谁解决什么"？砍不掉的存量有多少？               |
| 2   | 端到端拥有 | 输入 URL → 解析 → 翻译 → 截图 → 导出，是否一条链路完整拥有、无断点无重复实现？ |
| 3   | 工艺细节   | 渲染/字体/截图/空态/错误态是否达交付级？是否容忍"shame bug"？                  |
| 4   | 隐私信任   | "匿名"承诺与真实数据流一致吗？最敏感数据（Key/Cookie）实际在谁的机器上出网？   |
| 5   | 性能预算   | 核心路径（首访→翻译→截图）有无可测量基线（LCP/耗时/字节）？                    |
| 6   | 测试纪律   | 高频雷区文件有无单测？失败/跳过语义是否确定？门禁命令是否真实可跑？            |
| 7   | 复杂度税   | 决策链/合并逻辑是否单一实现？兼容层在收敛还是叠加？                            |
| 8   | 流程责任   | 每个改动是否有 DRI、AC、文档同步、postmortem 闭环？                            |

## 3. 锐评报告（P1 → P3）

### P1-1 数据源命门 RettiwtPool：多 Key 轮询池无池化能力

- 【问题】429 后无冷却、无 backoff、无并发隔离、无 per-key 健康状态；默认单 Key（无 `TWEET_KEYS`）一次 429 即抛"All keys exhausted"。
- 【证据】`app/lib/SmartPool.ts`：`run()` 递归重试 L25-60；耗尽即抛 L39-41；`rotateKey()` 仅 `(i+1)%len` L66-68；`shouldRetry()` 只判状态码 L91-96；实例缓存按 key L70-82；**`test/` 下无任何 SmartPool/RettiwtPool 用例**（grep 零命中）；`app/lib/react-tweet/utils/get-tweet.ts` L18 全局单例 `twitterPool`。ADR-002（architecture.md L28-37）声称"429/401/403 自动故障转移"，未兑现限流语义。
- 【影响】P1（标准 5/6）：Twitter 私有 API 严格限流下，多 Key 同时被烧穿、单 Key 用户必挂；零测试触碰 postmortem #001 头号雷区。
- 【Apple 会怎么做】标准 5：为命门组件定性能与故障预算；标准 6：基础设施级组件必有单测与前摄。
- 【建议】重构 `app/lib/SmartPool.ts`：per-key `cooldownUntil` / in-flight 计数、429 按冷却轮换、单 Key 指数退避、`shouldRetry` 改入参化错误分类；新增 `test/unit/smart-pool.spec.ts`（注入 mock Fetcher，断言轮换/耗尽/冷却）。验证：`bun run test` + verify tweet 模块。
- 【成本】中（2-3 人日）/ 风险中（改核心链路需回归）/ 收益高（数据源稳定性）。

### P1-2 翻译决策链与 AI 调用阻塞首屏

- 【问题】开启 AI 翻译后，拉推文即同步等 1~2 次 LLM（含 quoted tweet）完成才响应；服务端无超时、无流式，最坏叠加 max 档思考（budget 32768，见 project-architecture.md L213-220）。
- 【证据】`app/routes/api/tweet/get.ts` L64-125：`Promise.all` 双路 `autoTranslateTweet` L81-102；catch 吞错仍正常返回 L121-123；`appConfig.ts` L84 默认 `enableAITranslation: false`（触发即核心卖点路径）；客户端另有 `/api/ai-translation` 端点（`ai-translation.ts`）与 `isAIStream` 渲染管线（`resolveTranslationView.ts` L35-36）可用而未用。
- 【影响】P1（标准 5/2）：首访分钟级延迟，Serverless 上叠加超时与计费；已知解法已存在却未接线。
- 【Apple 会怎么做】标准 5：性能预算 + 骨架先行、关键路径不等待后台任务（先渲染原文，翻译就绪再注入）。
- 【建议】`tweet/get.ts` GET 路径默认只回缓存/原文；翻译统一走 `/api/ai-translation`（客户端触发、可流式）；服务端 AI 调用加超时（`AbortController.timeout`）。验证：新增 AC-XXX「GET 不内联 LLM」source scan + `bun run verify/index.ts --exit-on-fail`。
- 【成本】中（2-3 人日）/ 风险中（数据流变更）/ 收益高（首屏秒级）。

### P1-3 "匿名"承诺与数据流相悖：BFF 成为 Key 中继与 SSRF 面

- 【问题】产品名 Anon Tweet，但用户自带 Key 全部经服务端出网；`baseUrl` 由客户端任意指定，服务端成为任意 LLM 端点的代理。
- 【证据】`ai/vision.ts` L28-36 `apiKey: z.string().min(1)` 必填于请求体、`baseUrl: z.string().optional()`；`ai-translation.ts` 同构；服务端 `fetch` 媒体见 ai-vision.md §4.4；bili 已定自用（其 Cookie 中继面收敛，不再计入本项）。
- 【影响】P1（标准 4）：用户"匿名"是伪承诺；开放 baseUrl = SSRF/滥用面，公共部署时是审计与封禁风险。本项不依赖 bili，独立成立。
- 【Apple 会怎么做】标准 4：隐私是产品特性——数据最小化、客户端优先（App 内 on-device Key）、披露真实路径。
- 【建议】`vision.ts`/`ai-translation.ts` 的 `baseUrl` 加白名单校验（仅已知提供商域名）；隐私页如实声明"Key 经服务器中继"（设置页）。验证：补 AC-SEC 校验拒绝非白名单 baseUrl。
- 【成本】低-中 / 风险低 / 收益：合规与信任。

### P2-1 隐藏功能卫生缺失：Bili 发布代理保留自用但未加固

- 【问题】按所有者意图保留为自用隐藏测试入口（不宣传），但代码层面未文档化、无 AC、存在规范违反与已知缺陷——隐藏功能不等于免于卫生检查。
- 【证据】`app/routes/api/bili-post.tsx` L17-115（FormData 收 Cookie L25、`Cookie` 头直达 axios L40、`catch (error: any)` L111、`data: any` L48）；commit `08017c0` / `705c5d4`（POC）均在 main；project-architecture.md L90-94 自记缺陷"未实现指定代理，所有发送到B站动态的ip来源都来自服务器IP"；`docs/INDEX.md` 导航、`backlog.md`、`verify/acceptance-criteria/` 均无该功能记录。
- 【影响】P2（标准 8/6）：自用场景风险可控，但代码可被任意 self-host 者触及：隐藏入口无开关、凭据经 FormData 明文过境、`catch any` 违反强制规范；一旦外泄即成本项目风险。
- 【Apple 会怎么做】标准 1/8：Apple 的内部诊断入口同样受工程纪律约束；隐藏 ≠ 豁免审查，且默认关闭、明确隔离。
- 【建议】保留功能，做四项卫生化：① `ENABLE_BILI` 环境开关（默认关，仅自部署显式开启）；② 在 `docs/INDEX.md` 与 `project-architecture.md` 标注"隐藏自用入口，非产品功能，不宣传"；③ 修 `catch (error: any)`（L111）与 `data: any`（L48）；④ 将 IP 暴露缺陷记入 postmortem 已知限制或补代理出口。验证：`bun run lint && bun run typecheck && bun run verify/index.ts --exit-on-fail`。
- 【成本】低（1 人日）/ 风险低 / 收益：自用照常、卫生达标、自托管者面受控。

### P2-2 强制规范自打脸：`catch any` 与空捕获在主干存在

- 【问题】"catch 用 unknown"是 🔴 强制规范，主干多处在用 `any` 并吞错。
- 【证据】`tweet/get.ts` L54、L142 `catch (error: any)`；`ai-translation.ts` L118 `tweet: any`、L142 `(e: any)`、L190 `catch {}`；`bili-post.tsx` L111；`SmartPool.ts` L92-94 `(error as any)` 与 project-architecture.md L138"类型安全"声明相悖。
- 【影响】P2（标准 6/8）：规范失信 + 吞错制造调试黑洞（正是 #009 类问题的复发土壤）。
- 【建议】`catch (error: unknown)` + `instanceof Error` 收窄；空 catch 补结构化 console。验证：`bun run lint`（@antfu 可自动纠）+ typecheck。
- 【成本】低（1 人日）/ 风险低 / 收益：规范可执行。

### P2-3 复杂度税仍在累积：决策链四处重复

- 【问题】"人工 > 新版 AI > 旧版 AI > 原文"优先级已在 `resolveTranslationView.ts` 收敛，hooks 又各写一遍。
- 【证据】`app/hooks/use-translation-editor-logic.ts` L28-42、`use-alt-translation-logic.ts` L29-53 各自重实现选择链；postmortem #009 已指出按 index 合并曾四处漂移；backlog L24 条目自认。
- 【影响】P2（标准 7）：三处行为一旦漂移即复发 #009 类数据丢失。
- 【建议】`resolveEntities.ts` 导出 `deriveManualTranslation(entities)` 等纯函数，两 hook 复用；spec 断言三处结果一致。验证：`bun run test` + verify translation 模块。
- 【成本】低-中 / 风险中（hot files：postmortem 热点表） / 收益高。

### P2-4 文档腐烂：唯一入口在骗人

- 【问题】架构/功能文档多处滞后于 main 代码。
- 【证据】project-architecture.md L7/L11"React Router v7" vs ADR-001/CLAUDE.md"v8"；L63/L78 两个 §2.3 小节；ai-vision.md L4"状态：尚未实现" vs main 上 12+ commit（309f62a 等，含 `app/routes/api/ai/vision.ts`、AC-VISION-001~~012 全落地）；ai-vision.md §6"AC-VISION-001~~008" vs AC-vision.md L162 实为 12 条；bili 功能完全未入文档体系（见 P2-1）。
- 【影响】P2（标准 8）：文档先行机制失守，新成员按 INDEX 取到的信息是错的。
- 【建议】同步 ai-vision.md 状态与 AC 数、修 project-architecture.md 版本号与章节号、补 bili 隐藏入口标注；把"文档同步"纳入 PR 审查清单执行（git-workflow.md L114 已有条款）。
- 【成本】低（1 人日）/ 风险低。

### P3-1 命令面失真：CLAUDE.md 强制命令实测红 20 项

- 【问题】文档指定 `bun test`，lefthook 真门禁是 `bun run test`（unit+acceptance）；两者行为不同。
- 【证据】CLAUDE.md「每个 commit 提交前本地跑 … bun test」；`lefthook.yml` L12 `bun run test`；**实测 `bun test` 在本工作区 142 项中 20 失败 2 error**，根因报错 `Test server URL not available — run integration tests via bun run test:integration`（`test/integration` 无服务器守卫即红，不 skip）；`bun run test` 实测 190/190 绿，`bun run test:integration` 需 21-56s 冷启动（commit 5e0b69e）。
- 【影响】P3（标准 6）：按文档跑的开发者必遇红色套件，滋生 `--no-verify` 文化。
- 【建议】CLAUDE.md/INDEX.md 命令改指 `bun run test`；`test/integration/*.spec.ts` 的 `testEnv` 无服务器时 `describe.skipIf`（对齐 API.ig/tweet 的凭据守卫写法）。验证：`bun test` 转绿。
- 【成本】极低（0.5 人日）。

### P3-2 小瑕疵：命名漂移与裸数组返回

- 【问题】"6 级决策链"实为 8 分支（translation.md §5.1 表 7 行、`resolveTranslationView.ts` 8 个 return 分支）；`tweet/get.ts` L46-48 非法 ID 裸返回 `[]`，与 `data()` 封装风格不一致。
- 【建议】文档对齐分支数；统一错误契约。成本：低。

## 4. 行动计划

### 阶段一（1-2 周）止血：门禁、规范、命门组件

- **目标**：命令面统一 + `catch any` 清零 + SmartPool 带测试 + Resolver 收敛 + bili 卫生化；**验收**：`bun run test` 190+ 全绿、`bun test` 不再红、`bun run verify/index.ts --exit-on-fail` 全绿、lint 无 error、新增 `AC-RESOLVER-001`（三处选择链一致性）与 smart-pool.spec（≥6 用例）。
- **任务**：
  1. 门禁命令统一与集成测试守卫（`CLAUDE.md`、`README.md`、`test/integration/*`）— 0.5 人日 — DRI 建议：维护者本人 — 风险：低。
  2. SmartPool 重构 + 单测（`app/lib/SmartPool.ts`、`test/unit/smart-pool.spec.ts`）— 2-3 人日 — DRI：核心后端 — 风险：中（需 mock 回归）。
  3. Resolver 收敛（`use-translation-editor-logic.ts`、`use-alt-translation-logic.ts`、`resolveEntities.ts`）— 1-2 人日 — 风险：中（hot files）。
  4. `catch any`/空 catch 清零（`tweet/get.ts`、`ai-translation.ts`、`bili-post.tsx` 等）— 1 人日 — 风险：低。
  5. Bili 隐藏功能卫生化：`ENABLE_BILI` 开关（默认关）+ 文档标注自用 + 已知限制记录 — 1 人日 — 风险：低。
- **不做**：bili 功能扩展、Story 接入。

### 阶段二（3-6 周）核心体验：翻译不阻塞、性能基座、隐私加固

- **目标**：GET 与 AI 解耦、长链/截图性能有基线、翻译可观测、baseUrl 白名单。**验收**：新增 `AC-PERF-001`（截图渲染时长基线 × 回归阈值）与 `AC-SEC-001`（非白名单 baseUrl 拒绝）；`GET /api/tweet/get` source scan 无内联 LLM 调用。
- **任务**：
  1. GET 解耦 + AI 端点流式化（`app/routes/api/tweet/get.ts`、`ai-translation.ts`、客户端 hooks）— 3-5 人日 — 风险：高（数据流变更，编辑器联动）。
  2. 性能基线 + 长链/多媒体验证（`verify/acceptance-criteria/AC-screenshot.md` 扩、plain 路由）— 2-3 人日 — 风险：中。
  3. 可观测性：翻译耗时/缓存命中率/RettiwtPool 状态结构化日志（`app/lib/translation/`、`SmartPool.ts`）— 2 人日。
  4. 隐私加固：`baseUrl` 白名单 + 隐私页披露（`vision.ts`、`ai-translation.ts`、设置页）— 1-2 人日。
- **不做**：新平台、编辑器 stream 单独立项。

### 阶段三（7-8 周+）护城河：Vision 闭环、流式编辑器、Story 接入、缓存规模化

- **目标**：AI Vision 端到端（对齐 AC-VISION-008 手动项自动化）、编辑器 stream 渲染、IG Story 接入（SDK `@chilfish/gallery-dl-instagram` 已验证）、三层缓存命中率指标达标。**验收**：AC-VISION-008 手动项转自动断言；新增 `AC-IG-STORY-001~003`（story 提取/渲染/缓存）且 verify 全绿；缓存命中率 → 结构化日志报表。
- **任务**：Vision 截图 E2E（`plain.tsx`、AIVisionBlock）→ stream 编辑器（`TranslationEditor.tsx`、resolveTranslationView isAIStream 扩展）→ IG Story（先验证 SDK story 接口 + fixture，再 `app/routes/api/ig/get.ts` 扩展 + `IGCaption`/`PlainIGPost` 渲染）→ DB 缓存规模化（`getTweet.server.ts`）。
- **不做**：多平台扩张、自有模型训练。

### 不做清单（Apple 式减法）

| 砍/缓                      | 理由                                                                                                |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| Bili 发布功能扩展          | 保留自用隐藏入口（所有者确定），但**不宣传、不扩展**：仅做卫生化 + 开关，避免回到"发布工具"定位幻影 |
| Threads/Bluesky 等新数据源 | 定位裁决前一律不接                                                                                  |
| 编辑器 stream 独立推进     | 与阶段二"翻译流式化"合并，不单独立项                                                                |
| 视觉模型训练/微调          | ai-vision.md §1.3 已明确非目标，维持                                                                |
| IG Story 提前到阶段二      | 价值密度低于核心体验修复，SDK 虽已验证但逆向接口随版本漂移，排期靠后进阶段三                        |

### backlog 逐条裁决

| 条目                                                | 裁决                                     | 理由                                                                                                                                       |
| --------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| [ux] 长链推文/大量媒体渲染与截图性能（backlog L19） | **采纳**（阶段二）                       | 直接对应 P1-2/P5 性能预算；与 ADR-008 媒体代理统一（S7 待实施）耦合，一并做                                                                |
| [ux] Instagram Story 支持（L20）                    | **采纳（延后至阶段三）**                 | 所有者确认保留 todo，SDK `@chilfish/gallery-dl-instagram` 已验证可接入、成本可控；价值密度低于核心体验修复，故排期靠后（详见不做清单末行） |
| [refactor] Translation View Resolver 收敛（L24）    | **采纳**（阶段一）                       | P2-3 证据确凿（两 hook 重复链），低风险高收益                                                                                              |
| [refactor] 编辑器兼容 stream（L25）                 | **延后→并入阶段二/三**                   | 当前管线为非流式 generateText；先做"GET 不阻塞"再谈流式编辑                                                                                |
| [refactor] 性能：并发/限流策略 + 可观测性（L26）    | **采纳**（限流进阶段一，可观测进阶段二） | 限流=SmartPool 重构（P1-1）；可观测=阶段二任务 3                                                                                           |

## 5. 反方自审与开放问题

### 自审（唱反调）

1. **证据不足/已纠偏处**：① bili 的"定位漂移"判断已被所有者澄清为有意保留的自用隐藏入口——纠偏为"隐藏功能卫生缺失"（P2-1），评级与建议随之改写；②"GET 阻塞"仅当 `enableAITranslation=true` 触发，默认关闭（appConfig.ts L84），影响面是"开启翻译的用户首访新推文"，P1 成立但措辞须精确；③ `bun test` 红 20 项含环境因素，但 TestServer 冷启动 23-56s（commit 5e0b69e）普遍超过 30s hookTimeout（vitest.config.ts L26），健康开发机同样高概率复现，属"命令设计缺陷"而非"必现红"。
2. **成本低估处**：SmartPool 加冷却若实现不当会把临时 429 放大为长停机，需真实 Key 压测，预算应 +1 人日；Resolver 收敛触碰 postmortem 热点文件（#002/#009），回归窗口被低估；GET 解耦涉及 store/编辑器联动，阶段二任务 1 的 3-5 人日偏乐观；IG Story 的 SDK 接口已验证但不等于上游稳定，接入期需预留 fixture 维护余量。
3. **只做一件事的 Top 3**：① 产品定位裁决（0 代码，决定新功能取舍与宣传口径）；② SmartPool 可靠性（全站数据源命门）；③ GET 与 AI 解耦（体验命门）。取舍：定位是决策链起点，代码止血中②③并列优先，其余全部让路（含 Story——SDK 已验证，但晚三周接上不损失价值）。
4. **验证自评**：每项评级均可在 10 分钟内复核（文件+行号已给）；唯一不可复现项是"健康开发机上 `bun test` 是否必红"。

### 开放问题（需所有者拍板）

1. **定位**：匿名只读工具还是更广的平台？bili 已定自用、不参与产品叙事，但此定位仍决定 Story、跨平台等未来功能优先级与是否对外宣传。
2. **目标用户**：日语学习/二次元圈层（现词典、翻译、截图的人设），还是泛阅读者？
3. **逆向 API 风险容忍度**：Twitter/IG 私有 API 可随时收紧，自托管用户多 Key 成本谁能兜？
4. **商业化**：免费 + 自带 Key（BYOK）是否可持续？Serverless 账单与 Key 轮询池成本谁承担？
5. **AI 翻译是差异化还是标配**：Gemini/DeepSeek 双提供商是卖点还是双重配置负担？
6. **AI Vision 投入去留**：看图说话/OCR 的真实使用占比是否支撑后续投入？
7. **门禁责任**：谁负责文档与 lefthook 一致性（本次已抓出 `bun test` 失真）？
