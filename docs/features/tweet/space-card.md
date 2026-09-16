# X Space 卡片（语音直播 / 录音回放）

> 状态：✅ 已完成（2026-09-16）
> AC：[`verify/acceptance-criteria/AC-space.md`](../../../verify/acceptance-criteria/AC-space.md)（AC-SPACE-001~008）
> 关联 Postmortem：001（Tweet Parsing）、002（纯逻辑耦合 React）

## 1. 问题

Space 推文的文本通常只有一条 `t.co` 短链，视觉信息全在卡片上。但这类推文的
`card` 是**空壳**：

```jsonc
{
  "legacy": {
    "name": "3691233323:audiospace",
    "binding_values": [
      { "key": "tweet_id", "value": { "string_value": "1968314084207788302" } },
      { "key": "narrow_cast_space_type", "value": { "string_value": "0" } },
      { "key": "id", "value": { "string_value": "1yoKMPnjEbOxQ" } },   // ← 唯一的有效信息
      { "key": "card_url", "value": { "string_value": "https://t.co/gOS5Qc3DS4" } }
    ]
  }
}
```

没有 `title` / `description` / 任何图片 binding，于是 `mapTwitterCard()` 的最终校验
（「至少有标题或描述或图片」）把它整个丢弃 —— **改动前 `/api/tweet/get` 对这条推文
返回的 `card` 是 `undefined`**，页面只剩一个裸链接。

## 2. 数据链

卡片所需字段全部在另一个 GraphQL 端点里，必须额外打一次上游：

```
TweetResultByRestId（推文本身）
   └─ card.name = '…:audiospace'  →  binding id = Space id
                                        │
                                        ▼
AudioSpaceById（x.com/i/api/graphql/HPEisOmj1epUNLCWTYhUWw/AudioSpaceById）
   └─ data.audioSpace.metadata
         title / state / started_at / ended_at / is_space_available_for_replay
         total_live_listeners + total_replay_watched / creator_results.result.legacy
```

字段口径与官方卡片实测值一一对应（样本 Space `1yoKMPnjEbOxQ`）：

| 官方卡片文案                            | 来源                                                      |
| --------------------------------------- | --------------------------------------------------------- |
| `#ゆめみた合宿3日目！ついに最終日！✨…` | `metadata.title`（CJK + emoji 原样）                      |
| `2,478 人がリスニング/リプレイ`         | `total_live_listeners(1245) + total_replay_watched(1233)` |
| `9月17日`                               | `metadata.created_at`（Asia/Shanghai 口径）               |
| `42:40`                                 | `ended_at - started_at = 2560946ms`                       |
| 主播行（头像 + 名称 + 认证徽标）        | `creator_results.result.legacy`                           |

`creator_results` 是**精简用户对象**：不含 `is_blue_verified` / `verified_type`
（实测两者均缺省）。主播就是推文作者时，用推文侧更完整的 `TweetUser` 补齐认证信息，
否则官方卡片上的认证徽标会丢。

## 3. 范围裁定（owner 2026-09-16）

**只做卡片 + 跳转 X 播放，不做站内播放。** 原因（实测）：

- 录音是 HLS：`live_video_stream/status/{media_key}` → `…/audio-space/playlist_*.m3u8?type=replay`
- 该 m3u8 响应头为 `Access-Control-Allow-Origin: https://x.com` —— 浏览器跨源取流被拦
- 因此站内播放 = 服务端媒体代理（m3u8 + 分片重写）+ `hls.js` 依赖（Chrome/Firefox 不原生支持 HLS）
  - 相应带宽与滥用面，成本远超卡片本身

故整卡是一个指向 `https://x.com/i/spaces/{id}` 的链接；「播放录音」是视觉元素而非嵌套交互元素
（避免 `<a>` 套 `<button>`）。

## 4. 边界态（可播放状态机）

`availability` 由 `state` + `is_space_available_for_replay` 推导，卡片行动区随之切换：

| `availability` | 条件                                     | 卡片表现                                               |
| -------------- | ---------------------------------------- | ------------------------------------------------------ |
| `replayable`   | 已结束 + 回放已开启                      | 紫色卡片 + 「播放录音」（唯一给播放入口的分支）        |
| `live`         | `state === 'Running'`                    | 紫色卡片 + 「直播中」                                  |
| `upcoming`     | `state === 'NotStarted'`                 | 紫色卡片 + 「尚未开始」                                |
| `no-replay`    | 已结束但主办方**未开启回放**             | 紫色卡片 + 「录音不可回放」（**不给**播放入口）        |
| `unavailable`  | 上游**没有 metadata**（已删除/不可访问） | **中性墓碑条**「Space 已删除或不可访问」+「在 X 查看」 |

两个关键取舍：

1. **`no-replay` 不给播放入口**：没有录音却摆「播放录音」，等于把人送进一个播不了的页面。
   但元数据（标题/人数/时长/主播）照常展示，场次信息本身仍有价值。
2. **`unavailable` 不用品牌紫大喊大叫**：墓碑是「这里曾经有个 Space」，用 `bg-muted/40` 中性提示条，
   并保留一个可核实的「在 X 查看」入口（地址由 card binding 的 id 构造，不依赖 metadata）。

