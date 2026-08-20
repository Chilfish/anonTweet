# Backlog（任务清单）

**项目**: anonTweet | **最后更新**: 2026-08-19

> 未决任务跨阶段收拢。规划下一个阶段时从这里选任务；完成后勾选并（如为阶段计划）`git mv` 到 `docs/archive/`。
> 历史完成记录见 `docs/archive/TODO.md`。
> 本版排期依据：`docs/reviews/review-2026-08-17-apple-critique.md`（Apple 视角锐评与行动计划，最终版）+ `review-2026-08-19-tweetcard-storybook-critique.md`（TweetCard 组件评审，所有者三项裁定落地）。

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

### 阶段二（3-6 周）核心体验：UI 组件 Storybook 全覆盖 + 视觉基线（主线，评审 P1-2 裁决）+ 翻译不阻塞、性能基座

> 验收：新增 AC-UI-VISION-001（每组件 ≥1 story）与 AC-UI-A11Y-001（a11y addon 零 violation）且 verify 全绿；`bun run build-storybook` 通过并入 pre-push；AC-PERF-001 / AC-SEC-001 维持绿。— ✅（2026-08-19）：AC-UI-VISION-001/AC-UI-A11Y-001 落地（`verify/acceptance-criteria/AC-ui.md` + `test/acceptance/ac-ui.spec.ts` 8 用例）；`build-storybook` 已并入 pre-push；AC-PERF-001 / AC-SEC-001 维持绿。

- [x] [ux] GET 与 AI 翻译解耦（原 backlog L26 前半采纳；关联：review P1-2；文件：`app/routes/api/tweet/get.ts`、`app/routes/api/ai/ai-translation.ts`、客户端 hooks）— ✅ 完成（2026-08-17）：AC-DECOUPLE-001~002 落地且 verify 绿；GET 移除内联 `autoTranslateTweet`（源码扫描无 LLM 调用），客户端 `use-auto-translate.ts` 触发 `/api/ai-translation`（不阻塞首屏），plain 截图路由两步走；`app/lib/ai-timeout.ts` 统一超时（默认 120s，`AI_TRANSLATION_TIMEOUT_MS` 可覆盖）。**剩余：AI 端点 stream 化并入下方 ux 条目**。
- [x] [ux] 长链推文/大量媒体渲染与截图性能（原 backlog L19 采纳；文件：`verify/acceptance-criteria/AC-screenshot.md` 扩、`plain.tsx`、`plain-ig.tsx`）— ✅ 完成（2026-08-17）：AC-PERF-001 落地（AC-screenshot.md v1.2，verify 绿）；基线实测 15 条线程 SSR 中位 20ms / 单推 1ms，回归阈值 = max(绝对兜底 500/150ms, 基线×5)；媒体/头像补 `loading="lazy"`。ADR-008 媒体代理统一保持 S7 待实施（独立于本 AC）
- [x] [refactor] 可观测性：翻译耗时/缓存命中率/RettiwtPool 状态结构化日志（原 backlog L26 后半采纳；文件：`app/lib/translation/`、`app/lib/SmartPool.ts`）— ✅ 完成（2026-08-17）：`app/lib/obs-log.ts` 统一单行 JSON 日志（AC-OBS-001 落地）；`ai.translate`/`cache.get`/`pool.rotate`/`pool.exhaust` 接入；敏感字段不入日志 → 阶段三可基于此产出命中率/耗时报表
- [x] [ux] 隐私加固：`baseUrl` 白名单 + 设置页披露（文件：`app/routes/api/ai/vision.ts`、`ai-translation.ts`、设置页）— ✅ 完成（2026-08-17）：`app/lib/ai-base-url.ts` 白名单 + 三处边界校验 + 设置页披露 Key 中继（AC-SEC-001 落地）— 🔄 修订（2026-08-19）：白名单改**可选加固，默认关闭**（`ENABLE_AI_BASE_URL_WHITELIST` 默认 false）——自定义 baseUrl 默认可直接使用、部署零配置；公开部署可开启 + `ALLOWED_AI_BASE_URL_HOSTS` 扩展；单测/AC-SEC-001 同步更新（AC-sec.md v1.1）
- [x] [ui] **tweet 目录 14 组件逐一生成 story（主线）**（关联：review-2026-08-19 P1-2；文件：`app/components/tweet/*`、`app/stories/`；工作量：4-6 人日 / DRI：UI / 风险：低）— ✅ 完成（2026-08-19，分支 `feat/storybook-tweet`）：14 组件全部落 story（TweetCard 五态 / TrendingCard / TweetHeader / TweetTextBody / TweetMediaAlt / TweetOptionsMenu / PlainTweet / TweetNode / SelectableTweetWrapper / TweetInputForm / CommentBranch / ThreadLine / FilterUnrelatedToggle / AIVisionBlock），场景矩阵覆盖默认/加载/错误/空 × 官方对照（真实 jetfuel fixture 数据）× 自身优化（翻译可见性/移动端窄屏）；共享 fixture `app/stories/tweet.fixtures.ts` + store 种子 `story.store.tsx`；`.storybook/preview.tsx` 全局单一 MemoryRouter（修复 story 内嵌套 Router 运行时报错）；修复 Trending 主图 alt 与 h3 重复朗读（P1-2 a11y）。验证：`bun run build-storybook` 0 报错
- [x] [ui] **ins 目录补全 story**（文件：`app/components/ins/*`；工作量：2-3 人日；风险：低）— ✅ 完成（2026-08-19）：补齐 IGCaption / IGHeader / IGHeaderActions（IGTranslateToggle/IGScreenshotButton/IGOptionsMenu）/ IGTranslateDialog / InsLogo / PlainIGPost（ig.fixtures 共享数据）；InstagramPostCard/IGMediaGrid/IGCardHeader/IGActionBar/IGMusicInfo/IGPostSkeleton 已有
- [x] [ui] translation / settings / ui 在用原语按「被使用即覆盖」补 story（文件：`app/components/{translation,settings,ui}/*`；工作量：3-4 人日 / 风险：低）— ✅ 完成（2026-08-19）：translation TranslationsActions+Editors 10 组件；settings AITranslationSettings/AIVisionSettings/GeneralSettings/SettingsUI；ui-primitives 22 在用原语；AC-UI-VISION-001 覆盖范围扩为 tweet14+ins14+translation10+settings8+ui22
- [ ] [refactor] 视觉基线接入：chromatic 或本地 `build-storybook` + 截图 diff（文件：`.storybook/main.ts`、CI；工作量：1-2 人日 / 风险：中，需 owner 定基线形态）— 🔄 部分落地（2026-08-19）：AC-UI-VISION-001 / AC-UI-A11Y-001 已落地（ac-ui.spec.ts）+ `bun run build-storybook` 并入 pre-push；**剩余：基线形态待 owner 拍板**（review 开放问题 1：chromatic 云服务 vs 本地截图 diff）与 axe 实测跑批（addon-vitest 项目配置，review 开放问题 3）
- [x] [refactor] AC-CARD-005 换真渲染测试 + **jetfuel 回退渲染测试**（裁决：评审 P1-1/P1-3；文件：`test/acceptance/card-render.spec.ts`、`app/stories/TweetCard.stories.tsx`；工作量：1-1.5 人日）— ✅ 完成（2026-08-19）：`card-render.spec.ts` AC-CARD-005（trending 渲染）/006（无 trending 回退普通卡）/007（缺图不塌陷）/008（无卡空渲染）；AC-card.md v1.1 验证方法如实改为 renderToString；源码级锁定降级为 AC-CARD-009 辅助检查
- [ ] [ux] AI 端点 stream 化（原 L26 剩余；文件：`app/routes/api/ai/ai-translation.ts`、客户端 hooks；工作量：3-5 人日 / 风险：高）— 与「编辑器兼容 stream」L25 合并，阶段三执行

