# 媒体链接卡（image_carousel_* / image_website / video_website）— 设计与实施

> 创建时间：2026-11-09
> 样例推文：
>
> - `2118597337345859755`（@wstcg 广告推文，5 张竖图轮播 + 可跳转链接）
> - `2118597530107904319`（同系列广告，单张竖图 `image_website`）
> - `2113690418080563539`（@Starlink 视频广告，`video_website`，4:5 封面 6s）
>   关联：`docs/features/tweet/trending-card.md`（同为 `unified_card` 的布局变体）

## 目标

让 `unified_card` 的 **`image_carousel_*`**（多图）、**`image_website`**（单图）与
**`video_website`**（视频）布局能被完整解析并按原图比例渲染：

- 保留官方卡片的多图顺序、每张图的目标链接、CTA 文案；
- 单图不再落入 `unified_card → 1.91:1` 的横向大图裁切；
- 视频卡只展示封面 + 播放按钮 + 时长 badge（与普通视频推文的静态态一致），
  播放源（mp4/hls）保留在数据里供下游下载使用；
- 多图提供两种展示形态：**官方同款横向轮播** 与 **截图友好的平铺网格**；
- 截图模式（`useScreenshoting()`）自动切平铺，保证导出 PNG 包含全部图片。

## 上游数据（实测）

`GET /tweet/get/2118597337345859755` 的 `card.binding_values.unified_card.string_value`
是一段 JSON（`card.name = unified_card`）：

```jsonc
{
  "type": "image_carousel_website",
  "component_objects": {
    "swipeable_media_1": {
      "type": "swipeable_media",
      "data": {
        "media_list": [
          { "id": "3_2118597116012765184", "destination": "browser_1" },
          { "id": "3_2118597164788232192", "destination": "browser_1" },
          { "id": "3_2118597197860364288", "destination": "browser_1" },
          { "id": "3_2118597222527090688", "destination": "browser_1" },
          { "id": "3_2118597247248269312", "destination": "browser_1" }
        ]
      }
    },
    "details_1": {
      "type": "details",
      "data": {
        "title": { "content": "\u200b" },        // 零宽空格，等同无标题
        "subtitle": { "content": "ws-tcg.com" },
        "destination": "browser_1"
      }
    }
  },
  "destination_objects": {
    "browser_1": {
      "type": "browser",
      "data": {
        "url_data": {
          "url": "https://ws-tcg.com/products/bdy_bp/?utm_source=X&utm_medium=cpc&utm_campaign=BDY",
          "vanity": "ws-tcg.com"
        }
      }
    }
  },
  "components": ["swipeable_media_1", "details_1"],
  "media_entities": {
    "3_2118597116012765184": {
      "id_str": "2118597116012765184",
      "type": "photo",
      "media_url_https": "https://pbs.twimg.com/media/HWbE2ioboAAwFUp.jpg",
      "original_info": { "width": 1440, "height": 1800, "focus_rects": [/* 5 种裁切焦点 */] },
      "sizes": { "thumb": { "w": 150, "h": 150, "resize": "crop" }, "small": { "w": 544, "h": 680 }, "medium": { "w": 960, "h": 1200 }, "large": { "w": 1440, "h": 1800 } },
      "ext": { "mediaColor": { "r": { "ok": { "palette": [{ "rgb": { "r": 255, "g": 235, "b": 157 }, "percentage": 37.55 }] } } } }
    }
    // 其余 4 张同构
  },
  "experiment_signals": { "website_cta_card_label": "learn_more" }
}
```

可获取且值得用的信息：

| 字段                                        | 用途                                                                                                  |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `type`                                      | 布局判别：`image_carousel_website`（还有 `image_carousel_app` 等变体，按前缀 `image_carousel_` 收口） |
| `components` 顺序                           | 决定媒体与详情区的上下顺序（官方此例媒体在上）                                                        |
| `media_list[]`                              | **轮播顺序** + 每张图独立的 `destination`（可能是不同链接）                                           |
| `media_entities[id]`                        | 原图 URL、宽高、`sizes`、`focus_rects`、`ext.mediaColor.palette`                                      |
| `destination_objects[dest].data.url_data`   | 跳转 URL（含 UTM）与展示域名 `vanity`                                                                 |
| `details_1.data.title/subtitle`             | 标题/域名；本例 title 是零宽空格（需视为空）                                                          |
| `experiment_signals.website_cta_card_label` | CTA 文案枚举（`learn_more` → 了解更多）                                                               |

