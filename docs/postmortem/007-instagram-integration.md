# Postmortem 007: Instagram 集成快速迭代，缺少抽象与验收清单

- **日期**: 2026-05-31（回溯整理）
- **严重级别**: SEV-3
- **分类**: 变更
- **状态**: Active
- **根因归类**: 流程缺失

## 摘要

Instagram 集成是当时最新的功能，在 2026-05-31 前后密集产生 7 次修复。它们多数不是传统 bug，而是缺失的路由、缺失的行为和推迟的 UI 细节：`plain-ins/:id` 未注册、翻译按钮行为不完整、人工译文不落库、URL 解析不认用户名前缀。状态仍是 Active，因为功能较新，边界情况还会继续出现。

## 影响

- 用户可见：路由缺失、手动翻译保存无效、UI 不一致。
- 隐藏风险：人工译文不落库属于潜在数据丢失，只是当时功能太新、几乎没人有译文可丢。
- 返工：约 7 次快速提交，全部集中在一天。

## 时间线

2026-05-31 回溯整理。这批修复都在同一天完成。

| 日期 | commit | 事件 |
| ---- | ------ | ---- |
| 2026-05-31 | `fa92657` | 补 `plain-ins/:id` 路由，并修 Storybook TC 类型 |
| 2026-05-31 | `ce54249` | 支持用户名前缀 URL，更新各处以提及 Instagram |
| 2026-05-31 | `cbe3d0c` | 翻译按钮只保留一个、截图时隐藏、加原文译文分隔符 |
| 2026-05-31 | `4fe9dec` | 保存时把人工译文写入 DB |
| 2026-05-31 | `675b9a3` | 图标尺寸统一 24px，logo 放大到 h-8 |
| 2026-05-31 | `d548673` | 移除宫格上多余的圆点指示器 |

## 根因分析

1. 缺结构化验收清单，路由、持久化、URL 解析这些基础项被漏掉。
2. 新平台需要真实 URL 才能测，部分边界只有上线后才暴露。
3. 单人流程没有 feature flag 或 beta 阶段，这批修复提交实际充当了发布后 QA。
4. IG 没有像成熟 Twitter 那样积累 fixture 语料，边界只能靠手测。

一句话归纳：IG 缺验收清单和测试语料，基础缺口被推到线上才补。

## 触发条件

用户用真实 IG URL 操作，进入初始实现未覆盖的路径（用户名前缀、手动翻译保存）。

## 检测

开发者用真实 URL 自测。当时的盲区是没有针对一组真实 URL 格式的解析测试。

## 处置

逐个补齐。手动翻译改为走 `/api/ig/translate/:id` 的 `manualTranslation` 字段直写 DB。

## 做得对的地方

每次修复小而聚焦，没有把多个无关问题混进一个提交，回滚粒度清晰。

## 行动项

### 缓解

- [x] 补 `plain-ins/:id` 路由（维护者）
- [x] 手动译文保存落库（维护者）
- [x] URL 解析支持用户名前缀（维护者）

### 预防

- [ ] IG 验收清单：路由、URL 解析（3 种以上格式）、AI/手动翻译、截图、持久化（维护者）
- [ ] 建 IG fixture 语料：网格、单图、视频、轮播、用户名前缀（维护者；判据：目录内存 raw JSON 与期望输出）
- [ ] 翻译 → 保存 → 读取 的集成测试（维护者）
- [ ] 合并 Twitter 与 IG 的 URL 解析为单一 `extractPostId()`（维护者）

## 教训

新平台集成先写验收清单和 fixture 再实现，否则路由、持久化这些基础项会被挤到线上补。

## Changed Files

```
app/routes/plain-ins.tsx
app/components/ins/IGMediaGrid.tsx
app/components/ins/IGActionBar.tsx
app/components/ins/IGTranslateDialog.tsx
app/components/ins/IGCaption.tsx
app/components/ins/IGCardHeader.tsx
app/components/layout/PageHeader.tsx
app/components/tweet/TweetInputForm.tsx
app/routes/api/ig/translate.ts
app/routes/home.tsx
app/lib/utils.ts
app/lib/stores/hooks.ts
```

## 关联报告

- #001 推文解析：同类「数据解析不完整」
- #002 翻译系统：翻译功能开始横跨 Twitter 与 Instagram