### 阶段三（7-8 周+）护城河：Vision 闭环、流式编辑器、Story 接入、缓存规模化

> 验收：AC-VISION-008 手动项转自动断言；新增 `AC-IG-STORY-001~003`（story 提取/渲染/缓存）且 verify 全绿；缓存命中率 → 结构化日志报表；**Storybook 用例纳入 `bun run verify/index.ts --module ui` 门禁（组件新增必须伴随 story，写入 code-style + PR 审查清单）**。

- [ ] [refactor] AI Vision 截图导出 E2E 闭环（关联：review 阶段三；文件：`plain.tsx`、`app/components/tweet/AIVisionBlock.tsx`；前置：阶段二可观测性）
- [ ] [refactor] 编辑器兼容 stream（原 backlog L25 延后并入；关联：review；文件：`app/components/translation/TranslationEditor.tsx`、`resolveTranslationView.ts` isAIStream 扩展；前置：阶段二 GET 解耦流式化）
- [ ] [ux] Instagram Story 接入（原 backlog L20 采纳延后；关联：review 不做清单末行；文件：`app/routes/api/ig/get.ts` 扩展、`IGCaption`/`PlainIGPost` 渲染；前置：SDK `@chilfish/gallery-dl-instagram` 已验证；先写 `AC-IG-STORY` + fixture 再实现；风险：中，上游接口漂移需 fixture 维护余量）
- [ ] [refactor] 三层缓存规模化与命中率指标（文件：`app/lib/service/getTweet.server.ts`；前置：阶段二可观测性）
- [x] [refactor] Tweet 卡片 jetfuel 全量数据接入（用户抓包 2026-08-19 确认：`TweetRequests.details` 换 queryId `GZsN2Pc4knAoit6pXa4HSA` + 对齐官方 features 即取到 `jetfuel_attachment`，内含 trending-card 标题/描述/日期/分类/头像/posts 数/图，官方 HTML 同源；文件：`app/lib/rettiwt-api/requests/Tweet.ts`、`app/lib/react-tweet/utils/parseTweet.ts`（payload 长度前缀字符串提取）、`app/components/tweet/TweetCard.tsx`（渲染扩展）；工作量：1-2 人日 / 风险：中，私有二进制格式需 fixture 维护；fixture 存档 `tmp/raw-tweet-2089577916694942006-jetfuel.json`；详见 `docs/development-log/2026-08-18.md` 补充调查）— ✅ 完成（2026-08-19，分支 `feat/trending-card`，方案 `docs/features/tweet/trending-card.md`，AC `verify/acceptance-criteria/AC-card.md` AC-CARD-001~005）：最小触发 = 仅翻 `responsive_web_jetfuel_frame: true`（无需换 queryId，但需清掉 details() 内残留的重复 `false` 键）；`decodeJetfuelPayload`/`parseTrendingCard` 双策略解析（结构扫描 + 语义化正则）；`mapTwitterCard` 合并 + `jetfuel.parse.fallback` 回退日志；`TweetLinkCard` Trending 变体还原官方样式（aspect-[18/10] 渐变覆盖层）；门禁全绿（typecheck / lint / test 264 / verify 全量）
- [x] [refactor] unified_card 解析兼容多组件布局（`details` / `media_with_details_horizontal`；文件：`app/lib/react-tweet/utils/parseTweet.ts`、`test/unit/parseTweet.spec.ts`；工作量：0.5 人日 / 风险：低）— ✅ 完成（2026-08-18）：`parseUnifiedCard` 遍历 `component_objects`，兼容 `topic_detail` 布局（Trending/topic 卡），domain 优先取 `url_data.vanity`；详见 `docs/development-log/2026-08-18.md`

