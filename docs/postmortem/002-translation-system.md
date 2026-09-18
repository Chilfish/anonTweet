# Postmortem 002: 翻译编辑器复杂度失控，缺少护栏

- **日期**: 2026-05-31（回溯整理）
- **严重级别**: SEV-1
- **分类**: 架构
- **状态**: Active
- **根因归类**: 设计建模

## 摘要

`TranslationEditor` 及其周边（字典查看器、AI 提示词、模板管理）累计修了 16 次。翻译 UI、字典存储、提示词工程和实体跳过逻辑挤在同一个组件边界内，没有数据流契约。改任何一个子系统都会波及编辑器状态：HTML 实体显示错乱、"跳过实体" 判断在清空输入时反转、AI 隐藏原文修了两次、store 迁移把 `translationMode` 丢掉。

## 影响

- 用户可见：实体原样显示、翻译内容丢失、AI 开关消失，影响所有使用翻译功能的用户。
- 返工：2025-10 至 2026-04 跨度内多次热修，其中 `737fe74` 与 `276b8d4` 是同一问题修了两次。
- 隐藏风险：store 迁移曾可能永久丢失设置，只是恰好被迁移函数兜回。

## 时间线

2026-05-31 回溯整理。除 `276b8d4`（同问题的第二次提交）外，节点均取自各修复 commit。

| 日期 | commit | 事件 |
| ---- | ------ | ---- |
| 2025-10-02 | `d0450a9` | 跳过空文本翻译的条件写反 |
| 2025-12-12 | `b3af482` | 字典改用 Excel 格式 |
| 2025-12-12 | `f6ca27d` | 字典查看器改用 Popover |
| 2025-12-17 | `07baf0a` | HTML 实体在编辑器中显示为原文，补 65 行解码 |
| 2026-01-02 | `fbda221` | 跳过实体判断依据译文而非原文 |
| 2026-01-12 | `7e68aa3` | AI 翻译提示词策略重构 |
| 2026-01-13 | `737fe74` | AI 开启时未隐藏原文 |
| 2026-01-13 | `276b8d4` | 同一问题再修一次，覆盖遗漏路径 |
| 2026-01-22 | `e23f285` | store 持久化迁移，找回 `translationMode` |
| 2026-01-23 | `cf7927a` | Alt 编辑器初始化异常 |
| 2026-04-25 | `2e9e8a8` | 模板管理与存储版本升级 |

## 根因分析

1. 实体跳过逻辑同时依赖原文与译文，却没有不变量约束，条件一改就反转。
2. 编辑器把 UI 状态、翻译状态、实体过滤和字典查询混在一个组件里，任一处变动都会影响其他部分。
3. 功能是叠加上去的：字典从简单列表到 Excel 再到 Popover，每次都往同一个组件加状态，没有在中间做重构。
4. 没有自动化测试，重构风险高，只能最小热修，于是同样的坑反复踩。

一句话归纳：翻译逻辑嵌在组件状态里而非抽成可测纯函数，每加一个功能都会动摇既有行为。

## 触发条件

用户清空翻译输入、切换 AI 开关、store version 升级后加载旧数据。

## 检测

以人工测试为主：实体原样显示、空字段、AI 开关消失。当时的盲区是没有 "输入 → 翻译 → 清空 → 校验" 的端到端测试。

## 处置

逐个热修。后续把部分纯逻辑下沉为 `resolveTranslationView`、`materialize` 等模块并补了单测。

## 做得对的地方

`7e68aa3` 的提示词重构一次成型，边界清晰、描述完整。字典与模板最终收敛进 store，而不是继续散在组件里。

## 行动项

### 缓解

- [x] 实体过滤与视图解析下沉为纯函数并单测（`test/unit/resolveTranslationView.spec.ts` 等；维护者）

### 预防

- [ ] HTML 实体解码抽成独立工具，覆盖命名、数字、混合实体（维护者；判据：独立模块 + 30 条以上用例）
- [ ] store 迁移集成测试：vN 建库、迁移到 vN+1、断言字段不丢（维护者；判据：CI 覆盖每个迁移路径）
- [ ] 补翻译数据流文档：哪个 store 拥有什么、AI 结果与人工译文如何合并、优先级顺序（维护者；判据：文档存在且被 `TranslationEditor.tsx` 引用）

## 教训

翻译逻辑进组件等于进黑洞。纯逻辑必须先下沉再接线，否则每个新功能都在给旧 bug 加复发面。

## Changed Files

```
app/components/translation/TranslationEditor.tsx
app/components/translation/AltTranslationEditor.tsx
app/components/translation/DictionaryViewer.tsx
app/lib/AITranslation.ts
app/lib/stores/translation.ts
app/lib/constants.ts
app/components/settings/TranslationDictionaryManager.tsx
app/components/settings/SeparatorTemplateManager.tsx
```

## 关联报告

- #006 状态管理：同一类 store 迁移丢字段
- #003 UI 样式与布局：Popover 集成与布局问题
