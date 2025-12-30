# 推文翻译与词典管理子系统设计文档 v1.0

## 1. 概述 (System Overview)

推文翻译子系统是 Anon Tweet 项目的核心业务模块之一，旨在为用户提供对推文内容（Text Entities）进行本地化重构、编辑及持久化的能力。该系统采用 **客户端主导 (Client-First)** 的状态管理策略，结合 **Zustand** 实现响应式数据流，并辅以本地持久化的词典系统（Dictionary System）以提升翻译效率和一致性。

本模块主要包含两个核心领域：
1.  **翻译编辑器 (Translation Editor)**：负责对单条推文进行实体级的文本编辑、上下文补充（Prepend）及模板渲染。
2.  **词典管理 (Dictionary Manager)**：负责维护“原文-译文”映射关系，支持批量 Excel 导入导出及自动匹配建议。

---

## 2. 领域模型 (Domain Model)

### 2.1 翻译实体 (Translation Entities)

系统并不直接存储整段翻译文本，而是基于 `react-tweet` 的 AST（抽象语法树）结构，对 `Entity` 对象进行扩展。

*   **数据结构**: 翻译数据以 `Entity[]` 形式存在。
*   **存储策略**:
    *   **运行时**: 维护在 `TranslationStore` 的 `translations` 字典中 (`Record<tweetId, Entity[]>`)。
    *   **数据源**: 通过 `extractTranslationsFromEntities` 逻辑从后端返回的 `EnrichedTweet` 中解析初始化。

### 2.2 翻译设置 (Settings Configuration)

管理翻译功能的全局行为表现，支持自定义分隔符模板。

```typescript
interface TranslationSettings {
  enabled: boolean;               // 全局开关
  customSeparator: string;        // 当前使用的 HTML 分隔符
  selectedTemplateId: string;     // 选中模板 ID
  separatorTemplates: SeparatorTemplate[]; // 预设模板
  customTemplates: SeparatorTemplate[];    // 用户自定义模板
}
```

### 2.3 词典条目 (Dictionary Entry)

持久化存储的词汇映射，用于辅助翻译。

```typescript
interface TranslationDicEntry {
  id: string;        // UUID
  original: string;  // 原文索引键
  translated: string;// 目标译文
  createdAt: number; // 创建时间戳
}
```

---

## 3. 状态管理架构 (State Management Architecture)

本子系统采用双 Store 设计，分离“会话级业务数据”与“持久化配置数据”。

### 3.1 翻译业务 Store (`useTranslationStore`)

*   **生命周期**: 会话级 (Session-based)，部分配置持久化。
*   **核心职责**:
    1.  **数据一致性维护**: `setTranslation` 动作不仅更新 `translations` 查找表，还会通过**深层更新 (Deep Update)** 同步修改 `tweets` 数组及 `mainTweet` 对象中的 `entities`，确保 UI 渲染源的单一真实性 (Single Source of Truth)。
    2.  **副作用处理**: 包含 `extractTranslationsFromEntities` 逻辑，在 `setAllTweets` 时自动遍历推文树，提取已存在的翻译数据建立缓存，避免重复计算。
    3.  **模板管理**: 提供对分隔符模板的 CRUD 操作，并处理删除当前选中模板时的**智能回退 (Smart Fallback)** 逻辑。

### 3.2 词典持久化 Store (`useTranslationDictionaryStore`)

*   **生命周期**: 永久持久化 (LocalStorage)。
*   **核心职责**:
    1.  **CRUD 操作**: 管理词条的增删改。
    2.  **批量处理**: 提供 `importEntries` 接口，基于 Set 数据结构实现 $O(n)$ 复杂度的去重逻辑，仅导入系统中不存在的原文键。
    3.  **数据交换**: 集成 `xlsx` 库，支持 Excel 文件的解析与生成。

---

## 4. 核心业务逻辑 (Core Business Logic)

### 4.1 实体级翻译与上下文注入

系统不仅仅是对文本的简单替换，而是基于实体的结构化编辑。

