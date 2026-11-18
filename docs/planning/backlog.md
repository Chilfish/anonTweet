# Backlog（任务清单）

**项目**: anonTweet | **最后更新**: 2026-09-27

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

- [ ] [feat] **浏览历史页 `/history` + 详情快照缓存**（方案：`docs/planning/browse-history.md`；AC-HOME-001/003/004/005/006）— 删除「继续阅读」宽卡，首页改为 3 条最近查看 +「全部」入口；`/history` 重做为本地资料库 dashboard（全历史统计 + 日历热力图 + 常看作者/时段 + 作者筛选/日期或作者分组 + 列表/表格 + 20 条/页分页 + JSON 导出）；IndexedDB 升到 v4 新增 `visits` 事件 store（摘要 1000 / 事件 5000，v3 回填），`snapshots` 保留最近 100 条完整详情。详情页 `clientLoader` / SWR 本地优先，命中快照即不请求；截图与翻译保存 `flushSnapshot` 回写；search / list / timeline 不写缓存。✅ dashboard + 本地优先（2026-11-18）。（风险：本地优先会长期展示旧数据，依赖 `SNAPSHOT_LIMIT` 淘汰或用户清空）

- [ ] [feat] **X Article（长文）解析 / 渲染 / 分块翻译**（方案：`docs/features/tweet/article.md`；ADR-009；AC-TWEET-012~019）— ✅ **功能完成（2026-09-27）**：纯文本修复 ✅ + 富文本块文档解析 ✅ + 独立阅读页 `/article/:id` + 紧凑卡 ✅ + 分块翻译端到端 ✅（migration `0002_*` + `/api/tweet/set` intent `updateArticleTranslations` + 阅读页自动翻译/三态开关 + loader 回填 + AC-017/018）+ `llms.ts`/OpenAPI 快照/SKILL.md 补 `article`；阅读页 UX 精修（工具栏：三态开关/重试/一键截图 + 更多菜单：设置/分享/复制/下载图片、`bg-card` 卡片、译文 localCache+DB 双层、rich 去冗余 `plainText`、行内样式按区间精确切分、内嵌推文真实渲染（并行取数/失败回退链接卡））。**剩余（非阻塞）**：① 线上库执行 `db:migrate`（owner 环境）；② 可选 `plain-article/:id` 截图路由。（LLM 分批翻译已对真实 DeepSeek 端点验证并修复「模型输出非法 JSON → 整篇 500」，见 AC-TWEET-020 / AC-OBS-002）。**风险**：`react-markdown` 新增依赖、`content_state` 上游演化。（工作量：约 2 人日 / DRI：— / 风险：中）

- [ ] [feat] **SEO 元信息补齐（动态页不收录）**（方案：`docs/planning/seo-strategy.md`；AC：`verify/acceptance-criteria/AC-seo.md`，AC-SEO-001~003）— ✅ **metadata 管道已完成（2026-11-18）**：新增 `app/lib/seo.ts`（`buildMeta` / `clampDescription` / `ogLocale`）；`root.tsx` 移除写死的 `<title>`/description/robots/OG，改 root `meta()` 兜底，消除线上双 title；9 个动态路由（tweet/article/ins/list/search/plain/plain-ig/bili/404）统一 `noindex, follow`；`/`、`/about` 保留 index + 绝对 canonical；sitemap 收敛为 `/` 与 `/about`；robots 屏蔽截图与自用入口。**剩余（非本轮）**：① `/about` 已扩写（2026-11-18：功能 / 数据边界 / 构建 / 接口 / 链接，实心表面 + 移动端留白）；② 接 Search Console/Bing 并提交 sitemap；③ 视数据再决定是否放开（本轮已裁决不收录）。**风险**：内容不收录则无长尾流量，工具页内容质量是唯一抓手。（工作量：已完成 / DRI：— / 风险：低）

- [ ] [refactor] **非 AI 路由失败响应的字段统一与日志上下文**（2026-09-27 审计；AI 路由已由 AC-OBS-002 收口）— ① `api/tweet/{get,search,list,replies}.ts`、`api/user/{get,timeline}.ts`、`api/bili-post.tsx` 的失败响应字段不统一（部分缺 `success`；`error` 语义在机器码与人话之间摇摆），且多数不带实体 id；② `api/tweet/list` / `api/tweet/replies` / `api/user/get` 无 try/catch，异常直接裸 500 且无日志；③ `api/ig/get.ts` 的 loader 失败丢掉 message 与上游 status（`api/proxy/image.ts`、`api/tweet/search.ts` 本轮已补日志）。**注**：HTTP status 固定 200 是既有约定（业务拦截与网关故障由 `body.status` 区分），不是缺陷；`api/ig/translate.ts` 仍用真实 4xx/5xx，是否统一待裁决。（工作量：约 1 人日 / DRI：— / 风险：低）

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
| 2026-09-16 | X Space 卡片接入（AC-SPACE-001~008 + fixture + 渲染 + 正文去重；非 backlog 条目，直连需求）  | [features/tweet/space-card.md](../features/tweet/space-card.md)                                                         |
| 2026-09-12 | Instagram Story 接入已完成条目（AC-IG-STORY-001~003 + fixture + 渲染 + 缓存键修复）          | [archive/backlog-completed-2026-09-12-ig-story.md](../archive/backlog-completed-2026-09-12-ig-story.md)                 |
| 2026-09-12 | Instagram Story 列表（tray / 精选集）已完成条目（AC-IG-STORY-001~005 + canonical id + 扇出） | [archive/backlog-completed-2026-09-12-ig-story-list.md](../archive/backlog-completed-2026-09-12-ig-story-list.md)       |
| 2026-09-12 | 快拍列表改造为网格相册 + 全屏查看器 + 快拍骨架屏 + 移动端适配（AC-IG-STORY-002/006/007）     | [archive/backlog-completed-2026-09-12-ig-story-gallery.md](../archive/backlog-completed-2026-09-12-ig-story-gallery.md) |
| 2026-09-12 | 验证诚信修复 F1~~F5 / F8~~F10 / F12 / F13 已完成条目（F6/F7/F11 剩余项已回填活跃清单）       | [archive/backlog-completed-2026-09-12.md](../archive/backlog-completed-2026-09-12.md)                                   |
| 2026-09-12 | DeepSeek 视觉渠道 + 模型对齐官方文档（AC-VISION-013）                                        | [archive/backlog-completed-2026-09-12-deepseek-vision.md](../archive/backlog-completed-2026-09-12-deepseek-vision.md)   |
| 2026-09-11 | 三阶段排期（阶段一全部 / 阶段二除 2 项 / 阶段三已完成 2 项）已完成条目 + 原未决条目裁决明细  | [archive/backlog-completed-2026-09-11.md](../archive/backlog-completed-2026-09-11.md)                                   |
| 2026-08    | 历史规划（已完成记录 + 约束 + 待办）                                                         | [archive/TODO.md](../archive/TODO.md)                                                                                   |