**没有**的信息：每张图的 alt 文本（`ext_alt_text` 缺失）、媒体 alt。
（视频不是"没有"：封面、时长、mp4/hls 都在 `media_entities` 内。）

### 单图卡 `image_website`（推文 `2118597530107904319`）

同一套结构，只是媒体组件从 `swipeable_media.media_list` 变成单个 `media`：

```jsonc
{
  "type": "image_website",
  "component_objects": {
    "details_1": { "type": "details", "data": { "title": { "content": "\u200b" }, "subtitle": { "content": "ws-tcg.com" }, "destination": "browser_1" } },
    "media_1": { "type": "media", "data": { "id": "3_2118597492669648896", "destination": "browser_1" } }
  },
  "components": ["media_1", "details_1"],
  "media_entities": {
    "3_2118597492669648896": {
      "media_url_https": "https://pbs.twimg.com/media/HWbFMdybkAAqTfE.jpg",
      "original_info": { "width": 1440, "height": 1800 },   // 4:5 竖图
      "ext": { "mediaColor": { "r": { "ok": { "palette": [{ "rgb": { "red": 248, "green": 220, "blue": 232 } }] } } } }
    }
  },
  "experiment_signals": { "website_cta_card_label": "learn_more" }
}
```

旧逻辑只认 `media_list`，单图卡因此没有 `images`，组件把它当普通 `unified_card`
用 `aspect-[1.91/1]` 裁切——竖图被压成横向。现在单 `media` 组件也产出图片，
`layout` 标记为 `image_card`，渲染时按 `original_info` 的原比例展示。

### 视频卡 `video_website`（推文 `2113690418080563539`）

结构与单图卡一致，媒体实体是 `type: "video"`：

```jsonc
{
  "type": "video_website",
  "component_objects": {
    "details_1": { "type": "details", "data": { "title": { "content": "今すぐ注文" }, "subtitle": { "content": "starlink.com" }, "destination": "browser_with_docked_media_1" } },
    "media_1": { "type": "media", "data": { "id": "13_2113687393765134336", "destination": "browser_with_docked_media_1" } }
  },
  "components": ["media_1", "details_1"],
  "media_entities": {
    "13_2113687393765134336": {
      "type": "video",
      "media_url_https": "https://pbs.twimg.com/amplify_video_thumb/.../img/fT6xAMDzjMYY3OvE.jpg", // 封面
      "original_info": { "width": 1440, "height": 1800 },
      "video_info": {
        "aspect_ratio": [4, 5],
        "duration_millis": 6006,
        "variants": [
          { "bitrate": 2176000, "content_type": "video/mp4", "url": "https://video.twimg.com/.../720x900/....mp4" },
          { "content_type": "application/x-mpegURL", "url": "https://video.twimg.com/.../pl/....m3u8" }
        ]
      }
    }
  }
}
```

- `media_url_https` 只是封面；播放源在 `video_info.variants`。
- **UI 不渲染播放器**：显示封面 + 居中播放按钮 + 右下时长 badge（`0:06`）
  （与普通视频推文的静态态一致），整块点击跳转卡片链接。
- 数据层仍保留 `mp4`（最高码率）+ `hls` + `durationMs`，供下载/未来播放器使用。

补充：syndication 接口（`cdn.syndication.twimg.com/tweet-result?id=...`）还能拿到
`favorite_count` / `conversation_count` / `edit_control` 等，当前 BFF 未透出，本卡片不依赖。

## 现有链路缺口

1. `parseUnifiedCard()`（`app/lib/react-tweet/utils/parseTweet.ts`）只取
   `Object.values(media_entities)[0]` 作为 `imageUrl`。
   - 丢失 `media_list` 顺序与其余 4 张图；
   - 对象键顺序不保证等于轮播顺序，实测取到的是第 2 张 `HWbE5YVaMAAGH3d.jpg`。
2. 单图 `image_website` 的 `media_1.data.id` 未被识别，`images` 为空 → 落入
   `unified_card` 的 1.91:1 大图裁切（竖图比例错误）。
3. `title` 为 `\u200b`，直接透传会让卡片渲染出一个"有标题但不可见"的空行。
4. 缓存层（localCache / DB）只存解析后的 `EnrichedTweet`，**不保留原始 card**；
   老缓存推文拿不到 `images`，需要一次性回填。

## 数据模型

`app/types/card.ts`：

