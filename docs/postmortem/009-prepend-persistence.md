# Postmortem 009: 句首补充在 index 对齐合并链路中多处丢失

- **日期**: 2026-08-17
- **严重级别**: SEV-2
- **分类**: 架构
- **状态**: Active
- **根因归类**: 设计建模

## 摘要

翻译编辑器的句首补充（prepend，`index: -1` 实体）保存后既不显示、刷新也不恢复。用户贴出的 `/api/tweet/set` payload 里句首补充根本没进同步数据，反而挂在 `aiTranslation` 上。根因是四处各写了一份「按 index 对齐合并」，都只遍历 base 并按 index 覆盖，base 里不存在的 `index: -1` 被静默丢弃；另有一处 AI 翻译流把译文拆得只剩第一段。

## 影响

- 用户可见：句首补充不显示、刷新后丢失；AI 翻译在占位符被移到句中时只剩前半段。
- 返工：约 250 行改动（5 处修复 + 6 个测试文件补用例），两轮排查。
- 隐藏风险：`mergeTranslationEntities`（服务端读缓存）与 `applyAITranslations`（AI 写回）此前同样在丢数据，只是无人发现。

## 时间线

| 日期 | commit | 事件 |
| ---- | ------ | ---- |
| 2025-09-24 | `9cec987` | 引入句首补充，保存时 `unshift` 到实体数组，行为正常 |
| 2026-03-11 | `20a1103` | 引入 `resolveTranslationView` + `mergeEntityTranslationsByIndex`，只按 index 对齐 base，句首补充开始被丢 |
| 2026-03-11 | `9288b39` | materialize 与服务端 merge 引入同一套对齐合并，丢数据面扩大 |
| 2026-08-17 | — | 用户反馈显示与持久化双失效，定位 4 处合并与 1 处 AI 流丢片段，修复并补测试 |

## 根因分析

1. 合并逻辑没有单一事实来源。显示（`resolveTranslationView`）、materialize、服务端读缓存（`getTweet.server.ts#mergeTranslationEntities`）、AI 写回（`entitytParser.ts#applyAITranslations`）四处各实现一份，语义漂移后互相不一致，且都没考虑 base 中不存在的额外实体。
2. `-1` 是哨兵 index，天然不在 base 里，凡按 index 对齐的实现都会丢掉它。需要显式处理 extra entities，但所有实现都假设 translated 是 base 的覆盖层。
3. AI 流片段（`index: 30000+`）与对齐假设冲突，`applyAITranslations` 直接丢掉。显示层早有 `shouldRenderTranslatedEntitiesDirectly` 处理流式结果，写回层没有。
4. 持久化触发有缺口：手动翻译只在截图时同步服务端，保存只写内存 store（persist 的 `partialize` 不含 translations），「保存 = 持久化」的预期与实现不符，且没有文档说明。

一句话归纳：「按 index 对齐合并」被复制成四份，且都假定 translated 是 base 的覆盖层，base 之外的实体（`-1`、`30000+`）必然被丢。

## 触发条件

用户添加句首补充，或 AI 把占位符移到句中，产生 base 里不存在的 index。

## 检测

用户反馈，并附上了 payload。当时的盲区是合并实现没有「extra entities 不被丢」的测试，服务端与 AI 写回两条路径都没人覆盖。

## 处置

`mergeTranslationsToField` 保留 base 外实体（句首补充插最前）；`mergeTranslationEntities` 保留 `index < 0`；`applyAITranslations` 遇非对齐流直接返回完整流；两个编辑器 hook 保存时调用 `syncTranslationData` 并刷新 localCache。

## 做得对的地方

用户贴出的 payload 快速缩小了排查范围。纯函数先补单测再改。

## 行动项

### 缓解

- [x] 显示/导出链路保留 base 外实体，句首补充插最前（`mergeTranslationsToField`；维护者）
- [x] 服务端读缓存保留 `index < 0` 实体（`mergeTranslationEntities`；维护者）
- [x] AI 写回遇非对齐流返回完整流（`applyAITranslations`；维护者）
- [x] 保存即同步：两个编辑器 hook 保存时同步服务端并刷新 localCache（维护者）

### 预防

- [ ] 收敛「index 对齐合并」为单一纯函数，服务端与 AI 写回复用同一实现（维护者；判据：全局只剩一份合并实现）
- [ ] 补「extra entities 不被丢」的回归锚点，把 `index: -1` 场景纳入 verify fixture（维护者）
- [ ] 文档说明持久化语义：保存 = 内存 + 同步 DB，无 DB 环境保存会报错（维护者）

## 教训

凡是「按 index 对齐合并」的实现，必须显式回答 base 里不存在的实体怎么办。哨兵 index 是这类 bug 的高发点。

## Changed Files

```
app/lib/translation/resolveEntities.ts
app/lib/markdown.ts
app/lib/service/getTweet.server.ts
app/lib/react-tweet/utils/entitytParser.ts
app/routes/api/tweet/set.ts
app/hooks/use-translation-editor-logic.ts
app/hooks/use-alt-translation-logic.ts
```

## 关联报告

- #002 翻译系统：同一段翻译链路上的耦合问题
- #001 推文解析：实体处理共用同一批模块
