# X Space（语音直播/录音回放）卡片验收标准

> 版本：1.0 | 日期：2026-09-16
> 对应 Postmortem：001 (Tweet Parsing), 002 (Translation System)
> 关联方案：`docs/features/tweet/space-card.md`
> 执行命令：`bun run verify/index.ts --module space`
> 样本：真实推文 `1968314084207788302`（夢限大みゅーたいぷ 合宿 3 日目 Space，`Ended` + 可回放）
>
> 背景：Space 推文的 `card.name` 为 `3691233323:audiospace`，`binding_values` 只有
> `tweet_id` / `narrow_cast_space_type` / `id` / `card_url`，**既无 title/description 也无图片**，
> 因此 `mapTwitterCard` 的最终校验会把它整个丢弃（`/api/tweet/get` 实测无 `card`）。
> 卡片所需的标题/主播/人数/时长全部在 GraphQL `AudioSpaceById` 的 `audioSpace.metadata` 里，
> 必须走一次独立上游请求。
>
> 范围裁定（owner 2026-09-16）：**只做卡片 + 跳转 X 播放**。站内播放需要 `hls.js` +
> 服务端媒体代理（pscp.tv 的 m3u8 实测 `Access-Control-Allow-Origin: https://x.com`，
> 浏览器跨源取流被拦），本期不做。

---

## AC-SPACE-001：audiospace 卡片识别

- **输入**：真实推文 `1968314084207788302` 的原始 `card`（`test/fixtures/space/audio-space-card.json`）
- **预期输出**：`extractAudiospaceId(card)` 返回 Space id
- **验证方法**：`bun run verify/index.ts --ac AC-SPACE-001`（`test/unit/space.spec.ts`）
- **Pass 条件**：
  - 返回 `1yoKMPnjEbOxQ`
  - 非 audiospace 卡（如 `summary_large_image`）返回 `null`
  - 缺失 `binding_values` / 缺失 `id` / `card` 为 `undefined` 时返回 `null`，不抛错

---

## AC-SPACE-002：AudioSpaceById 元数据映射

- **输入**：真实 `AudioSpaceById` 响应（`test/fixtures/space/audio-space-ended.json`）
- **预期输出**：`mapSpaceDetails(raw)` 返回结构化 `SpaceDetails`
- **验证方法**：`bun run verify/index.ts --ac AC-SPACE-002`
- **Pass 条件**：
  - `id === '1yoKMPnjEbOxQ'`，`url === 'https://x.com/i/spaces/1yoKMPnjEbOxQ'`
  - `title === '#ゆめみた合宿3日目！ついに最終日！✨コメントはハッシュタグにてお願いします✨'`（CJK 与 emoji 未被截断）
  - `state === 'Ended'`，`isReplayAvailable === true`
  - `durationMs === 2560946`（`ended_at - started_at`，对应官方卡片 `42:40`）
  - `liveListenersCount === 1245`、`replayCount === 1233`、`listenersCount === 2478`（官方卡片 `2,478 人がリスニング/リプレイ`）
  - `host.name === '夢限大みゅーたいぷ'`、`host.screenName === 'BDP_yumemita'`
  - `host.avatarUrl` 指向 `pbs.twimg.com/profile_images/…`
  - 主播即推文作者时，认证信息由推文侧用户对象补齐（`is_blue_verified === true`、
    `verified_type === 'Business'`）——`AudioSpaceById` 的 `creator_results` 是精简对象，
    自身不含这两个字段

---

## AC-SPACE-003：畸形/缺失元数据不抛错

- **输入**：空 spaceId、缺 `title`、缺 `ended_at`、缺 `creator_results`、非法时间戳
- **预期输出**：`mapSpaceDetails()` 返回 `null` 或降级对象，绝不抛错
- **验证方法**：`bun run verify/index.ts --ac AC-SPACE-003`
- **Pass 条件**：
  - **仅当 spaceId 为空**时返回 `null`（没有 id 就构造不出任何 URL）
  - 缺 `title` 的 metadata → 不抛错，`title === ''`（不整块丢弃）
  - 缺 `ended_at`（进行中场次）→ 不抛错，`durationMs === null`
  - 缺 `creator_results` → `host.screen_name` 为空串，`title` / `listenersCount` 仍可用
  - 非法时间戳（如 `ended_at: 'not-a-number'`）→ `durationMs === null`，不抛错

---

## AC-SPACE-004：展示格式化（时长 / 日期 / 人数）