```ts
export interface CardCarouselImage {
  /** 图片 URL 或视频封面 URL（渲染时再走代理/裁切） */
  url: string
  width: number
  height: number
  /** 该张图独立的跳转链接，缺省回退卡片链接 */
  href?: string
  /** 主色（mediaColor 第一个色值，如 #FFEB9D），用作加载占位背景 */
  color?: string
  /** 媒体类型（缺省 photo） */
  type?: 'photo' | 'video'
  /** 视频附加信息：UI 只展示时长，播放源留给下游下载 */
  video?: { mp4?: string, hls?: string, durationMs?: number }
}

export interface LinkPreviewCard {
  // ...现有字段
  /** 布局判别；缓存回填据此判断是否需要重抓 */
  layout?: 'default' | 'image_card' | 'image_carousel' | 'video_card' | 'trending'
  /** 媒体列表（单图/单视频 1 项 / 多图按 media_list 顺序） */
  images?: CardCarouselImage[]
  /** 官方媒体组件是否排在详情区之前 */
  mediaFirst?: boolean
  /** CTA 文案（本地化后），如「了解更多」 */
  ctaLabel?: string
}
```

`layout` 始终由解析器写入（非媒体/trending 时为 `default`），旧缓存无此字段 →
回填逻辑只需判断 `card.type === 'unified_card' && !card.layout`。
`image_card`（单图）、`image_carousel`（多图）、`video_card`（视频）共用同一
组件，差异仅在轮播控件与视频覆盖层。

## 解析规则

`parseUnifiedCard()` 扩展（纯函数，先测后写）：

1. `type.startsWith('image_carousel')` → `layout = 'image_carousel'`；
   `type.startsWith('video_')`（如 `video_website`）→ `layout = 'video_card'`；
   `type.startsWith('image_')`（如 `image_website`）→ `layout = 'image_card'`；
   无 `type` 但 `media_list` 多图 → `layout = 'image_card'`；
2. 按 `components` 顺序遍历媒体组件：
   - 多图：`swipeable_media.data.media_list` 按顺序取 id；
   - 单图：`media_1.data.{id|media_id|media}`；
     去 `media_entities[id]` 拿图。**允许 id 缺失**：跳过该张并继续。
     同时支持 `media_list` 项直接内联图片对象（部分变体）；
3. `title` / `subtitle` 先去掉 `\u200b`/`\ufeff`/空白，空串视为 `undefined`；
4. `href`：`media_list[i].destination` / `media_1.data.destination` →
   `destination_objects` → `url_data.url`，缺省回退卡片主链接；
5. `imageUrl` 固定取 `images[0].url`（与首图/视频封面一致），不再取对象首个键；
6. `ctaLabel`：`learn_more` → `了解更多`，未知值保留原文（空则不渲染 CTA）；
7. 视频实体（`type: video/animated_gif`）：`type = 'video'`，
   `video = { mp4（最高码率）, hls, durationMs }`；UI 只用 `durationMs`；
8. 单图/视频卡片（`layout === 'image_card' | 'video_card'`）与多图共用组件，
   只是不出现箭头/圆点/切换按钮，媒体区按 `original_info` 原比例展示
   （1440×1800 → 4:5）。

## 缓存回填

`app/lib/service/getTweet.server.ts#getLocalTweet` 增加 `backfillCardCarousel()`：

- 条件：`tweet.card?.type === 'unified_card' && !tweet.card.layout`；
- 行为：`getEnrichedTweet(id)` 重抓一次，仅合并 `card` 字段；best-effort 写回
  localCache + DB；失败保持原样（与 Space / Article 回填同模式）；
- 非 unified_card 或已带 `layout` 的缓存不触发，不会反复打上游。
  （单图 `image_website` / 视频 `video_website` 的旧缓存同样靠这条路径升级。）

## 组件设计（1:1 + 适配）

新组件 `app/components/tweet/CarouselCard.tsx`，由 `TweetLinkCard` 在
`(card.layout === 'image_card' | 'image_carousel' | 'video_card') && card.images?.length`
时渲染。

### 结构

