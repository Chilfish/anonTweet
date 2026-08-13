# AI 视觉描述验收标准

> 版本：0.1 | 日期：2026-08-13
> 对应 Postmortem：#002（翻译系统耦合）/ #005（媒体 URL 重复）/ #007（新功能无验收清单）
> 关联 Verifier：`verify/modules/vision.verifier.ts`（Phase 3 起）
> 执行命令：`bun verify --module vision [--ac AC-VISION-NNN]`
> 上游需求：`docs/feature_ai_vision.md`

---

## AC-VISION-001：AIVisionInfo 结构完整

- **验证对象**：`app/types/vision.ts` 的 `AIVisionInfo`
- **输入**：构造 describe / ocr 结果
- **Pass 条件**：
  - 含 `index` / `mode` / `promptId` / `provider` / `model` / `status` / `createdAt`
  - describe 模式填充 `description`；ocr 模式填充 `originalText` + `translatedText`
  - 不写入 `Entity`，`EnrichedTweet.visionInfo` 为独立可选数组

---

## AC-VISION-002：describe 结构化 schema 校验

- **验证对象**：`app/lib/vision/prompts.ts` 的 describe schema + `app/lib/vision/parse.ts`
- **输入**：合法 / 缺字段 / 多余字段的模型 JSON 输出
- **Pass 条件**：
  - 合法：`{ "descriptions": [{ "index": 0, "description": "…" }] }` 解析为 `AIVisionInfo`
  - 缺 `description` → 校验失败；多余键被 schema 拒绝
  - `index` 非数字 → 校验失败

---

## AC-VISION-003：ocr 结构化 schema 校验

- **验证对象**：ocr schema + `parseVisionResult`
- **输入**：含原文 + 翻译的模型 JSON 输出
- **Pass 条件**：
  - 合法：`{ "texts": [{ "index": 0, "originalText": "こんにちは", "translatedText": "你好" }] }`
  - 缺 `originalText` 或 `translatedText` → 校验失败
  - 空数组 → 返回空 `AIVisionInfo[]`（不抛错）

---

## AC-VISION-004：resolveVisionView 决策链

- **验证对象**：`app/lib/vision/parse.ts` 的 `resolveVisionView`（纯函数）
- **输入**：同一 media `index` 分别设置：
  1. `AIVisionInfo` 存在（AI 结果）
  2. `AIVisionInfo` 存在 + 手动编辑覆盖（store）
  3. 两者皆无
- **Pass 条件**：
  - 场景 1：显示 AI 结果
  - 场景 2：手动覆盖优先
  - 场景 3：无视图（隐藏该图描述区）

---

## AC-VISION-005：mediaIndex → mediaDetails 映射

- **验证对象**：`buildVisionMessages` / `parseVisionResult` 的 index 语义
- **输入**：`tweet.mediaDetails` 含 3 张 photo，请求 `mediaIndexes=[0,2]`
- **Pass 条件**：
  - 只生成 2 张图的请求/结果；index 与 `mediaDetails[0]` / `[2]` 对应
  - 与 `media_alt`（`20000+i`）语义一致，不冲突

---

## AC-VISION-006：无 photo 时返回空

- **验证对象**：`runImageVision`
- **输入**：`tweet.mediaDetails` 无 `photo`（或全为 video/gif）
- **Pass 条件**：返回 `[]`，不发起模型请求（fixture 构造无 photo 推文）

---

## AC-VISION-007：withContext 注入推文上下文

- **验证对象**：`buildVisionMessages`（纯函数）
- **输入**：`withContext=true` + 推文 fixture；`withContext=false`
- **Pass 条件**：
  - `withContext=true`：user message 含推文文本 / 引用上下文
  - `withContext=false`：user message 不含上下文
  - 图片 content part 始终存在且为 base64 data URI 形态

---

## AC-VISION-008：截图路由渲染 vision 块

- **验证对象**：`plain.tsx` / `app/components/tweet/AIVisionBlock.tsx`
- **输入**：带 `visionInfo` 的推文 fixture
- **Pass 条件**：
  - `GET /plain-tweet/:id`（或等价路由）渲染结果含 vision 描述文本
  - 组件使用 `waitForRenderReady`（source scan，对齐 AC-SHOT-003）

---

## 总计：8 条 AC

| AC            | 分类      | 依赖 AI | 依赖 Fixture | 阶段 |
| ------------- | --------- | ------- | ------------ | ---- |
| AC-VISION-001 | 类型      | 否      | 否           | P2   |
| AC-VISION-002 | 纯函数    | 否      | 否           | P2   |
| AC-VISION-003 | 纯函数    | 否      | 否           | P2   |
| AC-VISION-004 | 纯函数    | 否      | 否           | P2   |
| AC-VISION-005 | 纯函数    | 否      | 是           | P2   |
| AC-VISION-006 | 纯函数    | 否      | 是           | P3   |
| AC-VISION-007 | 纯函数    | 否      | 是           | P3   |
| AC-VISION-008 | 集成/截图 | 否      | 是           | P5   |

> 注：AC-VISION-001~007 离线确定性；AC-VISION-008 依赖截图路由（Phase 5）。真实 API Key 的端到端（`/api/ai/vision` 真跑 MiMo）不纳入 AC 断言，作为手动验收清单项。
