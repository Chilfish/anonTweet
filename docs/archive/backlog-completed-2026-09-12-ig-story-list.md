# Backlog 归档：Instagram Story 列表（tray / 精选集）2026-09-12

> **状态**：已完成（AC-IG-STORY-001~005 落地，门禁全绿）
> **来源**：所有者实测反馈（输入框不支持 `/stories/{user}/` 与 `/stories/highlights/{id}/`）
> **实施记录**：`docs/development-log/2026-09-12.md`；**功能文档**：`docs/features/instagram/instagram-integration.md` §Story 列表
>
> 承接 [backlog-completed-2026-09-12-ig-story.md](backlog-completed-2026-09-12-ig-story.md)（单条 story 接入），
> 本轮补齐「列表型」输入与渲染。

## 完成内容

- [x] `AC-IG-STORY-001~005`（提取扇出 / 下载优先列表渲染 / 逐 item 持久化 / URL 识别往返 / 下载项提取）；
      `AC-ig-story.md` v1.1
- [x] canonical 单段 id：`story~{u}~{m}` / `stories~{u}` / `highlight~{id}`（`~` 兼容 URL 与 Windows 文件名）
- [x] `normalizeIGPosts()` 扇出：story/highlight 每个 item 一张 `IGPost`（音频-only 过滤）
- [x] `getIGPostList()`：新鲜拉取 + 逐 item 落 localCache/DB + 合并已有翻译
- [x] `IGStoryList`（下载优先）：顶部「共 N 条 / 全选 / 下载选中(n) / 全部下载（进度）」+ 每卡勾选框
      （默认不选）+ 单条下载；快拍只保留下载（`IGHeader` `storyMode` 只留返回）
- [x] `plain-ig` 多卡 SSR；`AC-IG-003`（单条 story id）与 `share.spec` 期望同步更新
- [x] 门禁：`typecheck` / `lint` / `test` 387 / `verify --exit-on-fail` / `build-storybook` 全绿

## 需求口径（所有者）

「ins story 通常就只是拿来下载它的图片或视频而已，翻译或截图的需求并不需要」——因此列表以**下载**
为中心：默认不勾选，手动选择后「下载选中」，或直接「全部下载」。帖子（post/reel）保持原有全套操作。

## 已知取舍 / 剩余

- **列表不缓存**：每次列表访问打一次 SDK `reels_media`（故事 24h 变化、且避免列表陈旧）。
  若后续上游配额吃紧，可加短 TTL 列表缓存。
- 未支持 `{username}/highlights/`（用户全部精选集）与 legacy base64 精选集 URL。
- 真实上游仍由集成层 `AC-IG-008`（需 cookies）把关；合成 fixture 不代表上游字段未漂移。
