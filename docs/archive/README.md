# 存档（Archive）

**项目**: anonTweet

> 已完成阶段的规划文档归档区。**存档不主动读取** —— 它们记录的是已经结束的上下文。

## 约定

- 阶段计划完成后，用 `git mv` 把计划文档移到本目录（保留历史）
- 归档文档在文件名或开头注明「已完成」及完成日期
- 关键结论（教训/决策）应已同步到 `CLAUDE.md` / `postmortem/` / `planning/architecture.md`（ADR），本目录只留原始计划供追溯
- 不要在此堆活跃文档；活跃文档留在 `docs/` 对应位置（见 `../INDEX.md`）

## 目录

| 文件                                                                                           | 说明                                                                                | 归档日期 |
| ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | -------- |
| [action-plan.md](action-plan.md)                                                               | 整体行动计划与里程碑（全部 ✅ 已完成，2026-08-17）                                  | 2026-08  |
| [testing-infra-refactor.md](testing-infra-refactor.md)                                         | 测试验证基建重构 — 审计报告 + 三层架构计划（Phase A~E ✅）                          | 2026-08  |
| [ai-vision-plan.md](ai-vision-plan.md)                                                         | AI 视觉描述子系统行动计划（Phase 0~5 ✅ 全部完成）                                  | 2026-08  |
| [next-steps.md](next-steps.md)                                                                 | 下阶段行动计划底稿（Phase 2 S5~S10 已完成）                                         | 2026-08  |
| [verification-gap-analysis.md](verification-gap-analysis.md)                                   | 验证体系差距分析（Phase 2 S5~S10 已完成）                                           | 2026-08  |
| [TODO.md](TODO.md)                                                                             | 历史规划（已完成记录 + 约束 + 待办，未决项已迁 backlog）                            | 2026-08  |
| [backlog-completed-2026-09-11.md](backlog-completed-2026-09-11.md)                             | 三阶段排期已完成条目 + 原未决条目裁决明细（活跃清单见 `../planning/backlog.md`）    | 2026-09  |
| [backlog-completed-2026-09-12.md](backlog-completed-2026-09-12.md)                             | 验证诚信修复 F1~F13：主体已完成，F6/F7/F11 裁定「暂不修复」延后归档（测试基建收口） | 2026-09  |
| [backlog-completed-2026-09-12-ig-story.md](backlog-completed-2026-09-12-ig-story.md)           | Instagram Story 接入（单条 story：提取/渲染/缓存键修复，AC-IG-STORY-001~003）       | 2026-09  |
| [backlog-completed-2026-09-12-ig-story-list.md](backlog-completed-2026-09-12-ig-story-list.md) | Instagram Story 列表（tray/精选集：扇出 + 下载优先列表，AC-IG-STORY-001~005）       | 2026-09  |
