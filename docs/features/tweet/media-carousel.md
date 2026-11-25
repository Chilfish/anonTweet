# 推文多图媒体：>4 张改横向轮播

> 状态：✅ 已完成（2026-11-25）
> AC：[`verify/acceptance-criteria/AC-tweet.md`](../../../verify/acceptance-criteria/AC-tweet.md)（AC-TWEET-022）
> 关联：`docs/features/tweet/carousel-card.md`（广告卡轮播，共用同一 primitive）

## 1. 背景

X 单条推文最多可带 20 张图片，但旧渲染只有按数量硬编码的网格：

```tsx
length > 1 && 'grid-cols-2'
length === 3 && '[&>*:first-child]:row-span-2'
length > 4 && 'grid-rows-2'
```

`grid-rows-2` 只写了 2 行，5 张往后靠隐式行继续排；每格仍用 `padding-bottom: 56.25%`
撑高，于是 20 张 = 10 行 16:9 的大长条，比例与阅读节奏都崩掉。数据层没有 4 张上限
（`mediaDetails` 全量映射），问题纯在渲染分档。

## 2. 规则

| 数量        | 形态                                                               |
| ----------- | ------------------------------------------------------------------ |
| 1 / 2 / 3/4 | 官方经典网格（单图原比例 + `max-w-[85%]`、3 张左大右二、4 张 2×2） |
| > 4         | 横向 scroll-snap 轮播（露边），计数胶囊 `1 / 20`                   |
| 竖向模式    | `isInlineMedia` 时一切数量都走 `flex flex-col` 全宽堆叠，不轮播    |
| 引用推文    | 同样轮播，但不出箭头（卡片窄，按钮挤占画面）                       |

阈值定在 4：≤4 张是官方经典布局，改动面最小；5 张起才真的撑不动。

## 3. 实现

### 3.1 共享 primitive

`app/components/ui/media-carousel.tsx`：

- `MediaCarousel`：`flex snap-x snap-mandatory overflow-x-auto` 轨道（隐藏滚动条）、
  左右箭头（`hidden sm:flex`，到首/尾淡出）、指示器（`counter` 胶囊 / `dots` 圆点）、
  `sr-only` live region「第 N 张，共 M 张」；
- `MediaCarouselPage`：单页壳（`relative shrink-0 snap-start`），宽度与比例由调用方给；
- 翻页不用「下标 × 固定步长」：页宽可能不一致（竖向长图更窄），按每页的
  `snap-center` 静止滚动量（页面中心对准轨道中心，夹在可滚动范围内）定位与反查当前页。

`CarouselCard.tsx` 的广告卡轮播改为复用该 primitive（`indicator="dots"`、整页宽），
删掉自带的轨道与箭头实现；`tweet-media.tsx` 用它渲染 >4 张（`indicator="counter"`）。

### 3.2 比例

`app/lib/media-aspect.ts`：

- `getMediaAspectRatio(media)`：图片取 `original_info`；视频优先
  `video_info.aspect_ratio`，非法值回退 `original_info`；
- `clampAspectRatio(ratio, min, max)`：夹界 + 两位小数。

**每页按自己的原比例，高度封顶**：

- 页高上限 `min(640px, 80vh)`；页宽 = `比例 × 最大高度`（`max-width`），
  也就是竖向长图在高度到顶后**横向收窄成完整窄条**（720×2400 → 0.3 → 192px 宽），
  既不裁图也不把卡片拉成一根长柱；
- 超宽图（2400×1000 → 2.4）按基准宽度（85% / 两页）显示，高度自然变矮；
- 轨道 `items-start`：每页保持自身高度、顶部对齐（flex 默认拉伸会覆盖 `aspect-ratio`）；
- 比例只做病态数据兜底，夹在 `0.1–4`（1:50 细条、5:1 长横幅仍收住）。

因为页宽不再统一，「下一页」按子项的 `offsetLeft` 定位，不用「下标 × 固定步长」。

广告卡的 `CarouselCard` 沿用 0.6–1.0 的旧夹法与整页宽（广告素材统一 4:5，无需撑高）。

### 3.3 页面宽度

官方实测（`cache/mutil-images.html`，16 张 1536×2048）：容器 `padding-bottom: 79.84%`、
每页 `aspect-ratio: 0.75/1`、`snap-center`、`gap-1` —— 换算下来
**页宽 = min(容器宽 60%, 比例 × 高度上限)**，即中间一张 + 左右各露约 20%。

```
basis-[60%] snap-center
max-width: calc(比例 × min(640px, 80vh))
```

- 常规 4:3 / 4:5 图：页宽 60%，高度 = 宽 / 比例（≤ 上限）；
- 8 张 0.08 比例的细长图：页宽 = 0.08 × 上限 ≈ 50px，8 张一次全排开（官方同款）；
- 轨道 `gap-1`（4px）与官方一致；网格模式保持 `gap-0.5`（2px）。

### 3.4 截图

**截图不改变布局**（所有者裁决 2026-11-25）：plain 路由与 `screenshoting` 态复用同一套
渲染，不提供「截图强制平铺」开关，也不隐藏箭头/计数。导出 PNG 只包含当前视口那一页，
这是导出流程的边界，不用改布局来补偿。

### 3.5 其它

- 视频在轮播里沿用 `TweetMediaVideo`：封面 + 蓝色播放按钮 + 时长 badge，不渲染 `<video>`；
  计数胶囊固定在右上角，不与左下时长、居中播放按钮冲突。
- 全部 20 张都进 DOM（`loading="lazy"`），不做虚拟化：与 AC-PERF-001 的懒加载策略一致。
- `onMediaClick` 仍逐页透传（当前无 lightbox 调用方）。

## 4. 验证

- `test/acceptance/tweet-media-carousel.spec.ts`（7 例）：20 张轮播 / 4 张网格 /
  单图竖屏 / 视频混排 / 引用态 / 竖向模式 / 截图同构；
- `test/unit/media-aspect.spec.ts`（5 例）：比例取值、优先级、夹界与非法值；
- 回归：`test/acceptance/carousel-card-render.spec.ts`（广告卡仍走 `snap-x` + 圆点 + 平铺切换）。

## 5. 变更文件

```
新增:
  app/components/ui/media-carousel.tsx
  app/lib/media-aspect.ts
  test/acceptance/tweet-media-carousel.spec.ts
  test/unit/media-aspect.spec.ts
  docs/features/tweet/media-carousel.md（本文）
修改:
  app/lib/react-tweet/twitter-theme/tweet-media.tsx  (>4 轮播、去掉 grid-rows-2、>4 平铺 3 列)
  app/components/tweet/CarouselCard.tsx              (复用 MediaCarousel / clampAspectRatio)
  verify/acceptance-criteria/AC-tweet.md             (AC-TWEET-022)
  verify/README.md                                   (AC 索引)
```

## 6. 已知限制

- 轮播向上继承外层圆角裁剪（`overflow-hidden`），窄屏露边的下一页不会溢出卡片；
- 引用推文隐藏箭头后依赖触屏/触控板横向滑动与键盘（按钮不在 DOM 中，语义上不带方向控制）；
- 20 张截图只导出首屏一页，若要「整条导出全部图片」，需要改截图流程（加宽画布或分页拼接），
  而不是改布局。
