# Instagram 个人主页验收标准

> ⚠️ **状态：功能未上线（入口隐藏，2026-11-18 裁决）**。本 AC 只覆盖离线映射与渲染，
> 不代表真实上游链路可用；恢复上线前需补真实 cookie 验证与 bot 风控评估。
> 详见 `docs/features/instagram/instagram-integration.md` §个人主页。
>
> 版本：1.0 | 日期：2026-11-18
> 关联 Verifier：`test/acceptance/ac-ig-profile.spec.ts`
> 执行命令：`bun run verify/index.ts --module ig [--ac AC-IG-PROFILE-NNN]`
> 关联文档：`docs/features/instagram/instagram-integration.md` · `docs/planning/backlog.md`
> 关联 fixture：`test/fixtures/ig-posts/user-info.json` · `user-feed.json`

> **数据来源限制（如实标注）**：001/002 的 fixture 是按 SDK `Message` / `DirectoryMsg` /
> `ParsedPost` 类型契约构造的**合成消息流**（沙箱无 `INS_COOKIES` 时的离线回归），验证的是
> **上游消息 → 本地结构**的映射行为，不证明上游字段未漂移。真实上游链路由集成层
> `/api/ig/user/{username}` 在配置 cookies 后人工核验。
>
> **上游能力边界**：SDK 无公开翻页游标（`cursor` 只随迭代内部更新，配置里的
> `cursor` 读取函数未被调用），因此主页只取**第一页帖子**（`max-posts` 截断）；
> 同实例第二次请求起有 6–12s 节流，故 info / posts 各自新建实例并行发起。

---

## AC-IG-PROFILE-001：主页资料标准化（消息流 → 纯函数）

- **输入**：`user-info.json`（单个 directory，含 follower/following/media 计数）
- **验证对象**：`normalizeIGProfile()`（`app/lib/ig/normalizeIGProfile.ts`，纯函数）
- **预期输出**：`IGProfile | null`
- **Pass 条件**：
  - `username` / `fullname` / `biography` 映射正确（保留 bio 换行）
  - `avatarUrl` 取 HD 头像（`profile_pic_url_hd`）
  - `followers` / `following` / `mediaCount` 为数字
  - `verified` / `isPrivate` / `externalUrl` 映射
  - **反证**：空消息流返回 `null`；无 directory 返回 `null`
- **验证方法**：行为断言（fixture 作**输入** → 调真实纯函数 → 断言产出）

---

## AC-IG-PROFILE-002：用户 feed 扇出（消息流 → 多帖）

- **输入**：`user-feed.json`（2 个 directory + 各自 url 消息：1 图 + 1 视频）
- **验证对象**：`normalizeIGFeed()`（`app/lib/ig/normalizeIGPost.ts`，纯函数）
- **预期输出**：`IGPost[]`
- **Pass 条件**：
  - 产出 **2 项**（按 directory 切段，不能合并成一张多图帖）
  - `id` 顺序为 `DdL3LK7Tvj9` / `DdL3LK7Tvj0`，`type` 为 `post` / `reel`
  - 每项 `media.length === 1`；reel 的 `media[0].type === 'video'`
  - `created_at` 取各自 directory 的 `post_date`
- **验证方法**：行为断言（纯函数）

---

## AC-IG-PROFILE-003：主页 URL 识别与源 URL 构造（纯函数）

- **输入**：Instagram 主页 / 帖子 / 快拍 / 保留路径等 URL
- **验证对象**：`extractIGUsername()` / `igUsernameSourceUrl()`（`app/lib/url-detect.ts`）
- **Pass 条件**：
  - `https://www.instagram.com/{username}/`（含 query、无尾斜杠）→ 用户名
  - **反证**：`/p/`、`/reel/`、`/stories/…` 链接与裸用户名 → `null`（不与 post shortcode 混淆）
  - **反证**：`/explore/…`、`/accounts/…` 等保留路径 → `null`
  - `igUsernameSourceUrl(u, 'info' | 'posts')` → `https://www.instagram.com/{u}/{kind}/`
- **验证方法**：行为断言（纯函数）

---

## AC-IG-PROFILE-004：主页资料卡 / 帖子网格 / 骨架屏渲染

- **输入**：AC-IG-PROFILE-001 的资料 + AC-IG-PROFILE-002 的帖子
- **验证对象**：`IGProfileCard` / `IGProfilePostGrid` / `IGProfileSkeleton`
- **Pass 条件**：
  - 资料卡渲染 `data-slot="ig-profile-card"`，含 `@username`、显示名、bio、
    `ig-profile-stats`（帖子 / 粉丝 / 关注）与外链 `href`
  - 帖子网格渲染 `data-slot="ig-profile-grid"`，每格是 `aria-label="查看第 k 条帖子"`
    的链接，指向 `href="/ins/{id}"`
  - 骨架屏含 9 个 `data-slot="ig-profile-skeleton-cell"`（3 列 × 3 行）
  - **反证**：资料卡不含帖子互动区（`aria-label="点赞"`）
- **验证方法**：行为断言（`renderToString` 结构与文案，`MemoryRouter` 包裹）

---

## 总计：4 条 AC

| AC                | 分类        | 依赖 INS_COOKIES | 依赖 AI | 依赖 server |
| ----------------- | ----------- | ---------------- | ------- | ----------- |
| AC-IG-PROFILE-001 | 纯函数/离线 | 否               | 否      | 否          |
| AC-IG-PROFILE-002 | 纯函数/离线 | 否               | 否      | 否          |
| AC-IG-PROFILE-003 | 纯函数/离线 | 否               | 否      | 否          |
| AC-IG-PROFILE-004 | 渲染/离线   | 否               | 否      | 否          |
