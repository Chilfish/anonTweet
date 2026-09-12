# 单元测试补齐（P0 缺口）验收标准

> 版本：1.0 | 日期：2026-09-12
> 关联 Backlog：F9（登记 `AC-TEST-006`，修复「测试有、文档无」断链）
> 关联文档：`docs/archive/testing-infra-refactor.md`（Phase B P0 缺口补齐）
> 执行命令：`bun run verify/index.ts --ac AC-TEST-006` / `--module test`
>
> **背景**：`AC-TEST-006` 是 verify 基建重构时期补的 P0 解析器缺口（`parseTweet` 全变体
> 覆盖），此前只在 `docs/archive/` 与测试名中出现，未登记进 `verify/acceptance-criteria/`，
> 导致 AC 编号契约「文档 ↔ 测试」在测试侧多出一个孤儿编号。本文件把它正式登记。

---

## AC-TEST-006：parseTweet 解析全变体覆盖（P0 缺口补齐）

- **验证对象**：`app/lib/react-tweet/utils/get-tweet.ts` 的 `parseTweet`（原始 payload → `EnrichedTweet`）
- **测试**：`test/unit/parseTweet.spec.ts`（≥10 用例）
- **输入**：合成的 raw tweet payload 变体
- **预期输出**：正确丰富为 `EnrichedTweet`，或在不可用时返回 `null`
- **Pass 条件**：
  - 最小推文补齐 url / user / entities
  - `note_tweet` 文本优先于 legacy `full_text`
  - `TweetTombstone`、缺 user、缺 core/legacy → 返回 `null`
  - `retweeted_status_result` 递归解包
  - card 变体：summary / player → summary_large_image / unified_card（含 topic_detail 布局）/ 无 title/description/image
  - media 变体：photo（alt）/ animated_gif（video_info）/ video（取最后一个 variant）/ 无 media

---

## 总计：1 条 AC

| AC          | 分类   | 依赖外部 API | 依赖 AI | 依赖 Fixture |
| ----------- | ------ | ------------ | ------- | ------------ |
| AC-TEST-006 | 纯函数 | 否           | 否      | 否           |