**上游要区分「没有」与「取不到」**：已删除 / 不可访问的 Space，`AudioSpaceById` 实测返回
`{ data: { audioSpace: { is_subscribed: false } } }`（节点在、metadata 无）；而请求本身失败
（429 / 网络）是抛错。二者必须分开——**只有前者**渲染墓碑，后者不挂 `space`（否则会把限流误报成
「已删除」），仅记 `obsLog('space.fetch.failed')`。

**Space id 双通道识别**：多数推文带 `…:audiospace` 卡片（id 在 `binding_values`），但实测存在
**完全没有 card** 的 Space 推文（推文 `1871586443388420240`，正文里只有一条
`x.com/i/spaces/1djGXroNWDExZ` 链接）。故 `resolveSpaceId(card, entities)` 先取 card binding 的 id，
无卡片时回退正文 url 实体解析——否则这类推文会被整条漏掉。

**旧缓存回填（读时自愈）**：`space` / `availability` 都是后加字段，而**命中缓存时不会再走
`getEnrichedTweet`** —— 旧缓存里的推文永远不会长出卡片（实测：已删除的 Space 推文在缓存命中时
仍只渲染裸链接，日志 `cache.get … hit:true`）。故在唯一读出口 `getLocalTweet()` 做一次回填：
缓存不保留原始 `card`，但 Space 链接始终在实体里，`resolveSpaceId(null, entities)` 即可覆盖
「带卡片」与「无卡片」两种推文；结果 best-effort 写回两层缓存，避免每次浏览重打上游。
取数失败（429 / 网络）保持原样返回，**不伪造墓碑**。

**渲染层兜底**：即便走到渲染层时 `availability` 仍缺失，`resolveSpacePlaybackState()` 也会按
早期就存在的 `isReplayAvailable` 回退推导，全缺时保守取 `no-replay`——否则直接查表会拿到
`undefined` 并在渲染时崩（实测 `Cannot read properties of undefined (reading 'aria')`，
见开发日志 2026-09-16）。

## 5. 实现落点

| 层       | 文件                                                     | 说明                                                                                                                             |
| -------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 请求     | `app/lib/rettiwt-api/requests/Space.ts`                  | `SpaceRequests.details(id)`（`withReplays: true`）                                                                               |
| 资源注册 | `enums/Resource.ts` · `collections/{Requests,Groups}.ts` | `SPACE_DETAILS`（漏注册会被 `_validateArgs` 静默判废）                                                                           |
| 类型     | `app/types/space.ts`                                     | `SpaceDetails` / `SpaceHost` / `SpaceAvailability`                                                                               |
| 纯逻辑   | `app/lib/react-tweet/utils/space.ts`                     | `resolveSpaceId` / `extractAudiospaceId` / `extractSpaceIdFromUrl` / `mapSpaceDetails` / `resolveSpacePlaybackState` / formatter |
| 取数     | `app/lib/react-tweet/utils/get-tweet.ts`                 | `fetchSpaceDetails()` / `resolveSpaceById()` + `attachSpaceDetails()`（请求失败降级并 obsLog）                                   |
| 回填     | `app/lib/service/getTweet.server.ts`                     | `getLocalTweet()` 出口对旧缓存回填/升级 `space`（读时自愈，见 §4）                                                               |
| 渲染     | `app/components/tweet/TweetSpaceCard.tsx`                | 紫底白字卡片 + 中性墓碑条；挂载于 `TweetNode` / `PlainTweet`                                                                     |
| 去重     | `app/lib/react-tweet/twitter-theme/tweet-body.tsx`       | `space` 非空时跳过正文里的同一条 Space 链接（官方前端同样只显示卡片）                                                            |

设计取舍：

- **不改 `parseTweet.ts`**：它是 Postmortem #001 的头号高危文件（10 次 fix）。Space 识别发生在
  `enrichTweet` 之外的异步层（读原始 `card`），保持解析器零改动。
- **纯逻辑全部下沉**（#002）：`mapSpaceDetails` / `resolveSpaceId` / `resolveSpacePlaybackState` /
  formatter 都是无 IO 纯函数，由 `test/unit/space.spec.ts` 直接单测，组件只做渲染。
- **失败降级**：取 Space 详情失败时不挂 `space`，正文里的链接照常渲染 —— 多打一次上游不该让整条推文取不到。
- 作用域仅限单条推文路径（`getEnrichedTweet` / `getLocalTweet`）。搜索/List 结果每条都再打一次上游
  会放大 429 风险，故那些路径仍按普通链接渲染。

## 6. 已知限制

- 站内不播放录音（见 §3）
- 搜索 / List / 用户时间线结果不挂 Space 卡片
- 旧缓存推文在**首次**被读取时才会回填（一次上游调用），回填前的读取期间显示为普通链接
- `AudioSpaceById` 的 queryId（`HPEisOmj1epUNLCWTYhUWw`）随 X 改版轮换；失效时 `fetchSpaceDetails`
  抛错 → 静默降级为普通链接。AC-SPACE-008 锁定了请求形态，改版时改一处即可（同 jetfuel 翻车模式，
  见 backlog「jetfuel 官方改版巡检专项」的处置原则）
