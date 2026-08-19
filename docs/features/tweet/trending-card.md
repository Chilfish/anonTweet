# Trending 卡片增强 — 实施追踪

> 创建时间：2026-08-19
> 分支：`feat/trending-card`
> 关联：`docs/development-log/2026-08-18.md`（调查链）、`docs/planning/backlog.md`（阶段二待办）
> 参考：`cache/trending.html`（官方 Trending 卡片渲染结构）

## 目标

还原 X 官方 Trending 链接卡片的渲染效果，并让推文卡片数据源从 `unified_card`
binding 子集升级到 `jetfuel_attachment` 全量数据，同时为解析不稳定提供回退补偿与
开发者提示日志。

## 背景（调查结论摘要）

- 推文 `2089577916694942006` 的链接卡片为 `unified_card`，但组件布局是
  `media_with_details_horizontal`（`data.topic_detail` 下才有标题/描述）——第一阶段
  修复（`6d89187`）已让 `parseUnifiedCard` 兼容该布局，能从 binding 提取 title/description。
- 官方页面实际渲染的完整数据（日期、`Entertainment/Celebrity` 分类、3 个头像、
  `16.5k posts`、另一段描述与图片）来自响应新增的 **`jetfuel_attachment`** 字段
  （base64 编码的 X 私有「节点化字典压缩帧」）。
- 触发条件：请求 features 中 `responsive_web_jetfuel_frame: true`（**无需换 queryId**，
  实测旧 hash + 该 flag 即生效——`tmp/probe-jetfuel-A.ts` 验证）。当前
  `TweetRequests.details()` 为 `false`，导致下游拿不到 jetfuel 数据。
- payload 为私有二进制：内联 UTF-8 字符串（`<len:u8> <bytes>`）+ `0x11` 节点 +
  32bit FarmHash atom 引用（样式字典在懒加载 chunk，无公开 schema）。官方文档
  （emusks 库 `docs/src/jetfuel/wire-format.md`）明确 "not a stable schema"——
  **解析最好努力而为 + 回退**。

## 实施计划

| Phase   | 内容                                                   | 状态      |
| ------- | ------------------------------------------------------ | --------- |
| Phase 1 | 请求层：`TweetRequests.details` 启用 jetfuel frame     | ⏳ 待做   |
| Phase 2 | 解析器：`parseJetfuelPayload` 纯函数 + 类型扩展        | ⏳ 待做   |
| Phase 3 | 组件：`TweetLinkCard` 还原官方 Trending 卡片样式        | ⏳ 待做   |
| Phase 4 | 测试 + fixture + AC verifier                           | ⏳ 待做   |
| Phase 5 | 门禁 + 提交 + PR                                        | ⏳ 待做   |

## 技术设计

### Phase 1 — 请求层（最小改动）

`app/lib/rettiwt-api/requests/Tweet.ts#details()`：`responsive_web_jetfuel_frame`
`false → true`。已验证该单一 flag 即可让响应带出 `jetfuel_attachment`
（`tmp/probe-jetfuel-A.ts`）；不变更 queryId / variables / 其余 features，避免风险。

### Phase 2 — 解析器 + 类型

**新文件** `app/lib/rettiwt-api/parsers/jetfuel.ts`（纯函数，禁 React 依赖）：

- `decodeJetfuelPayload(base64: string): JetfuelFrame | null`
  - 解码字节，扫描：长度前缀 UTF-8 字符串（`<len:u8> <bytes>`，含 CJK 可读性判断）、
    `0x11` 节点 intro、`02`/`03` 引用结构；
  - 输出 `{ strings: string[], nodes, frame }`（结构信息，参考 emusks 但支持 CJK）。
- `parseTrendingCard(payload: string): TrendingCardInfo | null`
  - 从 strings 按语义序列提取：跳转 URL、主图（`pbs.twimg.com/media`）、分类词
    （`Entertainment`/`Celebrity` 等）、标题（首个 CJK 长文本）、头像组
    （`profile_images` 数组）、post 数（`16.5k posts`）、描述（末个 CJK 长文本）；
  - **任一关键字段缺失（标题+图片 或 标题+描述）→ 返回 `null`**（触发回退）。

**类型扩展** `app/types/card.ts`：

