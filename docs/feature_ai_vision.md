# AI 视觉描述子系统（AI Vision）— 需求与上下文文档

> 版本：0.1（草案）｜ 日期：2026-08-13
> 状态：**文档先行，尚未实现**
> 关联：OpenRouter（`xiaomi/mimo-v2.5` 上游）｜ 文本翻译子系统（`feature_translation.md`）｜ 截图子系统
> 配套：`docs/planning/ai-vision-plan.md`（行动计划）｜ `verify/acceptance-criteria/AC-vision.md`（验收标准）

---

## 1. 概述

### 1.1 背景

当前翻译子系统（`AITranslation.ts` / `translateIGCaption.ts`）只处理**文本**实体（`text` / `hashtag` / `mention` / `media_alt`…），没有任何视觉理解能力。推文配图存在三类缺口：

1. **无原生 Alt**：博主未写 `ext_alt_text` 的图片没有 `media_alt` 实体，翻译管线直接跳过，图片信息对用户不可见。
2. **纯文本截图**：博主把一段日文（或其它语言）以截图形式贴出，用户想读/想翻译成简体中文，但文本在图片里，现有管线摸不到。
3. **看图说话**：用户想了解图片内容本身（主体/场景/氛围），需要一个「描述型」视觉模型。

### 1.2 目标

接入一个**视觉模型**（默认 `xiaomi/mimo-v2.5`，经 OpenRouter），为推文配图生成**结构化**的「看图说话」描述或「结构化 OCR + 翻译」结果，并且：

- **与文本翻译解耦、可并行**：独立配置、独立 API、独立 UI 入口，互不阻塞。
- **输出结构化**：一律 `Output.object` + zod schema，不做自由文本。
- **可进截图**：AI 描述要能随 `plain.tsx` 截图导出。

### 1.3 非目标（本期不做）

- 视频 / 动图 / 音频内容理解（只处理 `photo`）。
- Instagram 帖子图片描述（二期可复用同一套 `app/lib/vision/` 能力扩展）。
- 视觉模型自身的训练 / 微调。

---

## 2. 用户场景

### 场景 A：看图说话（describe）

- **触发**：用户对某张无 alt 的图片想了解内容。
- **行为**：视觉模型生成简体中文描述（主体、动作、场景、画面文字）。
- **结果**：`description`，结构化。

### 场景 B：结构化 OCR + 翻译（ocr）

- **触发**：博主贴了纯日文（或韩/英文）截图，用户显然想翻译成简体中文。
- **行为**：视觉模型先做**结构化 OCR**——逐行提取图片中的原文（保持原语言与换行）；若用户在弹窗中**附上推文上下文**，则把原文翻译为简体中文。
- **定位**：此时视觉模型是「结构化 OCR + 翻译」工具，**不是看图说话**。
- **结果**：`originalText` + `translatedText`，结构化。

### 场景 C：自定义（custom）

- **触发**：用户对默认预设不满意。
- **行为**：用户写自定义提示语，决定模型如何处理图片；系统仍在外部强制结构化输出。
- **结果**：结构由预设 schema 兜底（或按用户提示产出后清洗）。

---

## 3. 设计原则

对照 Postmortem 高频雷区（`docs/postmortem/README.md`）：

| 雷区                    | 对策                                                                   |
| ----------------------- | ---------------------------------------------------------------------- |
| #002 逻辑耦合 React     | Vision 全部逻辑下沉 `app/lib/vision/` 纯函数；组件只渲染与事件         |
| #005 媒体 URL 四套重复  | 图片获取复用 `createMediaUrl` / `useProxyMedia` 统一路径，不新写第五套 |
| #006 persist 迁移丢数据 | 新 store 字段**加字段不 bump version**（与 baseUrl 同款做法）          |
| #007 新功能无验收清单   | **验证先行**——先 AC（`AC-vision.md`）再实现                            |
| #001 解析器零测试       | 新解析（vision result → AIVisionInfo）先写 Vitest 再实现               |

---

## 4. 核心设计

### 4.1 Provider：OpenAI 兼容 + OpenRouter（零新依赖）

**结论**：不用 `@openrouter/ai-sdk-provider`，直接复用已在用的 `@ai-sdk/openai-compatible`（`^3.0.30`）。

- OpenRouter 是 OpenAI 兼容协议；`@ai-sdk/openai-compatible` 的 deepseek 用法（`app/lib/providers/deepseek.ts`）已验证通。
- 新建 `app/lib/providers/openrouter.ts`，与 deepseek 策略同构：

```ts
export const openrouterStrategy: ProviderStrategy = {
  name: 'openrouter',
  createSDKProvider(apiKey, baseUrl) {
    return createOpenAICompatible({
      name: 'openrouter',
      baseURL: baseUrl?.trim() || DEFAULT_OPENROUTER_BASE_URL,
      apiKey,
    })
  },
  getThinkingConfig(modelConfig, level) {
    if (modelConfig.thinkingType === 'none' || level === 'minimal')
      return { enabled: false }
    return { enabled: true, effort: mapLevelToEffort(level) }
  },
  buildProviderOptions(thinkingConfig, _modelConfig) {
    return { openrouter: { reasoning: thinkingConfig } }
  },
}
```

