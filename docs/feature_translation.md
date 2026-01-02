# 推文翻译与词典管理子系统设计文档 v1.1

## 1. 概述 (System Overview)

推文翻译子系统是 Anon Tweet 项目的核心业务模块之一，旨在为用户提供对推文内容（Text Entities）进行本地化重构的能力。该系统结合了 **Google Gemini AI** 的自动化翻译能力与 **人工编辑** 的精确控制，采用 **客户端主导 (Client-First)** 的状态管理策略。

本模块主要包含三个核心领域：

1.  **AI 自动翻译 (AI Auto-Translation)**：基于 Vercel AI SDK 和 Google Gemini 模型，提供带上下文感知的流式翻译服务。
2.  **翻译编辑器 (Translation Editor)**：负责对单条推文进行实体级的文本编辑、人工校对及“隐藏/显示”状态管理。
3.  **词典管理 (Dictionary Manager)**：维护本地术语表，支持 AI 提示词注入及批量导入导出。

---

## 2. 领域模型 (Domain Model)

### 2.1 推文实体扩展 (Extended Entities)

系统在标准 `EnrichedTweet` 模型上扩展了翻译相关字段：

```typescript
interface EnrichedTweet {
  // ...标准字段
  entities: Entity[] // 当前显示的内容（可能是原文，也可能是人工翻译后的）
  autoTranslationEntities?: Entity[] // 服务端/AI 返回的自动翻译结果备份
}
```

### 2.2 翻译状态 (Translation State)

在 `TranslationStore` 中，翻译状态不仅仅是字符串，而是具有三态逻辑：

- **`undefined`**: 未进行人工编辑（默认状态，优先显示 AI 翻译，无 AI 则显示原文）。
- **`Entity[]`**: 已存在人工翻译/编辑内容（最高优先级）。
- **`null`**: 用户显式隐藏翻译（强制显示原文，忽略 AI 翻译）。

### 2.3 翻译设置 (Settings Configuration)

管理翻译功能的全局行为及 AI 参数。

```typescript
interface TranslationSettings {
  enabled: boolean // 全局开关
  // AI 配置
  apiKey: string // Google Gemini API Key
  model: string // 例如 "models/gemini-2.0-flash-exp"
  enableAITranslation: boolean // 是否开启 AI 自动翻译

  // 显示风格
  customSeparator: string
  selectedTemplateId: string
  separatorTemplates: SeparatorTemplate[]
}
```

---

## 3. 状态管理架构 (State Management Architecture)

### 3.1 翻译业务 Store (`useTranslationStore`)

- **生命周期**: 会话级 (Session-based)，设置项持久化。
- **核心职责**:
  1.  **多级回退策略 (Fallback Strategy)**: 在渲染时，UI 组件会按照 `Manual Edit -> AI Translation -> Original Text` 的优先级决定显示内容。
  2.  **显式隐藏支持**: `setTranslation(tweetId, null)` 动作允许用户针对特定推文关闭翻译显示，此时系统会忽略 AI 翻译结果。
  3.  **数据同步**: `setTranslation` 会同步更新 `translations` 查找表和 `tweets` 数组中的实体数据，确保视图一致性。

### 3.2 词典持久化 Store (`useTranslationDictionaryStore`)

- **功能**: 管理用户自定义术语表。
- **AI 集成**: 词典内容会被序列化后作为 System Prompt 的一部分发送给 LLM，以提高特定领域名词（如二次元黑话、技术术语）的翻译准确度。

---

## 4. 核心业务逻辑 (Core Business Logic)

### 4.1 AI 自动翻译工作流

为了解决 LLM 翻译过程中破坏推文实体（如 URL、Mention、Hashtag）的问题，系统设计了一套**占位符序列化机制**。

- **逻辑实现**: `app/lib/entityParser.ts` & `app/services/ai.ts`
- **流程**:
  1.  **序列化 (Serialization)**: 将推文文本中的实体替换为不可翻译的占位符（如 `{{LINK_0}}`, `{{MENTION_1}}`）。
  2.  **上下文构建 (Contextualization)**: 将推文作者、发布时间、引用推文内容以及用户词典作为上下文注入 Prompt，以提升翻译准确度。
  3.  **请求生成**: 调用 Google Gemini API 获取翻译文本。
  4.  **反序列化 (Deserialization)**: 将翻译结果中的占位符还原为原始的 `Entity` 对象，保留其点击跳转功能。

### 4.2 实体级人工编辑

允许用户在 AI 翻译的基础上进行二次修改。

- **逻辑实现**: `TranslationEditor.tsx`
- **特性**:
  - **重置 (Reset)**: 恢复到初始状态（清除人工编辑，回退到 AI 翻译或原文）。
  - **隐藏 (Hide)**: 强制显示原文，屏蔽 AI 翻译。
  - **句首补充**: 支持插入额外的上下文说明（Prepend Entity）。

### 4.3 纯净模式与截图支持

针对 `plain-tweet/:id` 路由（用于服务端截图或纯净阅读）：

- **参数控制**: 支持通过 Query 参数 (`?translation=true/false`) 控制服务端渲染时的翻译显示策略。
- **数据获取**: `clientLoader` 会根据配置尝试获取带 `autoTranslationEntities` 的数据，确保截图内容包含最新的 AI 翻译结果。

---

## 5. 交互设计与 UI 模块

### 5.1 翻译显示组件 (`TranslationDisplay`)

- **智能展示**: 自动判断显示逻辑。若存在 `autoTranslationEntities` 且无人工覆盖，则显示带特定分割线样式的 AI 译文。
- **视觉反馈**: AI 翻译内容会有独特的视觉标记（如 Gemini Logo 或特定的分割线），区分于人工翻译。

### 5.2 设置面板

- **模型选择**: 提供 Gemini 2.0 Flash, Gemini 1.5 Pro 等预设模型选项。
- **连通性测试**: 内置 API 测试按钮，调用 `/api/ai-test` 验证 Key 的有效性及模型可用性。

---

## 6. 技术栈依赖

- **AI Runtime**: `ai` (Vercel AI SDK), `@ai-sdk/google`
- **State**: `zustand` (with `persist` middleware)
- **Data Fetching**: `swr` (配合 React Router loader)

## 7. 安全与隐私

1.  **API Key 安全**: 用户输入的 Gemini API Key 仅存储在本地浏览器 LocalStorage 中，或通过服务器端环境变量注入（用于公共部署）。
2.  **内容清洗**: 发送给 AI 之前，会对文本进行预处理，去除无关的乱码或过长的不可见字符。
3.  **中文跳过**: 内置语言检测逻辑，对于已经是中文的推文，自动跳过 AI 翻译请求，节省 Token。
