# Tweet 卡片（Trending / Jetfuel）验收标准

> 版本：1.1 | 日期：2026-08-19
> 对应 Postmortem：001 (Tweet Parsing)
> 关联方案：`docs/features/tweet/trending-card.md`
> 执行命令：`bun run verify/index.ts --module card`
> 2026-08-19 修订（review P1-1）：AC-CARD-005 v1.0 声称「Storybook / 快照驱动」，
> 实为源码字符串扫描——验证方法名实不符。v1.1 改为 `renderToString` 真实渲染断言
> （`card-render.spec.ts`），源码级检查降级为辅助 AC-CARD-009。

---

## AC-CARD-001：请求层启用 jetfuel frame

- **输入**：`TweetRequests.details()` 生成的 AxiosRequestConfig
- **预期输出**：`features.responsive_web_jetfuel_frame === true`
- **验证方法**：源码扫描 / 单测断言请求配置
- **Pass 条件**：
  - `responsive_web_jetfuel_frame` 为 `true`
  - 请求 queryId / variables 保持原样（最小改动原则）

---

## AC-CARD-002：jetfuel payload 解码（真实 fixture）

- **输入**：`test/fixtures/jetfuel/trending.json`（真实推文 `2089577916694942006`
  响应裁剪，含 `jetfuel_attachment.payload` base64）
- **预期输出**：`decodeJetfuelPayload()` 返回结构化帧对象
- **验证方法**：`bun run verify/index.ts --ac AC-CARD-002`
- **Pass 条件**：
  - 返回对象含 `strings` 数组
  - `strings` 中包含 `trending-card`、`Entertainment`、`Celebrity`、`16.5k posts`
  - `strings` 中包含标题「仲町あられの誕生日をファンと盛大に祝う」（证明 CJK 未被截断）
  - `strings` 中包含描述（「笑顔いっぱいのあられちゃんイラストや…」开头片段）
  - `strings` 中包含至少 2 个 `profile_images` URL 与主图 media URL

---

## AC-CARD-003：trending 卡片字段提取

- **输入**：AC-CARD-002 的 payload
- **预期输出**：`parseTrendingCard(payload)` 返回结构化信息
- **验证方法**：`bun run verify/index.ts --ac AC-CARD-003`
- **Pass 条件**：
  - `source === 'jetfuel'`
  - `url` 指向 `x.com/i/trending/2088645888549994981`
  - `imageUrl` 含 `pbs.twimg.com/media/`
  - `categories` 包含 `Entertainment` 与 `Celebrity`
  - `avatars` 长度 ≥ 2（真实样本 3 个）
  - `postsCount` 匹配 `16.5k posts`
  - `title` 为「仲町あられの誕生日をファンと盛大に祝う」
  - `description` 非空且长度 ≥ 50

---

## AC-CARD-004：解析失败回退 + 开发者提示日志

- **输入**：损坏 payload（截断 / 空字符串 / 乱码 base64）与缺失 jetfuel 附件
- **预期输出**：`mapTwitterCard` 不抛错，回退到 unified_card 基线结果
- **验证方法**：`bun run verify/index.ts --ac AC-CARD-004`
- **Pass 条件**：
  - 损坏 payload → 返回 unified_card 字段（title/description 来自 binding）
  - 该路径触发 `obsLog('jetfuel.parse.fallback', ...)`，日志含 `reason` 与提示
    开发者更新解析器的字段（如 `fallback` 标记）
  - 无 `jetfuel_attachment` → 静默返回 unified_card 结果，不产生 fallback 日志
    （正常路径无噪音）
  - 任一关键字段（标题/图片）缺失 → 同样回退

---

## AC-CARD-005：Trending 卡片组件真实渲染（视觉回归）

- **输入**：`card.trending` 非空的 EnrichedTweet（由真实 jetfuel fixture 解析值构造）
- **预期输出**：`TweetLinkCard` 渲染官方 Trending 卡片变体
- **验证方法**：`renderToString(createElement(TweetLinkCard, ...))` + HTML 断言
  （`test/acceptance/card-render.spec.ts`）
- **Pass 条件**：
  - 渲染 `<a href=趋势 URL>` 外层 + 大图区（`aspect-[18/10]`）与底部渐变遮罩
  - 渲染 meta 行（分类文本）、标题（`line-clamp-3`）、头像组（≥3 图）、
    posts 计数（`16.5k posts`）、描述（`line-clamp-2`）
  - 主图与头像 `alt=""`（装饰图；标题 h3 承载可访问名称，避免读屏重复朗读）
  - 无 JS 截断残留（截断只靠 CSS clamp）

---

## AC-CARD-006：无 trending 数据回退普通链接卡

- **输入**：普通 `summary` 卡（无 `trending` 字段）
- **预期输出**：渲染普通链接卡布局（不渲染 `aspect-[18/10]` 变体）
- **验证方法**：`renderToString` + HTML 断言（`card-render.spec.ts`）
- **Pass 条件**：
  - 不包含 `aspect-[18/10]`
  - 包含小图缩略布局（`w-20 h-20`）、标题文本、原始 `card.url` 跳转

---

## AC-CARD-007：trending 主图缺失不塌陷

- **输入**：`trending` 存在但 `imageUrl` 缺失/空
- **预期输出**：布局不塌陷——`aspect-[18/10]` 容器、标题、跳转仍在
  （图片走 MediaImage 错误占位，不再整块 `return null`，P2-2）
- **验证方法**：`renderToString` + HTML 断言（`card-render.spec.ts`）
- **Pass 条件**：标题文本、趋势 URL href、`aspect-[18/10]` 均存在，无异常

---

## AC-CARD-008：无卡片数据空渲染

- **输入**：`card` 为 `undefined` 的 EnrichedTweet
- **预期输出**：`TweetLinkCard` 返回空串（不渲染、不报错）
- **验证方法**：`renderToString` 断言（`card-render.spec.ts`）

---

## AC-CARD-009：源码层变体锁定（辅助检查）

- **输入**：`TweetCard.tsx` 与 `TrendingCard.tsx` 源码
- **预期输出**：变体分支与官方结构关键类名存在
- **验证方法**：源码字符串扫描（`ac-card.spec.ts`；渲染断言以 AC-CARD-005~008 为准）

---

## 总计：9 条 AC

| AC          | 分类          | 依赖外部 API | 依赖 AI |
| ----------- | ------------- | ------------ | ------- |
| AC-CARD-001 | 纯函数/离线   | 否           | 否      |
| AC-CARD-002 | 纯函数/离线   | 否           | 否      |
| AC-CARD-003 | 纯函数/离线   | 否           | 否      |
| AC-CARD-004 | 纯函数/离线   | 否           | 否      |
| AC-CARD-005 | 组件/真实渲染 | 否           | 否      |
| AC-CARD-006 | 组件/真实渲染 | 否           | 否      |
| AC-CARD-007 | 组件/真实渲染 | 否           | 否      |
| AC-CARD-008 | 组件/真实渲染 | 否           | 否      |
| AC-CARD-009 | 源码扫描      | 否           | 否      |

> 离线 AC 依赖 fixture（`test/fixtures/jetfuel/trending.json`），验证时无需服务器。
> AC-CARD-005~008 由真实渲染测试驱动（`card-render.spec.ts`），无外部依赖。