*   **逻辑实现**: `TranslationEditor.tsx`
*   **流程**:
    1.  **初始化**: 打开编辑器时，深度克隆当前推文的 `entities`。
    2.  **自动匹配**: 遍历实体，若实体类型为 `hashtag`，自动在词典 Store 中查找匹配项并预填充译文。
    3.  **句首补充 (Prepend Injection)**: 允许用户在推文最前方插入一段不在原文中的文本（如“转推补充：”）。该数据被构造为一个特殊的 `Entity` (index: -1)，在保存时通过 `unshift` 注入到实体数组头部。
    4.  **过滤机制**: 自动跳过 `url`, `mention`, `media` 等非文本实体的编辑，保护推文元数据不被破坏。

### 4.2 智能提取与缓存建立

为了在列表页和详情页无缝显示已保存的翻译，系统在数据加载阶段执行提取逻辑。

*   **逻辑实现**: `translation.ts` -> `extractTranslationsFromEntities`
*   **算法**:
    *   输入：推文数组 (Recursive EnrichedTweet)。
    *   扁平化：使用 `flatTweets` 工具将树状推文（包含引用推文）展平。
    *   遍历：检查每个推文的 `entities`。
    *   判定：若任意 Entity 包含非空的 `translation` 字段，则视为该推文已翻译。
    *   输出：构建 `Record<string, Entity[]>` 映射表，作为前端缓存。

### 4.3 词典导入导出子系统

为了支持社区协作和数据备份，实现了基于文件的词典管理。

*   **逻辑实现**: `TranslationDictionary.ts` & `TranslationDictionaryManager.tsx`
*   **解析逻辑 (`parseExcel`)**:
    *   读取 ArrayBuffer。
    *   模糊匹配表头：支持中文（“原文”、“译文”）或英文（“original”、“translated”）表头识别。
    *   清洗：过滤空行及无效数据。
*   **去重策略**:
    *   在内存中构建现有 `original` 字段的 `Set` 集合。
    *   仅当 `!existingOriginals.has(newEntry.original)` 时才执行插入。

---

## 5. 交互设计与 UI 模块 (UI Architecture)

### 5.1 编辑器组件 (`TranslationEditor`)

*   **交互模式**: 模态对话框 (Modal Dialog)。
*   **表单处理**: 使用原生 `FormData` 获取所有 Input/Textarea 的值，避免为每个实体创建 React State，优化性能。
*   **预览机制**: 内嵌 `TweetBody` 组件，实时渲染原文以便对照。

### 5.2 词典管理器 (`TranslationDictionaryManager`)

*   **交互模式**: 嵌入式管理面板。
*   **功能特性**:
    *   **实时过滤**: 基于原文或译文的关键词搜索。
    *   **文件流处理**: 利用 `FileReader` 异步读取上传的 Excel 文件。
    *   **反馈机制**: 使用 `toastManager` 提供导入统计（新增数/跳过数）及错误提示。

---

## 6. 技术栈依赖 (Dependencies)

*   **状态库**: `zustand` (v4+), `zustand/middleware` (persist)
*   **数据处理**: `xlsx` (SheetJS) 用于 Excel 解析与生成
*   **UI 组件**: `radix-ui` (Dialog, Popover, Switch), `lucide-react` (Icons)
*   **工具库**: 原生 `crypto.randomUUID` (ID 生成), `FormData` API

## 7. 安全与健壮性设计

1.  **内容清洗**: `checkTextContent` 函数使用正则移除 URL、Mention 和 Tag，仅当存在有效文本内容时才允许开启翻译功能，防止对纯图片/纯链接推文进行无意义操作。
2.  **防御性编程**:
    *   在删除当前使用的模板时，自动回退到默认模板或第一个可用模板，防止 UI 崩溃。
    *   在 Excel 解析层，包含完整的 `try-catch` 块及非空校验，处理文件格式错误。
3.  **数据隔离**: 词典数据存储于独立的 LocalStorage Key (`translation-dictionary-storage`)，与应用设置分离，便于独立迁移。
