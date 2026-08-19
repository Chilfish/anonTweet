# Tweet 卡片（Trending / Jetfuel）验收标准

> 版本：1.0 | 日期：2026-08-19
> 对应 Postmortem：001 (Tweet Parsing)
> 关联方案：`docs/features/tweet/trending-card.md`
> 执行命令：`bun run verify/index.ts --module card`

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

## AC-CARD-005：Trending 卡片组件渲染（视觉回归）

- **输入**：含 `trending` 字段的 EnrichedTweet（Snapshot/blocks 驱动）
- **预期输出**：`TweetLinkCard` 渲染官方 Trending 卡片变体
- **验证方法**：Storybook / 单测快照断言结构类名与内容
- **Pass 条件**：
  - 渲染 `<a>` 外层 + 图片区（`aspect-[18/10]` 或等价比例类）
  - 渲染 meta 行（分类文本）、标题（`line-clamp-3`）、头像组、posts 计数、
    描述（`line-clamp-2`）
  - 无 `trending` 字段时渲染现有布局（无回归）

---

## 总计：5 条 AC

| AC           | 分类         | 依赖外部 API | 依赖 AI |
| ------------ | ------------ | ------------ | ------- |
| AC-CARD-001  | 纯函数/离线  | 否           | 否      |
| AC-CARD-002  | 纯函数/离线  | 否           | 否      |
| AC-CARD-003  | 纯函数/离线  | 否           | 否      |
| AC-CARD-004  | 纯函数/离线  | 否           | 否      |
| AC-CARD-005  | 组件/Snapshot | 否           | 否      |

> 离线 AC 依赖 fixture（`test/fixtures/jetfuel/trending.json`），验证时无需服务器。
> AC-CARD-005 由 Storybook 或组件快照测试驱动，无外部依赖。