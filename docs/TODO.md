# TODO（后续）

> 说明：本文件用于跨会话记录项目整体需求、约束与下一步计划。
> 核心设计文档：`docs/project_architecture.md` / `docs/feature_translation.md`

## 已完成（2026-05）

### Instagram 集成（5 阶段）

- ✅ 类型定义 + URL 识别 + 路由骨架（`extractIGId`、`detectInputType`、`/ins/:id`）
- ✅ API 层：SDK 集成 + BFF 路由（`@chilfish/gallery-dl-instagram`、`/api/ig/get`）
- ✅ UI 组件：`InstagramPostCard` + `PlainIGPost` + 13 个子组件（九宫格、透卡相框）
- ✅ 操作区：`IGHeader`（翻译/截图/下载/复制）+ `IGOptionsMenu` + `IGTranslateToggle`
- ✅ AI 翻译管线：`translateIGCaption.ts`（纯文本，无实体占位符）+ `IGTranslateDialog`
- ✅ DB 缓存：`ig_post` 表 + `getIGPost.server.ts` 三层缓存
- ✅ 纯文本路由：`/plain-ins/:id` + `PlainIGPost`
- ✅ Barrel export：`app/components/ins/index.ts` 统一导出
- ✅ Storybook 用例：14 个 IG 组件 story

### 代码质量修复（2026-05-31）

- ✅ 删除 `PlainIGPost` 向 `IGCaption` 传递的不存在 `tags` prop
- ✅ 删除 `utils.ts` 中死代码 `proxyMedia()`（已被 Zustand hook `useProxyMedia` 替代）
- ✅ `RettiwtPool.shouldRetry()` 新增 401/403 轮换（之前只处理 429）
- ✅ `catch (error: any)` → `catch (error: unknown)` 类型安全改进
- ✅ 提取共享 `formatIGTime()` 到 `utils.ts`，消除 PlainIGPost / InstagramPostCard 重复
- ✅ `structuredClone()` 替换 `JSON.parse(JSON.stringify())`（cache 深拷贝性能优化）
- ✅ 删除未使用的 `createSelectors()` 函数
- ✅ `getTweetSchema` thinkingLevel enum 添加 `'max'`（修复类型不匹配）
- ✅ 修复 `plain.tsx` / `tweet.tsx` 缺失的 `force` 参数

### 翻译子系统（2026-03）

- ✅ AI 翻译强制结构化 JSON 输出（schema 校验 + 占位符校验 + 一次重试）
- ✅ 引入统一 resolver（纯函数）：`stream vs overlay` 判定与合并策略
- ✅ 让 `tweet.entities` 回归原文只读：手动翻译只存 `TranslationStore`
- ✅ materialize / strip translations 纯函数
- ✅ 性能修复：翻译完成后主动刷新 local cache
- ✅ 增补测试：`resolveEntities`、`translationMaterialize`、服务层单测

## 约束（必须保持）

- **DB 向后兼容**：`tweet.jsonContent`、`tweet_entities.entities` 格式不变
- **结果稳定可解析**：LLM 输出必须可被严格解析；placeholder 不可破坏
- **stream/overlay 明确分工**：`autoTranslationEntities` 允许重排/增减片段的 translated stream；手动翻译 index 对齐 overlay

## 待完成

### 测试

- ⏳ 补：翻译三态渲染（store + UI）— `Manual -> AI -> Original` 回退策略一致性

### 稳定性/体验

- 上游失败率/429 统计与 UI 提示（引导用户配置更多 `TWEET_KEYS`）
- 长链推文/大量媒体时的渲染与截图性能优化
- Instagram Story 支持（当前仅 Post/Reel）
- IG 评论区（需要 Instagram 评论 API 接口）

### 下一步重构计划

1. **Translation View Resolver 收敛**：散落在 hooks/components/service 的 "manual > ai > original" 选择逻辑统一为纯函数
2. **编辑器兼容 stream**：当 AI 返回 stream 时支持映射到 overlay 编辑器
3. **性能**：引入更明确的并发/限流策略，增加可观测性（翻译耗时、缓存命中率）
