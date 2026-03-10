# TODO（后续）

> 说明：本文件用于跨会话记录翻译子系统重构的需求、约束与下一步计划。
> 核心设计文档见：`docs/feature_translation.md`

## 本轮已完成（2026-03）

- AI 翻译强制结构化 JSON 输出（schema 校验 + 占位符校验 + 一次重试），并支持 `entityText` 覆盖（仅 hashtag/symbol；mention 禁止翻译）
- 修复 UI 错位：当 `autoTranslationEntities` 为“translated stream”时，直接渲染，不再按 index merge
- 引入统一 resolver（纯函数）：`stream vs overlay` 判定与合并策略收敛到 `app/lib/translation/resolveEntities.ts`
- 让 `tweet.entities` 回归“原文只读”：手动翻译只存 `TranslationStore.translations`，并通过 materialize 生成导出/同步视图
  - materialize：`app/lib/translation/materialize.ts`
  - strip translations：`app/lib/stores/logic.ts`
- 性能修复：翻译完成后主动刷新 local cache，避免无 DB/DB 未命中时重复翻译导致请求慢
- 增补测试：
  - `test/resolveEntities.spec.ts`
  - `test/translationMaterialize.spec.ts`

## 约束（必须保持）

- **DB 向后兼容**：`tweet.jsonContent`、`tweet_entities.entities (TranslationEntity[])` 格式不变
- **结果稳定可解析**：LLM 输出必须可被严格解析；placeholder 不可破坏
- **stream/overlay 明确分工**：
  - `autoTranslationEntities`：允许重排/增减片段的 translated stream（可直接渲染）
  - 手动翻译（DB/Store）：index 对齐 overlay（用于编辑器/持久化）

## 测试

- ✅ 已补：服务层单测
  - `app/lib/service/getTweet.ts`（父链/引用推逻辑）
  - `app/lib/service/getTweet.server.ts`（翻译实体合并逻辑已抽出并覆盖）
- ✅ 已补：实体序列化/还原
  - `app/lib/react-tweet/utils/entitytParser.ts`（占位符与 media_alt 分支覆盖）
- ✅ 已补：API 路由最小单测（mock 上游）
  - `/api/tweet/get/:id`
  - `/api/ai/ai-translation`
- ⏳ 待补：翻译三态渲染（store + UI）
  - `Manual -> AI -> Original` 回退策略一致性（需要补 React 组件测试或最小 store 测试）

## 稳定性/体验

- 上游失败率/429 统计与 UI 提示（引导用户配置更多 `TWEET_KEYS`）
- 长链推文/大量媒体时的渲染与截图性能优化
- 配置项整理成“配置矩阵”（必需/可选、仅本地/仅生产）

## 下一步重构计划（建议顺序）

### 1) Translation View Resolver（统一“展示视图”生成）

目标：把散落在 hooks/components/service 的 “manual > ai > original” 选择逻辑统一成纯函数，降低心智负担。

- 新增：`app/lib/translation/resolveTranslationView.ts`（纯函数）
  - 输入：`tweet` + `store.translations[tweetId]` + `settings/visibility/mode`
  - 输出：`{ shouldShow: boolean; entities: Entity[]; source: 'manual'|'ai'|'original' }`
- 替换调用：
  - `app/hooks/use-tweet-translation.ts`
  - `app/components/tweet/PlainTweet.tsx`（目前直用 `autoTranslationEntities`）
  - 相关导出/复制逻辑如有分支也收敛
- 补测试：覆盖三态 + visibility + stream/overlay 分支

### 2) 编辑器兼容 stream（不改 DB 格式）

现状：编辑器只支持 overlay 回填；当 AI 返回 stream 时只能提示“去正文看”。

可选路线（按成本从低到高）：

- A. 只把 stream 渲染给用户，编辑器继续只编辑 overlay（最简单、最稳）
- B. 增加“一键导入 AI 译文到编辑器”的映射策略（需要定义 stream→overlay 的对齐规则；风险较高）

### 3) 性能：避免不必要的翻译与重复请求

- 继续完善 local cache/DB 命中路径的“短路”策略（已做：翻译后刷新缓存）
- 对 `/api/tweet/get` 引入更明确的并发/限流策略（避免一次拉取 thread 时串行等待）
- 增加可观测性：记录一次请求中翻译耗时、翻译条数、命中缓存条数

## 新窗口开场白（复制到新会话）
