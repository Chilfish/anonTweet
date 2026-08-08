# Anon Tweet 文档索引

> 项目文档与工程规范的总入口。规范流程见 [CLAUDE.md](../CLAUDE.md) 的「🔴 强制规范」。

## 架构与设计

| 文档                                              | 说明                                                                     |
| ------------------------------------------------- | ------------------------------------------------------------------------ |
| [Project Architecture](project_architecture.md)   | 系统架构 v3.0 — BFF 模式、React Router v8、数据流、RettiwtPool、三层缓存 |
| [Translation Subsystem](feature_translation.md)   | 翻译引擎核心设计 — 实体占位符保护、entity stream、双提供商               |
| [Instagram Integration](integration_instagram.md) | IG 集成 5 阶段实施追踪（Post/Reel/Story）                                |
| [IG Actions & DB](ig-actions-integration.md)      | IG 操作区、DB 缓存、AI 翻译管线                                          |
| [DeepSeek Provider](deepseek-ai-sdk.md)           | DeepSeek AI 提供商配置与使用                                             |
| [UI/UX Design](ui-design/OVERVIEW.md)             | 设计原则与组件规范（native-first、macOS/iOS HIG）                        |

## 验证体系

| 文档                                                      | 说明                                                                 |
| --------------------------------------------------------- | -------------------------------------------------------------------- |
| [Verification Suite](../verify/README.md)                 | 验证套件 — CLI + Fixture 库 + API 测试 SDK                           |
| [Verification Gap Analysis](verification-gap-analysis.md) | 验证体系差距分析与下阶段路线图（S5-S10）                             |
| [Next Steps](next-steps.md)                               | 下阶段行动计划 — CI/CD、Screenshot/Media Verifier、Postmortem 自动化 |

## 规划（planning/）

| 文档                                         | 说明                                                              |
| -------------------------------------------- | ----------------------------------------------------------------- |
| [Action Plan](planning/action-plan.md)       | 整体行动计划与里程碑（进行中）                                    |
| [Architecture ADR](planning/architecture.md) | 架构决策记录 — RettiwtPool / 双 Provider / Zustand / BFF / verify |

## 工程规范（engineering/）

| 文档                                                  | 说明                                                  |
| ----------------------------------------------------- | ----------------------------------------------------- |
| [Code Style](engineering/code-style.md)               | TypeScript/React/Zustand 代码规范、命名、禁止事项     |
| [Git Workflow](engineering/git-workflow.md)           | 分支模型、Commit 规范、Commit 纪律、PR 流程、版本发布 |
| [Release Checklist](engineering/release-checklist.md) | 发版真机验收清单                                      |

## 部署

| 文档                        | 说明                                |
| --------------------------- | ----------------------------------- |
| [Deployment](deployment.md) | 生产环境、Vercel 优化、基础设施清单 |

## 项目记录

| 文档                                  | 说明                                        |
| ------------------------------------- | ------------------------------------------- |
| [开发日志](development-log/README.md) | 开发日志（按天记录）                        |
| [Postmortem](postmortem/README.md)    | 尸检报告索引 — 历史踩坑沉淀，开写代码前必读 |
| [TODO](TODO.md)                       | 已完成记录 + 约束 + 待办（历史规划）        |

## 存档（archive/）

已完成阶段的规划文档归档于此。**仅供历史查阅，不再主动读取**（避免污染上下文）。

| 文档       | 说明                           |
| ---------- | ------------------------------ |
| （待归档） | 后续阶段完成的规划文档移入此处 |

## 根目录文档

| 文档                                     | 说明                       |
| ---------------------------------------- | -------------------------- |
| [../README.md](../README.md)             | 项目介绍、技术栈、快速开始 |
| [../CHANGELOG.md](../CHANGELOG.md)       | 变更日志                   |
| [../CONTRIBUTING.md](../CONTRIBUTING.md) | 贡献指南                   |
| [../LICENSE](../LICENSE)                 | MIT License                |

## 约定

- 所有文档使用中文（README, CHANGELOG, LICENSE, CONTRIBUTING 除外）
- **验证先行**：每个功能先有 AC（验收标准），再写接口/测试，最后实现
- 需求变更时更新对应文档
- ADR 记录在 `planning/architecture.md`
- 所有 PR 必须更新 CHANGELOG（Unreleased 部分）
- 开发日志按天记录在 `development-log/` 目录（新的一天新建 `YYYY-MM-DD.md`）
- **阶段完成的规划文档移入 `archive/`**：存档 = 历史记录，不主动读取；活跃文档只留 `planning/` 内的 Action Plan / 当前阶段 TODO / 设计文档 / ADR