- **输入**：AC-SPACE-002 的 `SpaceDetails`
- **预期输出**：`formatSpaceDuration` / `formatSpaceDate` / `formatSpaceListeners`
- **验证方法**：`bun run verify/index.ts --ac AC-SPACE-004`
- **Pass 条件**：
  - `formatSpaceDuration(2560946) === '42:40'`；`>= 1 小时` → `1:02:03` 形态；`null` → 空串
  - `formatSpaceDate(1758117620659) === '9月17日'`（实测数据；不补前导零，与官方卡片一致）
  - `formatSpaceListeners(2478) === '2,478'`（千分位）

---

## AC-SPACE-005：Space 卡片组件真实渲染

- **输入**：由真实 fixture 映射出的 `EnrichedTweet`（`space` 字段非空）
- **预期输出**：`TweetSpaceCard` 渲染官方结构
- **验证方法**：`renderToString(createElement(TweetSpaceCard, ...))` + HTML 断言
  （`test/acceptance/space-render.spec.ts`）
- **Pass 条件**：
  - 外层跳转为 `https://x.com/i/spaces/1yoKMPnjEbOxQ`，`target="_blank"` + `rel` 含 `noopener`
  - 渲染主播名、标题、`2,478`、`9月17日`、`42:40`、`播放录音`
  - 主播头像 `alt=""`（装饰图，名称文本已承载可访问名称）
  - 卡片跳转是无障碍名称来源（`aria-label` 含标题）
  - 不渲染冗余装饰/标签：无「主播」标记、无联合账号小徽标（14px 下不可辨识的噪音）

---

## AC-SPACE-006：无 space 数据空渲染

- **输入**：`space` 为 `undefined` 的 `EnrichedTweet`
- **预期输出**：`TweetSpaceCard` 返回空串（不渲染、不报错）
- **验证方法**：`renderToString` 断言（`space-render.spec.ts`）

---

## AC-SPACE-007：正文不重复渲染 Space 链接

- **输入**：`space` 非空、`entities` 含指向 `x.com/i/spaces/…` 的 url 实体的 `EnrichedTweet`
- **预期输出**：`TweetBody` 跳过该链接文本（官方前端同样只显示卡片）
- **验证方法**：`renderToString` 断言（`space-render.spec.ts`）
- **Pass 条件**：
  - `space` 非空时，正文不出现该 Space 的 `display_url` / `href`
  - `space` 为空（元数据获取失败）时，链接**照常渲染**（优雅降级，不静默吞链接）
  - 其他 url 实体（非 Space）不受影响

---

## AC-SPACE-008：请求层锁定 AudioSpaceById

- **输入**：`SpaceRequests.details('1yoKMPnjEbOxQ')` 生成的 AxiosRequestConfig
- **预期输出**：GraphQL 请求指向 AudioSpaceById，variables 含 `withReplays: true`
- **验证方法**：单测断言请求配置（`test/unit/space.spec.ts`）
- **Pass 条件**：
  - `url` 以 `/graphql/HPEisOmj1epUNLCWTYhUWw/AudioSpaceById` 结尾
  - `variables` 解析后 `id === '1yoKMPnjEbOxQ'` 且 `withReplays === true`
  - `method === 'get'`

---

## AC-SPACE-009：已删除 / 不可访问的 Space 给墓碑提示

- **背景**：改动前这类 Space 会静默什么都不显示，正文只剩一个裸 `t.co` 链接 ——
  用户无法区分「没做这个功能」和「这个 Space 没了」。
- **输入**：
  - `test/fixtures/space/audio-space-unavailable.json` —— 推文 `2057046686871232598` →
    Space `1DGLdvzVZmLGm`；`AudioSpaceById` 只回 `{ is_subscribed: false }`，**没有 metadata**
  - `test/fixtures/space/audio-space-cardless-tweet.json` —— 推文 `1871586443388420240`
    **完全没有 card**，正文里只有一个指向 Space `1djGXroNWDExZ` 的 url 实体（同样已删除）
- **预期输出**：`mapSpaceDetails()` 返回 `availability === 'unavailable'` 的墓碑对象；
  `TweetSpaceCard` 渲染中性提示条
- **验证方法**：`bun run verify/index.ts --ac AC-SPACE-009`
- **Pass 条件**：
  - `availability === 'unavailable'`，`id` / `url` 由 **card binding 的 id** 构造（不依赖 metadata）
  - `title === ''`、`listenersCount === 0`、`durationMs === null`、`host.name === ''`
  - `audioSpace` 节点整体缺失（`null` / `undefined` / `{}`）时同样得到墓碑态
  - **Space id 来源双通道**：`resolveSpaceId(card, entities)` 先取 card binding 的 id，
    无卡片时回退正文里 `x.com/i/spaces/…` 链接解析出的 id；两者都无 → `null`
    （无卡片推文过去会被整条漏掉）
  - 渲染：出现「Space 已删除或不可访问」+「在 X 查看」链接；
    **不出现**「播放录音」与时长
  - 墓碑用中性色（`bg-muted/40`），不复用 Space 品牌紫（`bg-[#9c63fa]`）