- `DEFAULT_OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'`（`constants.ts`）。
- **thinking 映射**：OpenRouter `reasoning: { enabled, effort }`，effort 档位 `minimal/low/medium/high`（无 max）。`ThinkingLevel → effort`：`minimal→关`, `low→low`, `medium→medium`, `high→high`, `max→high`。
- `@ai-sdk/openai-compatible` 会把 `providerOptions[name]` 直接 spread 进请求 body → `reasoning: { effort }` 即为 OpenRouter 期望的形态。

**为什么这套也服务于 Vision**：vision 的图片输入与结构化输出走同一条 OpenAI 兼容通道：

- **图片输入**：AI SDK 消息 `{ type: 'image', image: dataUri }` → openai-compatible 转 `image_url` → OpenRouter 接受 base64 data URI。
- **结构化输出**：`Output.object` → `response_format: { type: 'json_schema' }`，OpenRouter 透传，MiMo-V2.5 支持 structured outputs。

### 4.2 数据模型：`AIVisionInfo`（独立对象）

**结论**：不塞进 `Entity`。文本翻译实体（`aiTranslation`）与 AI 视觉描述语义不同，混存会污染 `resolveTranslationView` 决策链。

```ts
// app/types/vision.ts
export type VisionMode = 'describe' | 'ocr' | 'custom'

export interface AIVisionInfo {
  index: number             // 对应 tweet.mediaDetails 数组索引（0-based，与 media_alt 的 20000+i 语义一致）
  mode: VisionMode
  promptId: string          // 'describe' | 'ocr' | 'custom'
  provider: string          // 实际使用的 provider
  model: string             // 实际使用的模型 slug
  description?: string      // describe 模式：看图说话
  originalText?: string     // ocr 模式：图片原文（结构化 OCR）
  translatedText?: string   // ocr 模式：翻译为简体中文
  status: 'done' | 'error'
  error?: string
  createdAt: number
}
```

- `EnrichedTweet` 增加可选字段：`visionInfo?: AIVisionInfo[]`。
- 与 `media_alt`（原生 alt，`index 20000+i`）**并存**：渲染层通过 `resolveVisionView` 聚合「原生 alt + AI 描述」，互不覆盖。

### 4.3 Prompt 预设系统（场景驱动，可切换/可自定义）

```ts
// app/lib/vision/prompts.ts
export interface VisionPromptPreset {
  id: string                 // 'describe' | 'ocr' | 'custom'
  name: string               // 中文名，设置页下拉展示
  mode: VisionMode
  systemPrompt: string
  schema: ZodType            // 结构化输出 schema
}
export const VISION_PROMPT_PRESETS: Record<string, VisionPromptPreset> = { ... }
```

**describe（看图说话）schema + prompt 草案：**

```ts
z.object({
  descriptions: z.array(z.object({
    index: z.number(),
    description: z.string(),
  })),
})
```

> 你是推文配图的视觉描述助手。基于图片内容，用简体中文为每张图片生成简洁、客观、信息密集的描述：主体、动作、场景、画面中的文字（若可见）。单图不超过 100 字；不猜测图片外信息。输出严格 JSON。

**ocr（结构化 OCR + 翻译）schema + prompt 草案：**

```ts
z.object({
  texts: z.array(z.object({
    index: z.number(),
    originalText: z.string(),     // 提取的原文，保持原语言与换行
    translatedText: z.string(),   // 附上下文时翻译为简体中文；否则与原文相同
  })),
})
```

> 你是推文配图的 OCR 助手。逐行提取图片中的所有文字作为 originalText（保持原语言与换行）。若提供了推文上下文，将 originalText 翻译为简体中文填入 translatedText；否则 translatedText 与 originalText 相同。输出严格 JSON。

**custom：** 用户自定义提示语拼入 system，schema 仍由预设兜底；不提供 schema 时回退 `describe` schema 并把产物按 `description` 清洗。

### 4.4 图片获取（服务端 fetch → base64）

- 服务端 `fetch` `media.media_url_https`（经 `createMediaUrl` 统一，Postmortem #005）→ `arrayBuffer` → `data:image/...;base64,...`。
- 可选：twimg 追加 `?format=jpg&name=medium` 缩小体积（base64 膨胀 ~1.33×，token 与延迟敏感）。
- 失败回退：走 `mediaProxyUrl` 前缀重试；仍失败则该项标记 `status: 'error'`，不整批失败。

### 4.5 API 路由（独立，与翻译解耦）

**结论**：不复用 `POST /api/ai/translation`（避免 `force` / `isZh` 等翻译守卫纠缠），新建独立端点：

