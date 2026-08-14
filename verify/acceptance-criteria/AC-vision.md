# AI 视觉描述验收标准

> 版本：0.3 | 日期：2026-08-14
> 对应 Postmortem：#002（翻译系统耦合）/ #005（媒体 URL 重复）/ #007（新功能无验收清单）
> 关联 Verifier：`verify/modules/vision.verifier.ts`（Phase 3 起，v0.2 补 AC-VISION-009，v0.3 补 AC-VISION-011/012）
> 执行命令：`bun verify --module vision [--ac AC-VISION-NNN]`
> 上游需求：`docs/feature_ai_vision.md`

---

## AC-VISION-001：AIVisionInfo 结构完整

- **验证对象**：`app/types/vision.ts` 的 `AIVisionInfo`
- **输入**：构造 describe / ocr 结果
- **Pass 条件**：
  - 含 `index` / `mode` / `promptId` / `provider` / `model` / `status` / `createdAt`
  - describe 模式填充 `description`；ocr 模式填充 `originalText`（纯 OCR，不含 `translatedText`）
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

## AC-VISION-003：ocr 纯 OCR schema 校验

- **验证对象**：ocr schema + `parseVisionResult`
- **输入**：纯 OCR 的模型 JSON 输出（只含原文，不含翻译）
- **Pass 条件**：
  - 合法：`{ "texts": [{ "index": 0, "originalText": "こんにちは" }] }`
  - 缺 `originalText` → 校验失败；多余键（如 `translatedText`）被 strict 拒绝
  - 空数组 → 返回空 `AIVisionInfo[]`（不抛错）

---

> 翻译不再由 ocr 生成步产出：OCR 纯提取 `originalText`，翻译走独立翻译步
> （`translateOCR.ts`，复用翻译模型 + 推文上下文，见 `POST /api/ai-vision` translate 分支）。
> 翻译步对无结构化输出模型（DeepSeek 等 chat 模型）**宽容解析**：`parseOcrTranslation` 容忍
> `{ translations: [...] }` / keyed-object `{ "0": "译文" }` / 裸数组 / markdown code fence。

---

## AC-VISION-004：resolveVisionView 决策链

- **验证对象**：`app/lib/vision/parse.ts` 的 `resolveVisionView(aiInfo, { translatedOnly })`（纯函数）
- **输入**：同一 media `index` 分别设置：
  1. `AIVisionInfo` describe（AI 描述）
  2. `AIVisionInfo` ocr（原文 + 译文）
  3. ocr + `translatedOnly: true`（仅显示译文开关）
  4. 两者皆无
- **Pass 条件**：
  - 场景 1：显示 `description`
  - 场景 2：显示 `translatedText || originalText`（译文优先，原文可折叠展示）
  - 场景 3：只显示译文，`originalText` 不暴露
  - 场景 4：无视图（隐藏该图描述区）

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

- **验证对象**：`plain.tsx` → `PlainTweet.tsx` + `AIVisionBlock`（source scan，离线确定性）
- **输入**：项目源码
- **Pass 条件**：
  - source scan：`PlainTweet.tsx` 引用 `AIVisionBlock`（截图路由渲染 vision 块，`hideChrome` 隐藏交互 chrome）
  - source scan：`AIVisionBlock` 使用 `waitForRenderReady`（截图上下文调用，对齐 AC-SHOT-003）
  - 手动验收：带 `visionInfo` 的推文（visionInfo 已持久化到 localCache + DB）经 `GET /plain-tweet/:id` 截图包含 AI 描述文本

---

## AC-VISION-009：visionInfo 持久化（save / generate → localCache + DB）