## 不做清单（裁决为删除/延后，Apple 式减法）

| 条目                         | 裁决           | 理由                                                                                             |
| ---------------------------- | -------------- | ------------------------------------------------------------------------------------------------ |
| Threads / Bluesky 等新数据源 | 删除（不接）   | 产品定位（工具 vs 平台）裁决前一律不接（review Q1）                                              |
| Bili 发布功能扩展            | 延后（无限期） | 保留为隐藏自用入口，不宣传、不扩展、仅卫生化（review P2-1）                                      |
| 编辑器 stream 单独立项       | 延后           | 与阶段二"翻译流式化"合并，不单独立项（review backlog 裁决）                                      |
| IG Story 提前到阶段二        | 延后           | 价值密度低于核心体验修复；SDK 已验证但逆向接口随版本漂移，排期靠后（review 不做清单末行）        |
| 视觉模型训练 / 微调          | 删除（不接）   | `docs/features/ai-vision/ai-vision.md` §1.3 已明确非目标，维持                                   |
| 外链离开匿名环境提示/设置项  | 删除（不接）   | **所有者裁定（2026-08-19）**：「外链这件事不用管它」；链接卡跳转外部为目标行为，不设提示         |
| jetfuel 官方改版巡检专项     | 删除（不接）   | **所有者裁定（2026-08-19）**：解析改版直接回退普通卡，用户感知反馈后再更新解析程序，不设巡检机制 |

## 原未决条目裁决明细（2026-08-17 + 2026-08-19 增补）

| 原条目                                           | 裁决                                            | 理由                                                                                                       |
| ------------------------------------------------ | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| [ux] 长链推文/大量媒体渲染与截图性能（L19）      | **采纳** → 阶段二                               | 对应 review P1-2/性能预算；与 ADR-008 媒体代理统一耦合                                                     |
| [ux] Instagram Story 支持（L20）                 | **采纳（延后）** → 阶段三                       | 所有者确认保留 todo；SDK `@chilfish/gallery-dl-instagram` 已验证可接入，成本可控；价值密度低于核心体验修复 |
| [refactor] Translation View Resolver 收敛（L24） | **采纳** → 阶段一                               | review P2-3 证据确凿（两 hook 重复链），低风险高收益                                                       |
| [refactor] 编辑器兼容 stream（L25）              | **延后** → 阶段二/三                            | 当前管线为非流式 generateText；先做"GET 不阻塞"再谈流式编辑                                                |
| [refactor] 性能：并发/限流策略 + 可观测性（L26） | **采纳（拆分）** → 限流进阶段一、可观测进阶段二 | 限流 = SmartPool 重构（review P1-1）；可观测 = 阶段二任务                                                  |
| 新增：组件 Storybook 全覆盖 + 视觉基线 + a11y 门禁 | **采纳** → 阶段二主线（2026-08-19）             | review-2026-08-19 P1-2（111 组件仅 4 stories）+ 所有者裁定「下一阶段主攻 Storybook/视觉验证/自动化场景用例」 |
| 新增：AC-CARD-005 真渲染测试 + jetfuel 回退渲染测试 | **采纳** → 阶段二（2026-08-19）                 | review-2026-08-19 P1-1/P1-3；配合外链不做、巡检不做的所有者裁定                                          |
| 新增：外链隐私披露           | **删除**（2026-08-19）                          | 所有者裁定不做，见不做清单                                                                                 |
| 新增：jetfuel 官方改版巡检   | **删除**（2026-08-19）                          | 所有者裁定不做，见不做清单                                                                                 |
