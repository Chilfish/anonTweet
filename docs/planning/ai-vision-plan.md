# AI 视觉描述子系统 — 行动计划

> 最后更新：2026-08-13
> 状态：**Phase 1~4 已完成（P1 e278444 · P2 1bfc2f0 · P3 da66c5c · P4a d666ddc · P4b 1171f46 · 数据正确性修复 本 commit），Phase 5 截图+缓存待实施**
> 上游：`docs/feature_ai_vision.md`（需求与上下文）｜ `verify/acceptance-criteria/AC-vision.md`（验收）
> 前置依赖：baseUrl / 自定义模型输入（已落库）

---

## 1. 目标

为推文配图提供**结构化**的 AI 视觉描述（看图说话 / 结构化 OCR+翻译 / 自定义提示），默认上游 `xiaomi/mimo-v2.5` via OpenRouter；与文本翻译解耦、可并行、可进截图。零新增运行时依赖（复用 `@ai-sdk/openai-compatible`）。

---

## 2. 决策记录（DR）

| ID   | 决策                                                                                                        | 理由                                                                                                                                                                                             |
| ---- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| DR-1 | 用 `@ai-sdk/openai-compatible`，**不用** `@openrouter/ai-sdk-provider`                                      | OpenRouter 是 OpenAI 兼容协议；与刚重构的 deepseek 策略同构；零新依赖                                                                                                                            |
| DR-2 | `AIVisionInfo` 独立对象，不并入 `Entity`                                                                    | 避免污染 `resolveTranslationView` 的 `aiTranslation` 语义（Postmortem #002）                                                                                                                     |
| DR-3 | 独立设置 Tab + 独立 store 字段（**不 bump persist version**）                                               | 与翻译配置解耦；加字段浅合并默认值，不触发迁移丢数据（Postmortem #006，baseUrl 同款做法）                                                                                                        |
| DR-4 | 默认 `baseURL=https://openrouter.ai/api/v1`，模型 `xiaomi/mimo-v2.5`                                        | 官方默认端点；mimo-v2.5 原生 omnimodal、结构化输出支持、价格低                                                                                                                                   |
| DR-5 | 图片以 **base64 data URI** 传入，服务端 fetch 后转码                                                        | 规避上游数据中心 IP 被 twimg 拦截；OpenRouter 接受 data URI；代价是 token 略增，可用缩略图参数缓解                                                                                               |
| DR-6 | 独立 API 路由 `POST /api/ai-vision`，不复用 `/api/ai-translation`                                           | 翻译路由有 `force`/`isZh` 守卫；vision 独立请求语义（mediaIndexes/mode/withContext）；`ai-vision` 命名对齐 `ai-test`/`ai-translation` 扁平路由约定                                               |
| DR-7 | Vision thinking 默认关闭（minimal）                                                                         | 感知任务不需要思考链，省延迟省 token；OCR+上下文翻译场景可由用户手动调高                                                                                                                         |
| DR-8 | Vision 的 provider **不限于 OpenRouter**：复用 provider 策略体系，允许选支持**图片输入**的模型（如 Gemini） | 已有 Gemini Key 的用户可「识图+翻译推文」复用一个 Key；`messages.ts` 的 FilePart 对 google / openai-compatible 均兼容；参考 OpenRouter `?input_modalities=image&output_modalities=text` 过滤模型 |

---

## 3. 实施阶段与 commit 拆分

> 遵循「文档先行 + 验证先行 + 原子 commit」规范（CLAUDE.md 强制规范 1/2/3）。每个 commit 前跑 `typecheck && lint && test`。

### Phase 0 — 文档与 AC（本 commit）

- `docs/feature_ai_vision.md`（需求）
- `docs/planning/ai-vision-plan.md`（本文档）
- `verify/acceptance-criteria/AC-vision.md`
- `docs/README.md` 索引 + `docs/development-log/2026-08-13.md`
- commit: `docs(ai): plan AI vision subsystem with OpenRouter + mimo-v2.5`

### Phase 1 — OpenRouter Provider 策略（翻译/通用侧）

- `constants.ts`：`DEFAULT_OPENROUTER_BASE_URL`；`ModelConfig.provider` 联合类型加 `'openrouter'`
- 新建 `app/lib/providers/openrouter.ts`；`providers/index.ts` 注册 + export
- `appConfig.ts`：翻译侧 `AIProvider` 加 `'openrouter'`（若需把 OpenRouter 也作为翻译供应商）
- 设置：`AITranslationSettings` provider 下拉加 OpenRouter（可选，vision 不依赖此步）
- 测试：`test/provider-strategy.spec.ts` / `test/provider-base-url.spec.ts` 扩展
- commit: `feat(ai): add openrouter provider strategy`

### Phase 2 — 数据模型 + Prompt 预设 + 纯函数（验证先行）

- `app/types/vision.ts`（`AIVisionInfo` / `VisionMode`）；`EnrichedTweet.visionInfo?`
- `app/lib/vision/prompts.ts`（describe / ocr / custom 预设 + strict schema + `getVisionPreset`）
- `app/lib/vision/messages.ts`（`buildVisionMessages` 纯函数：FilePart 图片 part + 上下文注入）
- `app/lib/vision/parse.ts`（`parseVisionResult` 纯函数 + `resolveVisionView` 决策链）
- `test/vision.spec.ts` + fixture（`verify/fixtures/vision/`）
- `verify/modules/vision.verifier.ts`（注册进 `verify/index.ts`）激活 AC-VISION-001~005
- AC-VISION-006/007 依赖服务端编排（`runImageVision`），随 Phase 3 扩展
- commit: `feat(vision): data model + prompt presets + pure functions`