```
<TweetLinkCard>                       // 外框：rounded-md / border / overflow-hidden
  ├─ 媒体区（比例取图 original_info，clamp 0.6–1.0）
  │   ├─ 多图：横向 scroll-snap 轨道（每页 100% 宽，overflow-x-auto，隐藏滚动条）
  │   │   └─ 每页 <a href={img.href ?? card.url}> + MediaImage(object-cover)
  │   ├─ 单图：单个 <a> + MediaImage，按原比例展示（不裁成 1.91:1）
  │   ├─ 视频：封面 + 居中播放按钮 + 右下时长 badge（不渲染 <video>，整块仍是链接）
  │   ├─ 左右箭头（仅 hover/键盘聚焦显示；触屏隐藏）—— 仅多图
  │   ├─ 计数圆点（底部居中，可读性用半透明底）—— 仅多图
  │   └─ 媒体主色做 MediaImage 占位背景（mediaColor）
  └─ 底部信息条（details）
      ├─ 标题 / 描述（有则显示，line-clamp）
      ├─ 左：域名（vanity，text-muted-foreground）
      ├─ 右：CTA 胶囊（learn_more → 了解更多）
      └─ 右：布局切换按钮（仅多图、非截图态）
```

- 整卡「可跳转」：媒体页与底部信息条各自是 `<a>`；箭头是 `<button>`，与链接平级，
  避免 `<a>` 内嵌交互元素。视频覆盖层 `pointer-events-none`，点击穿透到链接。
- 轮播实现不引第三方库：原生 `scroll-snap-type: x mandatory` + `scrollTo/scrollBy`；
  当前页由 `scroll` 事件按 `scrollLeft / clientWidth` 计算。
- 箭头命中区域 ≥ 44×44（Apple HIG），键盘可达（`aria-label="上一张/下一张"`）；
  触屏以滑动为主，箭头 `hidden sm:flex`。
- 圆点数量 = 媒体数。
- 图片 `loading="lazy"`（与 AC-PERF-001 一致）、`decoding="async"`、
  `referrerPolicy="no-referrer"`，复用 `MediaImage` 三态（加载/失败占位）。
- 视频时长 badge：`6006ms → 0:06`，超过 1 小时 → `1:02:03`。

### 两种形态

| 形态               | 触发                                           | 表现                                                   |
| ------------------ | ---------------------------------------------- | ------------------------------------------------------ |
| 轮播（默认，多图） | 常态                                           | 官方同款：单页按首图比例、横向滑动、箭头/圆点          |
| 平铺               | 点击信息条右侧布局切换按钮；**或截图模式强制** | CSS grid（2 列；≥4 张 3 列），全部图片一次展示，无箭头 |
| 单图 / 视频        | `layout === 'image_card' \| 'video_card'`      | 单页原比例，无箭头/圆点/切换按钮                       |

- 切换按钮：`LayoutGrid` / `GalleryHorizontalEnd` 图标，`aria-pressed`，状态仅存组件
  `useState`，不引入全局设置。
- 截图模式（`useScreenshoting()` 为 true）→ 强制平铺并隐藏切换按钮，保证导出完整；
  `SelectableTweetWrapper` 的单推文截图同样生效。视频卡没有播放器，截图直接得到
  封面 + 播放按钮 + 时长。

### 边界

- `images` 为空 / 全部媒体实体缺失 → 不渲染媒体卡，回退现有普通卡；
- 多图比例不一致：轮播按首图比例 + `object-cover`，平铺按各自比例，避免跳变；
- 标题/描述为空时信息条只留域名 + CTA，不产生空白行；
- 超长域名 `truncate`，CTA 固定不换行；
- 暗色模式使用语义 token（`bg-card` / `border-border` / `text-muted-foreground`），
  不出现硬编码白色底。

## 批量下载

`app/components/translation/DownloadMedia.tsx#extractDownloadItemsFromTweets`：

- 卡片媒体优先取 `card.images`（全部图片 / 视频），不再只取 `card.imageUrl`；
- 图片按下载设置追加 `?format=jpg&name=large` 或 `?name=orig`；
- 视频卡下载代理后的最高码率 mp4（`https://proxy.chilfish.top/<mp4>`），
  无 mp4 时回退封面图；
- 按 URL 去重，文件名沿用 `username-id-date(-n).ext`，保证多图不覆盖。

## 验收标准

- 解析（多图）：给定样例 payload，`images` 长度 5、顺序与 `media_list` 一致、
  `imageUrl === images[0].url`、`ctaLabel === '了解更多'`、`layout === 'image_carousel'`；
- 解析（单图）：`image_website` → `layout === 'image_card'`、`images` 长度 1、
  1440×1800、主色 `#f8dce8`；