```ts
export interface TrendingCardInfo {
  source: 'jetfuel'
  url: string
  imageUrl: string
  date?: string          // 仅当 payload 内明确携带（当前样本未含，预留）
  categories: string[]
  avatars: string[]
  postsCount?: string    // 如 "16.5k posts"
  title: string
  description?: string
}
```

`LinkPreviewCard` 增加可选字段 `trending?: TrendingCardInfo`（backward compatible，
无 trending 数据时保持现有行为）。

### Phase 3 — 回退补偿 + 日志（健壮性核心）

`app/lib/react-tweet/utils/parseTweet.ts#mapTwitterCard` 签名扩展：

```
mapTwitterCard(cardData, jetfuelAttachment?)
```

合并策略（优先 jetfuel，缺失回退 unified_card + 结构警告日志）：

1. 先解析 unified_card（现有逻辑，作为基线）；
2. 若 `jetfuelAttachment` 存在：`parseTrendingCard(payload)`；
3. **成功** → 用 jetfuel 的 title/description/imageUrl/url 覆盖，附 `trending` 结构化
   字段（分类/头像/posts 数）——官方 HTML 用的就是这份数据（样本中其描述/图与
   unified_card 不同，更新的版本）；
4. **失败 / 解析为空** → 保留 unified_card 结果，并 `obsLog('jetfuel.parse.fallback',
   { reason, payloadHash, keyCount })`，提示开发者「payload 结构变更，需更新解析器」；
5. `jetfuel_attachment` 缺失（旧响应缓存）→ 静默走 unified_card（无日志，正常路径）。

### Phase 4 — 组件（还原官方样式）

`app/components/tweet/TweetCard.tsx`：

- `TweetLinkCard` 的 cardData 增加 `trending` 分支：当 `card.trending` 存在时渲染
  **Trending 卡片变体**，对照 `cache/trending.html`：
  - 外链 `<a>` 圆角边框，图片区 `aspect-[18/10]`（官方 `aspectratio18`，宽高比 18:10）；
  - 图片下层 + 渐变遮罩（`bg-gradient-to-t from-black/40` 等，保证文字可读）；
  - 覆盖内容出层（与图同 grid 叠放）：
    - **meta 行**：日期 `8月15日` + `•` + 分类 `Entertainment` / `Celebrity`（逗号/圆点分隔）；
    - **标题**：`line-clamp-3`（官方同）；
    - **作者/热度行**：3 个头像（小圆图，只显示前 3） + `• 16.5k posts`；
    - **描述**：`line-clamp-2`（官方同）。
  - 无 trending 时保持现有布局不动。
- 组件样式走 Tailwind 语义 token（postmortem #003 规范：`bg-card`/`rounded-xl` 等，
  勿加单行 CSS hack）。

### Phase 5 — 验证

- 单测（**解析器先测后写**，postmortem #001）：`test/unit/jetfuel.spec.ts`
  - 真实 payload fixture 解码 → 提取出标题/描述/分类/头像/posts 数全字段；
  - 损坏/空 payload → `null`（断言回退路径生效）；
  - `mapTwitterCard` 合并：jetfuel 覆盖 unified_card / 缺失回退 / 无附件静默。
- Fixture：`test/fixtures/jetfuel/trending.json`（真实响应裁剪，含 card + payload）。
- AC：`verify/acceptance-criteria/AC-card.md`（新增 AC-CARD-001~004）。
- 门禁：`bun run typecheck && bun run lint && bun run test && bun run verify/index.ts`。

## 验收标准（AC）

见 `verify/acceptance-criteria/AC-card.md`。

## 变更文件总览（预期）

```
新增:
  app/lib/rettiwt-api/parsers/jetfuel.ts
  test/unit/jetfuel.spec.ts
  test/fixtures/jetfuel/trending.json
  verify/acceptance-criteria/AC-card.md
  verify/modules/card.verifier.ts（如有需要）
修改:
  app/lib/rettiwt-api/requests/Tweet.ts        (jetfuel_frame: true)
  app/types/card.ts                            (TrendingCardInfo)
  app/lib/react-tweet/utils/parseTweet.ts      (mapTwitterCard 合并 jetfuel)
  app/components/tweet/TweetCard.tsx           (Trending 卡片变体)
  docs/development-log/*                       (开发日志)
  docs/planning/backlog.md                     (任务状态)
```