```
POST /api/ai/vision
{
  tweet: EnrichedTweet,          // 取 mediaDetails + 文本（withContext 时）
  mediaIndexes?: number[],       // 缺省 = 全部 photo
  mode: VisionMode,              // describe | ocr | custom
  promptId?: string,
  customPrompt?: string,         // mode === 'custom' 时必填
  withContext?: boolean,         // 附推文上下文（ocr 翻译用）
  apiKey: string,
  model: string,                 // 默认 xiaomi/mimo-v2.5
  baseUrl?: string,              // 默认 OpenRouter
  thinkingLevel?: ThinkingLevel,
}
→ { success, data: { visionInfo: AIVisionInfo[] } }
```

请求校验复用 `getTweetSchema` 风格（新 schema，`app/lib/validations/tweet.ts` 扩展或新建 `vision.ts`）。

### 4.6 服务端编排（`app/lib/vision/`）

```
describeImages.ts
├── buildVisionMessages(tweet, mediaIndexes, preset, withContext) → ModelMessage[]   // 纯函数
├── parseVisionResult(response, preset) → AIVisionInfo[]                             // 纯函数，schema 校验 + 清洗
└── runImageVision(args) → AIVisionInfo[]                                            // 编排：fetch base64 → generateText(Output.object)
```

- 一次请求、批量出图（所有 `index` 一个 `descriptions`/`texts` 数组），比逐张调用省 N-1 轮往返。
- 校验失败重试一次（对齐翻译的 validate+retry 模式，简化版）。

### 4.7 存储与缓存

- **本期**：`visionInfo` 随 tweet 联动 —— 写回 `localCache`（同 `ai-translation` 的 `setLocalCache`），不新增 DB 表。
- **二期（TODO）**：`tweet` 表 / `translationSync.ts` 扩展 JSON 列持久化 `visionInfo`。

### 4.8 状态与错误

- 复用 `app/lib/ai-error.ts` 的 `normalizeAIError` + `ai-error-toast`（当前未提交的 baseUrl 工作已引入）。
- 前端状态机：`idle | running(逐图) | done | error`；单图失败不影响其它图。

---

## 5. UI / UX 设计

### 5.1 设置页：新 Tab「AI 图片描述」

- `SettingsPanel.tsx` 增加 `<TabsTab value="ai-vision">AI 图片描述</TabsTab>`。
- 新组件 `AIVisionSettings.tsx`，**独立配置逻辑**（不读翻译侧的 `aiProvider` / `gemini*`）：
  - 开关 `enableAIVision`
  - Provider 下拉（`openrouter` 默认；可复用策略体系扩展）
  - API Key / Base URL / 模型（默认 `xiaomi/mimo-v2.5`，支持手写自定义模型——对齐现有 `__custom__` 哨兵模式）
  - Thinking（默认 minimal = 关，感知任务不需要思考）
  - **Prompt 预设**：三选一（看图说话 / 结构化OCR+翻译 / 自定义），自定义时出 textarea
  - **测试按钮**：用示例图（本地 fixture 图）跑一次 describe，验证配置 + 预览结构化输出

### 5.2 推文页展示

- 新组件 `AIVisionBlock`（媒体区下方，与 `TweetMediaAlt` 并列/聚合展示）：
  - 每张图显示「图 N」+ AI 描述；OCR 模式显示原文 + 翻译（原文折叠）。
  - 无内容时显示「AI 描述」按钮（按需生成，与翻译按钮独立、可并行）。
- 编辑弹窗 `AIVisionEditorDialog`（对标 `AltTranslationEditor`）：
  - 逐图查看已生成结果；切换预设、编辑自定义提示语；**「附推文上下文」开关**（ocr 翻译的关键交互）；重新生成；手动编辑后保存。
- Hook `use-vision-logic.ts`（对标 `use-alt-translation-logic.ts`）。

### 5.3 截图（Screenshot）

- `plain.tsx` 渲染 `AIVisionBlock`，并满足 `waitForRenderReady`。
- 新增 AC 断言：截图路由存在 vision 块 + `waitForRenderReady` 覆盖（扩展 AC-SHOT 或并入 AC-VISION）。

### 5.4 交互流（场景 B 完整路径）

1. 推文页点「AI 描述」→ 弹窗 → 选「结构化OCR+翻译」。
2. 打开「附推文上下文」→ 前端把推文文本/引用上下文随请求发出。
3. 模型输出 `originalText`（日文原文）+ `translatedText`（中文）。
4. 结果存 `AIVisionInfo` → 展示在媒体区 → 可手动修正 → 可截图导出。

---

## 6. 验收标准

见 [`verify/acceptance-criteria/AC-vision.md`](../verify/acceptance-criteria/AC-vision.md)（AC-VISION-001~008）。

---

## 7. 里程碑

实施顺序与 commit 拆分见 [`docs/planning/ai-vision-plan.md`](planning/ai-vision-plan.md)。核心顺序：**文档/AC → OpenRouter 策略 → 数据模型+纯函数 → 服务端 API → UI/设置 → 截图/存储**。