- **验证对象**：`app/routes/api/ai/vision.ts`（save/generate 分支）+ `app/lib/service/getTweet.server.ts`（`updateTweetVisionInfo`）
- **输入**：项目源码（source scan，离线确定性）
- **Pass 条件**：
  - source scan：`vision.ts` 的 `handleSave` 与 `handleGenerate` 均调用 `updateTweetVisionInfo`（不再只裸写 localCache）
  - source scan：`getTweet.server.ts` 导出 `updateTweetVisionInfo`，实现同时含 DB 写（`db.update`，字段级合并进 `jsonContent`）与 localCache 写（`setLocalCache`）
  - 手动验收：开启 `ENABLE_LOCAL_CACHE=true` / `ENABLE_DB_CACHE=true` 后保存 vision 编辑 → 刷新页面 / 重启服务后 visionInfo 仍在（截图路由同样可渲染）

---

## AC-VISION-010：展示可见性门控（默认隐藏 + 逐推文覆盖 + 截图尊重）

- **验证对象**：`app/lib/vision/parse.ts` 的 `resolveVisionBlockState`（纯函数）+ `app/components/tweet/AIVisionBlock.tsx` + `app/components/tweet/TweetNode.tsx`（source scan，离线确定性）
- **输入**：有缓存内容 × 全局开关 × 逐推文覆盖 × 截图上下文的组合
- **Pass 条件**：
  - 纯函数（`resolveVisionBlockState({ hasContent, enableAIVision, override, chromeHidden })`）：
    - 有内容 + 全局关 + 无覆盖 → 交互 `collapsed`（折叠细条）/ 截图 `hidden`
    - 有内容 + 全局开 → `content`（截图同样展示）
    - 逐推文覆盖优先于全局：全局关 + override true → `content`；全局开 + override false → 折叠/隐藏
    - 无内容：仅全局开 + 交互 → `cta`；其余 → `hidden`
  - source scan：`AIVisionBlock.tsx` 使用 `resolveVisionBlockState`（不再无条件渲染缓存内容），含「隐藏」入口与折叠细条（逐推文覆盖可写）
  - source scan：`AIVisionBlock.tsx` 的 `AIVisionEditorDialog` 常驻挂载（折叠/隐藏态下翻译按钮旁的入口也能打开弹窗；无 `if (state === 'hidden') return null` 提前返回）
  - source scan：`appConfig.ts` 含 `showVisionEntry`（默认 false）；`AIVisionSettings.tsx` 提供「显示添加入口」开关
  - source scan：`TweetNode.tsx` 渲染翻译按钮旁的图片描述入口按钮，受 `showVisionEntry` 门控（有图 + 非展开态 + 非截图时）
  - 手动验收：全局关时带缓存描述的推文默认不展示描述；点折叠条展开；主页面截图不含折叠条与描述；开启「显示添加入口」后点击按钮弹出编辑弹窗

---

## 总计：10 条 AC

| AC            | 分类       | 依赖 AI | 依赖 Fixture | 阶段  |
| ------------- | ---------- | ------- | ------------ | ----- |
| AC-VISION-001 | 类型       | 否      | 否           | P2    |
| AC-VISION-002 | 纯函数     | 否      | 否           | P2    |
| AC-VISION-003 | 纯函数     | 否      | 否           | P2    |
| AC-VISION-004 | 纯函数     | 否      | 否           | P2    |
| AC-VISION-005 | 纯函数     | 否      | 是           | P2    |
| AC-VISION-006 | 纯函数     | 否      | 是           | P3    |
| AC-VISION-007 | 纯函数     | 否      | 是           | P3    |
| AC-VISION-008 | 集成/截图  | 否      | 是           | ✅ P5 |
| AC-VISION-009 | 持久化     | 否      | 否           | ✅ P5 |
| AC-VISION-010 | 可见性门控 | 否      | 否           | ✅ P5 |

> 注：AC-VISION-001~007 离线确定性；AC-VISION-008/009/010 source scan 离线确定性。真实 API Key 的端到端（`/api/ai/vision` 真跑 MiMo）不纳入 AC 断言，作为手动验收清单项。
