# Postmortem 009: 句首补充在 index 对齐合并链路中多处丢失（显示/持久化双失效）

- **日期**: 2026-08-17
- **严重级别**: 中
- **状态**: Active
- **根因归类**: 设计建模

## 摘要

翻译编辑器的「句首补充」（prepend，`index: -1` 实体）在保存后既不显示、刷新后也不恢复：
用户贴出的 `/api/tweet/set` payload 里句首补充实体根本没进同步数据，反而在 `aiTranslation`
上挂着用户手动加的句首文本。根因是**四处各写了一份「按 index 对齐合并」的实现**，全都
只遍历 base（原文实体）并按 index 覆盖，base 里不存在的 `index: -1` 被静默丢弃；另有一处
AI 翻译流丢片段把 AI 译文拆到只剩第一段。功能本身在 `9cec987` 实现时是直接 `unshift`，
`20a1103` 重构引入统一合并后回归。

## 影响

- 返工：约 250 行代码（5 处修复 + 6 个测试文件补用例）+ 2 轮排查
- 用户可见：句首补充无法显示、刷新后丢失；AI 翻译在占位符被移到句中时只剩前半段
- 隐藏风险：`mergeTranslationEntities`（服务端读缓存）与 `applyAITranslations`（AI 写回）
  两处此前**同样在丢数据但无人发现**——任何 index 不落在 base 的实体都会静默消失

## 时间线

| commit / 事件 | 说明                                                                                                                   |
| ------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `9cec987`     | 引入句首补充：保存时 `unshift` 到实体数组，正常                                                                        |
| `20a1103`     | 引入 `resolveTranslationView` + `mergeEntityTranslationsByIndex`：只按 index 对齐 base，句首补充开始被丢（显示层回归） |
| `9288b39`     | materialize / 服务端 merge 同步引入同一套对齐合并，丢数据面扩大                                                        |
| 2026-08-17    | 用户反馈显示+持久化双失效；定位 4 处合并实现 + 1 处 AI 流丢片段；修复 + 测试                                           |

## 根因分析（blameless）

- **贡献因素 1：合并逻辑没有单一事实来源**。显示（`resolveTranslationView`）、materialize
  （`materialize.ts`）、服务端读缓存（`getTweet.server.ts#mergeTranslationEntities`）、AI 写回
  （`entitytParser.ts#applyAITranslations`）四处各自实现「按 index 对齐合并」，语义漂移后
  互相不一致，且没有任何一处考虑「base 中不存在的额外实体」。
- **贡献因素 2：`-1` 是「哨兵 index」，天然不在 base 里**。凡按 index 对齐的实现都会丢掉它，
  需要显式处理「extra entities」，但所有实现都假设「translated 是 base 的 overlay」。
- **贡献因素 3：AI 流片段（index 30000+）与对齐假设冲突**。`restoreEntities` 在占位符被移到
  句中时会产出 base 没有的 index，`applyAITranslations` 直接丢掉——显示层早有
  `shouldRenderTranslatedEntitiesDirectly` 处理流式结果，写回层却没有。
- **贡献因素 4：持久化触发缺口**。手动翻译只在截图时同步服务端，保存只写内存 store
  （store persist 的 `partialize` 不含 translations）——「保存 = 持久化」的预期与实现不符，
  且没有文档说明。

## 做得对的地方

- 用户贴出 `/api/tweet/set` payload 快速缩小了排查范围（同步数据里没有 prepend + aiTranslation 残留）
- 纯函数先补单测再改（`resolveEntities` / `entitytParser` / `getTweet.server` 等）

## 行动项

### 缓解（针对已发生的具体缺口）

- [x] 显示/导出链路：`mergeTranslationsToField` 保留 base 外实体（句首补充插最前）（2026-08-17）
- [x] 服务端读缓存：`mergeTranslationEntities` 保留 `index < 0` 实体（2026-08-17）
- [x] AI 写回：`applyAITranslations` 遇到非对齐流直接返回完整流，不丢片段（2026-08-17）
- [x] 保存即同步：两个编辑器 hook 保存时调用 `syncTranslationData` + `/api/tweet/set` 刷新 localCache（2026-08-17）

### 预防（针对整类问题）

- [ ] 收敛「index 对齐合并」为单一纯函数（`resolveEntities.ts` 已是候选），服务端 merge 与
      AI 写回改为复用同一实现，消除四处漂移（建议 P1）
- [ ] `mergeTranslationEntities` / `applyAITranslations` 补充「extra entities 不被丢」的
      回归测试锚点（已有部分，建议把 `index: -1` 场景纳入 verify fixture）
- [ ] 文档说明持久化语义：保存 = 内存 + 同步 DB；无 DB 环境保存会报错（与截图一致）

## 教训

- 凡是「按 index 对齐合并」的实现，必须显式回答「base 里不存在的实体怎么办」——哨兵 index
  （`-1` / `30000+`）是这类 bug 的高发点，写进 `docs/postmortem/README.md` 高频雷区自查清单

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
