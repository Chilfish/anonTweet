# 翻译系统验收标准

> 版本：1.0 | 日期：2026-07-04
> 对应 Postmortem：002 (Translation System)
> 关联 Verifier：`verify/modules/translation.verifier.ts`
> 执行命令：`bun verify --module translation [--ac AC-TRANS-NNN]`

---

## AC-TRANS-001：Placeholder 序列化保护所有特殊实体

- **输入**：`verify/fixtures/translations/entity-roundtrip.json` testCase `basic-mixed-entities`
- **验证对象**：`serializeForAI()` 函数
- **预期输出**：mention、hashtag、url 被替换为 `<<__TYPE_INDEX__>>` placeholder
- **Pass 条件**：
  - mention `@alice` → `<<__MENTION_0__>>`
  - hashtag `#cool` → `<<__HASHTAG_1__>>`
  - url `https://t.co/abc` → `<<__URL_2__>>`
  - 纯文本部分完整保留
  - `entityMap` 包含所有替换映射

---

## AC-TRANS-002：Restore 后实体结构完整

- **输入**：`verify/fixtures/translations/entity-roundtrip.json` testCase `basic-mixed-entities`
- **验证对象**：`restoreEntities()` 函数
- **预期输出**：翻译文本还原后，原始 entity 对象不变，纯文本 entity 带 `translation` 字段
- **Pass 条件**：
  - 特殊 entity（mention/hashtag/url）与原始完全一致（不含 translation）
  - media_alt entity 附加了 `translation` 字段
  - text entity 附加了 `translation` 字段
  - 还原后 entity 数组长度正确

---

## AC-TRANS-003：纯文本无 placeholder 干扰

- **输入**：`verify/fixtures/translations/entity-roundtrip.json` testCase `text-only`
- **验证对象**：`serializeForAI()` → `restoreEntities()` 往返
- **预期输出**：纯文本原封不动通过序列化，翻译后正确附加到 text entity
- **Pass 条件**：
  - `maskedText === 原始文本`
  - `entityMap.size === 0`
  - 还原后 text entity 的 `translation` 为传入的翻译文本

---

## AC-TRANS-004：仅 URL 的内容不被破坏

- **输入**：`verify/fixtures/translations/entity-roundtrip.json` testCase `only-urls`
- **验证对象**：`serializeForAI()` + `restoreEntities()`
- **预期输出**：URL 被保护，翻译文本中 URL placeholder 原样保留
- **Pass 条件**：
  - `maskedText === "<<__URL_0__>>"`
  - 还原后 URL entity 不受影响
  - 不产生重复 placeholder

---

## AC-TRANS-005：resolveTranslationView 优先级

- **验证对象**：`resolveTranslationView()` 函数（`app/lib/translation/resolveTranslationView.ts`）
- **输入**：构造 tweet entity，分别设置：
  1. `entities[].aiTranslation` 有值
  2. `entities[].aiTranslation` 有值 + TranslationStore 有手动覆盖
  3. `entities[].aiTranslation` 有值 + TranslationStore 设为 null（隐藏）
- **预期输出**：
  - 场景 1：使用 AI 翻译
  - 场景 2：TranslationStore 覆盖 AI
  - 场景 3：使用原文（null 即隐藏）
- **Pass 条件**：
  - 场景 1：`translationView.text === entity.aiTranslation`
  - 场景 2：`translationView.text === storeTranslation`
  - 场景 3：`translationView.text === entity.text`（原文）

---

## AC-TRANS-006：materialize 不修改原始 tweet

- **验证对象**：`materialize()` 函数（`app/lib/translation/materialize.ts`）
- **输入**：EnrichedTweet fixture
- **预期输出**：materialize 后原始 `tweet.entities` 不变
- **Pass 条件**：
  - 调用前后 `tweet.entities` 的 deep equality 一致
  - 不会修改 `tweet.autoTranslationEntities`

---

## AC-TRANS-007：Dual Provider 切换

- **验证对象**：AI provider 选择逻辑（`app/lib/providers/`）
- **输入**：`provider='google'` 和 `provider='deepseek'` 分别调用 `getProviderStrategy()`
- **预期输出**：返回不同的 strategy 实例
- **Pass 条件**：
  - `getProviderStrategy('google')` 返回 Google strategy
  - `getProviderStrategy('deepseek')` 返回 DeepSeek strategy
  - 非法 provider 名称抛出明确错误

---

## 总计：7 条 AC

| AC           | 分类   | 依赖 AI | 依赖 Fixture |
| ------------ | ------ | ------- | ------------ |
| AC-TRANS-001 | 纯函数 | 否      | 是           |
| AC-TRANS-002 | 纯函数 | 否      | 是           |
| AC-TRANS-003 | 纯函数 | 否      | 是           |
| AC-TRANS-004 | 纯函数 | 否      | 是           |
| AC-TRANS-005 | 纯函数 | 否      | 否           |
| AC-TRANS-006 | 纯函数 | 否      | 是           |
| AC-TRANS-007 | 纯函数 | 否      | 否           |
