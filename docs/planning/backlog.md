# Backlog（任务清单）

**项目**: anonTweet | **最后更新**: 2026-08

> 未决任务跨阶段收拢。规划下一个阶段时从这里选任务；完成后勾选并（如为阶段计划）`git mv` 到 `docs/archive/`。
> 历史完成记录见 `docs/archive/TODO.md`。

## 约定

- 每个条目：`- [ ] <主题>（前置：... / 关联文档：...）`
- 技术债/重构用 `[refactor]` 前缀；UI 精修用 `[ui]` 前缀；体验/稳定性用 `[ux]` 前缀
- 需求变更需要文档跟进时，标注关联文档路径
- 里程碑发布前，本清单应为空或全部注明延后理由

## 当前未决

### 稳定性 / 体验 `[ux]`
）
- [ ] 长链推文/大量媒体时的渲染与截图性能优化（关联：`docs/features/translation/translation.md`）
- [ ] Instagram Story 支持（当前仅 Post/Reel；关联：`docs/features/instagram/instagram-integration.md`）

### 下一步重构 `[refactor]`

- [ ] Translation View Resolver 收敛：散落在 hooks/components/service 的 `manual > ai > original` 选择逻辑统一为纯函数（关联：`docs/features/translation/translation.md`）
- [ ] 编辑器兼容 stream：AI 返回 stream 时支持映射到 overlay 编辑器
- [ ] 性能：更明确的并发/限流策略 + 可观测性（翻译耗时、缓存命中率）