---

## AC-SPACE-010：未开启回放时不给播放入口

- **背景**：已结束但主办方未开启回放的 Space **没有录音可放**；给「播放录音」按钮
  会把人送进一个播不了的页面。
- **输入**：真实 `audio-space-ended.json` 元数据，按 AC-SPACE-001 的派生规则翻转
  `is_space_available_for_replay` / `state`
- **预期输出**：`availability` 由 `state` + 回放开关推导；行动区随之切换
- **验证方法**：`bun run verify/index.ts --ac AC-SPACE-010`
- **Pass 条件**：
  - `Ended` + 回放开 → `replayable`；`Ended`/`TimedOut` + 回放关 → `no-replay`
  - `Running` → `live`；`NotStarted` → `upcoming`（`state` 比较大小写不敏感）
  - 渲染：`replayable` →「播放录音」；`no-replay` →「录音不可回放」（**无**播放入口）；
    `live` →「直播中」；`upcoming` →「尚未开始」
  - `no-replay` 仍展示元数据（标题/人数/时长/主播）
  - **旧缓存兼容（回归）**：`availability` 是后加字段，早期落地的 `space`
    （memory / 本地文件 / DB）没有它。`resolveSpacePlaybackState()` 必须按
    `isReplayAvailable` 回退推导；字段全缺时保守取 `no-replay`，绝不抛错
    （曾实测抛 `Cannot read properties of undefined (reading 'aria')`）

---

## AC-SPACE-011：旧缓存回填 `space`

- **背景**：`space` 是后加字段。改动前落地的缓存（memory LRU / 本地文件 / DB jsonContent）没有它，
  而命中缓存时不会再走 `getEnrichedTweet` —— 于是 Space 卡片/墓碑**永远不出现**
  （实测线上表现：已删除的 Space 推文仍然只渲染一个裸链接）。缓存不保留原始 `card`，
  但 Space 链接始终在实体里，故用 `resolveSpaceId(null, entities)` 覆盖「带卡片」与「无卡片」两种推文。
- **输入**：`getLocalTweet()` 出口（mock 缓存层与上游取数，`test/unit/getLocalTweet.spec.ts`）
- **预期输出**：命中缓存且 `space` 缺失或为旧结构时回填/升级，并 best-effort 写回缓存
- **Pass 条件**：
  - 命中缓存、无 `space`、实体里有 Space 链接 → 返回带 `space` 的推文，且 `setLocalCache` 被调用
  - 已有**当前结构**的 `space`（带 `availability`）→ 原样返回，不重复请求、不重复写缓存
  - `space` 存在但缺 `availability`（早期缓存落下的旧结构）→ 顺带**升级**一次并写回缓存
  - 实体里没有 Space 链接 → 原样返回，完全不调上游
  - 上游取数失败（返回 `null`）→ 原样返回，**不伪造墓碑**、不写缓存
  - 缓存未命中 → 返回 `null`

---

## 总计：11 条 AC

| AC           | 分类           | 依赖外部 API | 依赖 AI |
| ------------ | -------------- | ------------ | ------- |
| AC-SPACE-001 | 纯函数/离线    | 否           | 否      |
| AC-SPACE-002 | 纯函数/离线    | 否           | 否      |
| AC-SPACE-003 | 纯函数/离线    | 否           | 否      |
| AC-SPACE-004 | 纯函数/离线    | 否           | 否      |
| AC-SPACE-005 | 组件/真实渲染  | 否           | 否      |
| AC-SPACE-006 | 组件/真实渲染  | 否           | 否      |
| AC-SPACE-007 | 组件/真实渲染  | 否           | 否      |
| AC-SPACE-008 | 纯函数/离线    | 否           | 否      |
| AC-SPACE-009 | 纯函数 + 渲染  | 否           | 否      |
| AC-SPACE-010 | 纯函数 + 渲染  | 否           | 否      |
| AC-SPACE-011 | 服务层（mock） | 否           | 否      |

> 全部 AC 离线可跑：上游响应已固化为 fixture（`test/fixtures/space/*.json`，取自真实
> `AudioSpaceById` / `TweetResultByRestId` 响应裁剪），无需 `TWEET_KEYS` 或服务器。
> 「真实上游连通性」不在本期 AC 范围（偶发 429，不适合当门禁）。
