# 投票推文（Poll）— 设计与实施

> 创建时间：2026-11-11
> 关联：`docs/features/tweet/carousel-card.md`（同为 card 承载的媒体/结构变体）
> 验收：`verify/acceptance-criteria/AC-card.md` AC-CARD-013/014

## 目标

让 X 投票推文完整呈现：

- 纯文字投票：2–4 个选项、票数、百分比、最终/进行中状态；
- 带图投票：选项图片（2×2 网格）+ 标签 + 百分比；
- 解析独立于链接卡（`card`），不破坏现有 `mediaDetails` / `article` / `space` 链路；
- 只读展示结果快照，不实现投票动作。

## 上游数据（实测）

投票**不是**独立对象，X 一直用 `card` 承载，信息全部在 `card.binding_values`。

| 形态              | `card.name` 样例                                                                 | 选项字段                                          |
| ----------------- | -------------------------------------------------------------------------------- | ------------------------------------------------- |
| 纯文字 2/3/4 选项 | `poll2choice_text_only` / `poll3...` / `poll4...`                                | `choiceN_label`、`choiceN_count`                  |
| 带图 2/3/4 选项   | `poll4choice_image`；syndication 实测为 `1906814671912599552:poll_choice_images` | 额外 `choiceN_image` 系列 + `choiceN_image_color` |

公共字段：

```jsonc
{
  "choice1_label": { "string_value": "Yes", "type": "STRING" },
  "choice1_count": { "string_value": "10063044", "type": "STRING" },
  "counts_are_final": { "boolean_value": true, "type": "BOOLEAN" },  // 注意是 BOOLEAN
  "end_datetime_utc": { "string_value": "12/19/2022 11:20:32", "type": "STRING" },
  "last_updated_datetime_utc": { "string_value": "...", "type": "STRING" },
  "duration_minutes": { "string_value": "720", "type": "STRING" },
  "choice_count": { "string_value": "4", "type": "STRING" },         // 部分卡有
  "card_url": { "string_value": "https://twitter.com", "type": "STRING" }
}
```

带图选项的图片档位：`choiceN_image`（280）、`_small`、`_large`（420）、`_x_large`、`_original`；
主色在 `choiceN_image_color.image_color_value.palette[0].rgb`。

实测样本：

- 纯文字：`x.com/elonmusk/status/1604617643973124097`（Yes/No，最终结果）
- 带图 4 选项：`x.com/Vaaalrrr___/status/2119549657009578137`

公开上游可直接复核：

```bash
curl "https://cdn.syndication.twimg.com/tweet-result?id=1604617643973124097&lang=en&token=a"
curl "https://cdn.syndication.twimg.com/tweet-result?id=2119549657009578137&lang=en&token=a"
```

> 线上部署实例的 `/api/tweet/search` 在 2026-11-11 因上游 X SearchTimeline 404 不可用，
> 本地调试用自部署实例 + `TWEET_KEYS`；`card_name:poll2choice_text_only` 等高级语法可搜投票。

## 数据模型

`app/types/poll.ts`，挂在 `EnrichedTweet.poll`：

```ts
export interface PollChoice {
  label: string
  count: number
  percentage: number      // 解析时算好整数百分比
  imageUrl?: string       // 原图优先
  imageWidth?: number
  imageHeight?: number
  color?: string          // #rrggbb，加载占位色
}

export interface TweetPoll {
  choices: PollChoice[]
  totalVotes: number
  countsAreFinal: boolean
  endDatetime?: string    // ISO
  durationMinutes?: number
  hasImages: boolean
}
```

不塞进 `LinkPreviewCard`：投票与链接卡语义不同，`TweetLinkCard` 的「无 title/description/image 即不渲染」规则会误杀 poll。

## 解析规则

`app/lib/react-tweet/utils/poll.ts#mapPollCard()`（纯函数）：

1. 归一化 `cardData.legacy || cardData`，`binding_values` 同时兼容 GraphQL 数组与 syndication 对象；
2. 判定以 `choice1_label` 为锚点，**不依赖 card.name**（两种上游命名不同）；
3. 选项上限：`choice_count`（2–4）优先，否则遍历 1–4；空槽位跳过；
4. 票数去千分位后 `parseInt`，缺失按 0；`totalVotes` 为各项之和；
5. 百分比 `Math.round(count / total * 100)`，0 票时为 0；
6. 图片优先级 `_image_original` > `_x_large` > `_large` > `_image`，记录宽高与主色；
7. `counts_are_final` 兼容 BOOLEAN 与字符串 `'true'`；
8. 结束时间归一化：ISO 直接转；`MM/DD/YYYY HH:mm:ss` 按 UTC 解析；
9. 有效选项少于 2 个返回 `undefined`（普通卡片不受影响）。

`enrichTweet()` 同时设置 `card` 与 `poll`；poll 卡在 `mapTwitterCard()` 里依旧会被三无校验丢弃，这是预期行为。

## 组件

`app/components/tweet/PollCard.tsx#PollCardView`，只读、SSR 安全：

- 纯文字：`<ul>` + 相对定位行，底层进度填充（`bg-primary/10`），标签 + 百分比；
  唯一最高票加粗；
- 带图：2 列 grid，方形图片（`MediaImage` + 主色占位）→ 标签 + 百分比 + 细进度条；
- 页脚：总票数（`toLocaleString('en-US')`）+ 状态；
- 状态：`countsAreFinal → 最终结果`；否则有结束时间 → `MM月dd日 HH:mm 截止`
  （固定 Asia/Shanghai，避免 SSR/客户端时区不一致）；否则 `投票中`；
- 图片走 `useProxyMedia()` + `normalizeMediaUrl()`（`/card_img/` 保留 query 形态）。

渲染位置：`TweetNode` 与 `PlainTweet` 都在正文之后、媒体/链接卡之前插入。

## 缓存与限制

- **旧缓存不补**：解析旧版缓存时 poll card 已丢弃，没有任何可识别信号；不做全量重抓
  （避免 429）。旧投票推文等本地缓存 1h 过期或 DB 重新抓取后自然恢复。
- 票数是抓取时快照，不实时刷新；`counts_are_final` 为 false 时显示「投票中/截止时间」，
  即使实际已结束也可能滞后到下次抓取。
- 不提供投票动作（匿名只读）。
- 百分比取整后合计可能为 101%，与 X 官方表现一致，不做最大余数修正。

## 附带改动

- 批量下载：`includeCardImages` 开启时追加投票选项图（去重）；
- 分享预览：无普通媒体时 `og:image` / 结构化数据回退到第一张选项图；
- `llms.ts` EnrichedTweet schema 增加 `poll` 字段。

## 验收

- `test/unit/poll-card.spec.ts`（AC-CARD-013）：文字/带图解析、BOOLEAN 兼容、两种时间格式、
  `legacy` 包装、缺 `choice_count`、非法输入；
- `test/acceptance/poll-card-render.spec.ts`（AC-CARD-014）：文字进度条、图片网格、
  最终/进行中状态、0 票与长标签；
- `test/unit/download-media.spec.ts`：投票选项图进入下载列表；
- 门禁：`bun run typecheck && bunx eslint . && bun run test && bun run build`。
