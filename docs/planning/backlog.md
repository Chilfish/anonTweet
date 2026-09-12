# Backlog（任务清单）

**项目**: anonTweet | **最后更新**: 2026-09-12

> 本清单**只保留当前阶段关注的未决任务**，不累积已完成条目。规划下一阶段时从这里选任务；条目完成后移入归档。
> 已完成/收口归档：[backlog-completed-2026-09-12-ig-story.md](../archive/backlog-completed-2026-09-12-ig-story.md)（Instagram Story 接入）+ [backlog-completed-2026-09-12.md](../archive/backlog-completed-2026-09-12.md)（验证诚信修复 F1~F13：主体已完成，F6/F7/F11 所有者裁定「暂不修复」延后归档，测试基建到此收口）+ [backlog-completed-2026-09-11.md](../archive/backlog-completed-2026-09-11.md)（三阶段排期已完成条目 + 原未决条目裁决明细）；历史完成记录：[TODO.md](../archive/TODO.md)。

## 约定

- 每个条目：`- [ ] <主题>（前置：... / 关联文档：...）`
- 技术债/重构用 `[refactor]` 前缀；UI 精修用 `[ui]` 前缀；体验/稳定性用 `[ux]` 前缀
- 需求变更需要文档跟进时，标注关联文档路径
- 条目尾注 `（工作量：X 人日 / DRI：X / 风险：X）` 便于排期
- 裁决语义：**采纳**（按排期做）/ **延后**（注明并入阶段）/ **删除**（进不做清单，附理由）
- 里程碑发布前，本清单应为空或全部注明延后理由

## 独立增量

> 阶段计划之外、按需推进的增量项，完成后勾选、移入归档。

- [ ] [ux] 可安装 PWA + Web Share Target：系统分享 X/IG 链接直达推文/IG（方案：`docs/features/pwa/web-share-target.md`；AC：`verify/acceptance-criteria/AC-pwa.md`；域名：https://anon-tweet.chilfish.top/）— ✅ 已实现（AC-PWA-001/002/003 落地）；✅ 能力盘点（`docs/features/pwa/capability-audit.md`，2026-09-06：线上与仓库同步、SW #6900 健康）；✅ 场景落地（2026-09-06，AC-pwa.md v1.3 AC-PWA-004~008）：iOS 安装外壳 meta（apple-touch-icon + apple-mobile-web-app-\*）+ manifest shortcuts(/search)/screenshots(wide/narrow 真实截图) + share 出向（navigator.share，降级复制原文链接）+ share 截图（卡片图转 File 走 Web Share L2 files，不支持降级下载）+ 版本更新提示（可见/聚焦探测新 SW → 横幅「立即刷新」，首次访问不打扰，AC-PWA-008）。**剩余：真机验证**（安装 + 系统分享进出 + iOS 添加主屏幕 + 安装对话框截图，沙箱无设备）+ 视觉验收（图标/theme_color/maskable/apple-touch-icon 底色）。P2 候选（showSaveFilePicker / 最近查看 / 静态缓存需 ADR）见 capability-audit.md。

## 不做清单（裁决为删除/延后，Apple 式减法）

| 条目                                  | 裁决           | 理由                                                                                                                                                  |
| ------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Threads / Bluesky 等新数据源          | 删除（不接）   | 产品定位（工具 vs 平台）裁决前一律不接（review Q1）                                                                                                   |
| Bili 发布功能扩展                     | 延后（无限期） | 保留为隐藏自用入口，不宣传、不扩展、仅卫生化（review P2-1）                                                                                           |
| AI 端点 stream 化 + 编辑器兼容 stream | 删除（不接）   | **所有者裁定（2026-09-12）**：「AI 端点 stream 是个很没必要的功能」；翻译管线维持非流式 `generateText`；原「编辑器 stream」一并随此删除，不再单独立项 |
| 视觉模型训练 / 微调                   | 删除（不接）   | `docs/features/ai-vision/ai-vision.md` §1.3 已明确非目标，维持                                                                                        |
| 外链离开匿名环境提示/设置项           | 删除（不接）   | **所有者裁定（2026-08-19）**：「外链这件事不用管它」；链接卡跳转外部为目标行为，不设提示                                                              |
| jetfuel 官方改版巡检专项              | 删除（不接）   | **所有者裁定（2026-08-19）**：解析改版直接回退普通卡，用户感知反馈后再更新解析程序，不设巡检机制                                                      |

## 归档记录

| 日期       | 内容                                                                                         | 去向                                                                                                                    |
| ---------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 2026-09-12 | Instagram Story 接入已完成条目（AC-IG-STORY-001~003 + fixture + 渲染 + 缓存键修复）          | [archive/backlog-completed-2026-09-12-ig-story.md](../archive/backlog-completed-2026-09-12-ig-story.md)                 |
| 2026-09-12 | Instagram Story 列表（tray / 精选集）已完成条目（AC-IG-STORY-001~005 + canonical id + 扇出） | [archive/backlog-completed-2026-09-12-ig-story-list.md](../archive/backlog-completed-2026-09-12-ig-story-list.md)       |
| 2026-09-12 | 快拍列表改造为网格相册 + 全屏查看器 + 快拍骨架屏 + 移动端适配（AC-IG-STORY-002/006/007）     | [archive/backlog-completed-2026-09-12-ig-story-gallery.md](../archive/backlog-completed-2026-09-12-ig-story-gallery.md) |
| 2026-09-12 | 验证诚信修复 F1~~F5 / F8~~F10 / F12 / F13 已完成条目（F6/F7/F11 剩余项已回填活跃清单）       | [archive/backlog-completed-2026-09-12.md](../archive/backlog-completed-2026-09-12.md)                                   |
| 2026-09-11 | 三阶段排期（阶段一全部 / 阶段二除 2 项 / 阶段三已完成 2 项）已完成条目 + 原未决条目裁决明细  | [archive/backlog-completed-2026-09-11.md](../archive/backlog-completed-2026-09-11.md)                                   |
| 2026-08    | 历史规划（已完成记录 + 约束 + 待办）                                                         | [archive/TODO.md](../archive/TODO.md)                                                                                   |