- 解析（视频）：`video_website` → `layout === 'video_card'`、`images[0].type === 'video'`、
  `video.mp4` 为最高码率、`video.hls` 与 `durationMs` 保留；
- 回退：媒体 id 在 `media_entities` 缺失时跳过不抛错；
- 渲染：5 图渲染 5 个轮播页；截图模式渲染平铺网格；单图按 0.8 比例且无箭头；
  视频卡渲染封面 + 播放按钮 + `0:06` 时长，且不出现 `<video>`；
- 截图等待：平铺重渲染后收集新 DOM、等图片 load/decode、等 `data-status=success`、
  等 300ms opacity 淡入结束（避免导出骨架/半透明图）；
- 缓存：旧 unified_card 缓存首次访问会回填 `card.layout`，第二次不再重抓；
- 下载：3 图轮播提取 3 个下载项；视频卡取代理 mp4；无 mp4 回退封面；
  `includeCardImages = false` 跳过；
- 门禁：`bun run typecheck && bunx eslint . && bun run test && bun run build`。

## 变更文件（预期）

```
新增:
  app/components/tweet/CarouselCard.tsx
  test/unit/carousel-card.spec.ts
  test/unit/download-media.spec.ts
  test/acceptance/carousel-card-render.spec.ts
  test/fixtures/unified-card/carousel.json（多图真实 payload）
  test/fixtures/unified-card/single-image.json（单图真实 payload）
  test/fixtures/unified-card/video.json（视频真实 payload）
修改:
  app/types/card.ts                       (CardCarouselImage / layout / images / ctaLabel / video)
  app/lib/react-tweet/utils/parseTweet.ts (parseUnifiedCard 媒体卡解析)
  app/lib/service/getTweet.server.ts     (backfillCardCarousel)
  app/lib/utils.ts                       (waitForRenderReady 截图时序 / 淡入等待)
  app/components/tweet/TweetCard.tsx     (分发到 CarouselCard)
  app/components/translation/DownloadMedia.tsx (批量下载卡片全部媒体)
  app/stories/tweet.fixtures.ts          (媒体卡 story 数据)
  app/stories/TweetCard.stories.tsx      (CarouselCard / SingleImageCard / VideoCard story)
  verify/acceptance-criteria/AC-card.md  (AC-CARD-010/011/012)
  verify/README.md                       (AC 索引)
  lefthook.yml                           (pre-commit lint 纳入 md)
  docs/features/tweet/carousel-card.md   (本文)
```

## 实施状态（2026-11-09）

| 项                                                                                        | 状态 | 验证                                                   |
| ----------------------------------------------------------------------------------------- | ---- | ------------------------------------------------------ |
| 类型：`CardCarouselImage`（photo/video）/ `layout` / `images` / `mediaFirst` / `ctaLabel` | ✅   | `bun run typecheck`                                    |
| 解析：多图 `media_list` 顺序、单图 `media_1`、视频变体、零宽标题清洗、CTA、主色           | ✅   | `test/unit/carousel-card.spec.ts`（8 例）              |
| 组件：轮播 / 平铺 / 单图原比例 / 视频封面+播放+时长                                       | ✅   | `test/acceptance/carousel-card-render.spec.ts`（6 例） |
| 截图等待：DOM 时序、decode、data-status、opacity 淡入                                     | ✅   | `app/lib/utils.ts`（需浏览器手测导出效果）             |
| 缓存回填：旧 `unified_card` 缓存一次性补 `layout/images`                                  | ✅   | 逻辑同 Space/Article 回填；无独立单测                  |
| 批量下载：`card.images` 全部图片 / 代理 mp4 / 封面回退                                    | ✅   | `test/unit/download-media.spec.ts`（4 例）             |
| CI 门禁：`bunx eslint .` 0 error                                                          | ✅   | 文档表格 prettier + `prefer-static-regex` 已修         |
| Storybook：`Tweet/Card → CarouselCard / SingleImageCard / VideoCard`                      | ✅   | `bun run storybook` 手工查看                           |
| 全量单测 + 验收                                                                           | ✅   | 见提交流水（typecheck + test + verify card）           |

已知限制：

- 视频卡不内嵌播放（产品决定）：只展示封面 + 播放按钮 + 时长；`mp4/hls`
  已保留在 `card.images[].video`，下游下载可直接使用。
- 截图层面的「平铺」只保证当前 5 图样本；超过 9 图时网格行数会变多，
  属预期行为。
