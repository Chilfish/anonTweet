# TODO（后续）

## 测试

- ✅ 已补：服务层单测
  - `app/lib/service/getTweet.ts`（父链/引用推逻辑）
  - `app/lib/service/getTweet.server.ts`（翻译实体合并逻辑已抽出并覆盖）
- ✅ 已补：实体序列化/还原
  - `app/lib/react-tweet/utils/entitytParser.ts`（占位符与 media_alt 分支覆盖）
- ✅ 已补：API 路由最小单测（mock 上游）
  - `/api/tweet/get/:id`
  - `/api/ai/ai-translation`
- ⏳ 待补：翻译三态渲染（store + UI）
  - `Manual -> AI -> Original` 回退策略一致性（需要补 React 组件测试或最小 store 测试）

## 稳定性/体验

- 上游失败率/429 统计与 UI 提示（引导用户配置更多 `TWEET_KEYS`）
- 长链推文/大量媒体时的渲染与截图性能优化
- 配置项整理成“配置矩阵”（必需/可选、仅本地/仅生产）