### Phase 3 — 服务端：图片获取 + 编排 + API（本 commit）

- `app/lib/vision/fetchImage.ts`（`buildMediaUrl` 服务端无 proxy 版 + `fetchImageDataUri` + `fetchMediaImages`；默认 small 缩略图，DR-5）
  - 注：计划原写「复用 `createMediaUrl`」，实际代码中不存在该函数——用与客户端 `getMediaUrl` 相同的 format+name 变换实现服务端孪生，仍满足 Postmortem #005 不写第五套 URL 逻辑
  - proxy 回退未在本阶段实现（fetch 用浏览器头直接打 twimg），列为二期候选
- `app/lib/vision/describeImages.ts`（`runImageVision` 编排：photo 过滤 → 抓图 → messages → `Output.object` 结构化生成 → 清洗；schema 校验失败重试一次）
- `app/routes/api/ai/vision.ts`（`POST /api/ai-vision`；zod 请求校验；`normalizeAIError`）
- `verify/modules/vision.verifier.ts` 激活 AC-VISION-006/007（无 photo 短路 / withContext 注入）；AC-VISION-008 留待 Phase 5
- commit: `feat(vision): vision endpoint + server orchestration`

### Phase 4 — UI：设置 Tab + 展示 + 编辑弹窗

> 拆两个 commit：4a 设置 Tab、4b 展示 + 编辑弹窗（原子提交，diff 超 10 文件即拆分）。

- **4a** ✅ `d666ddc` `app/components/settings/AIVisionSettings.tsx` + `SettingsPanel.tsx` 新 Tab
  - Provider 下拉：**复用 provider 策略体系**，只列支持图片输入的模型（google/gemini、openrouter 等；参考 OpenRouter
    [`?input_modalities=image&output_modalities=text`](https://openrouter.ai/models?input_modalities=image&output_modalities=text)）；
    用户已有 Gemini Key 时可「识图+翻译」复用一个 Key（DR-8）
  - `appConfig` vision 字段（`enableAIVision` / `visionProvider`，DR-3 不 bump version）
    - `resolveVisionConfig` 纯函数（只放行 google/openrouter）+ `useAIVisionConfig`（hooks.ts）
- **4b** ✅ `app/components/tweet/AIVisionBlock.tsx`（媒体区展示，`resolveVisionView` 决策链 + 空态入口）
  - `app/components/translation/AIVisionEditorDialog.tsx` + `app/hooks/use-vision-logic.ts`（弹窗级 mode/附上下文/自定义提示；逐图查看 + 手动覆盖 textarea；AI 生成/重生成 + 保存）
  - `AIVisionInfo.manualDescription?` 扩展 + `mergeVisionInfo` / `applyManualOverrides` 纯函数（parse.ts，Postmortem #002）
  - `TweetNode.tsx` 挂载（`TweetMediaAlt` 之后）；`plain.tsx` 留待 Phase 5

### Phase 5 — 截图 + 缓存/持久化

- `plain.tsx` 渲染 `AIVisionBlock` + `waitForRenderReady`
- `localCache` 写回 `visionInfo`（对齐 `ai-translation`）；二期 DB 持久化（TODO 标注）
- AC 集成验证：`bun verify --server --module vision`
- commit: `feat(shot): vision block in screenshot + cache persist`

---

## 4. 风险与雷区

| 风险                                                            | 缓解                                                                                 |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 上游漂移：OpenRouter / MiMo-V2.5 可用性与 schema 兼容变化       | AC 以纯函数/离线确定性为主（对齐 S7 Media 做法），集成测试标注需真实 API Key（SKIP） |
| twimg 服务端 fetch 被拦截                                       | `createMediaUrl` + proxy 回退；缩略图参数降体积                                      |
| base64 图片 token 成本                                          | 缩略图参数 + 批量一次请求；默认 minimal thinking                                     |
| persist 迁移丢数据（#006）                                      | 加字段不 bump version（DR-3）                                                        |
| 逻辑耦合 React（#002）/ 媒体 URL 第五套（#005）/ 无验收（#007） | 纯函数下沉 + `createMediaUrl` 复用 + AC 先行（见需求文档 §3）                        |

---

## 5. 依赖

- `@ai-sdk/openai-compatible@^3.0.30`（已有）＋ zod ^4（已有）
- 用户 OpenRouter API Key（`.env` / 设置页）
- 未提交的 baseUrl threading 工作（先落库，vision 与翻译共用 `createSDKProvider(apiKey, baseUrl?)` 签名）

## 6. 验收入口

```bash
bun run typecheck && bun run lint && bun test          # 每 commit 前
bun run verify/index.ts --module vision                # Phase 3 起
bun run verify/index.ts --server --module vision       # Phase 5 集成
```

## 7. 后续（二期候选）

- 按 `input_modalities=image` 拉取 OpenRouter models API，设置页联动展示可用 vision 模型清单（DR-8 配套）
- IG 图片描述复用 `app/lib/vision/`
- `tweet` 表 JSON 列持久化 `visionInfo`
- 多图并行请求限流、请求去重
