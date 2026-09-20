# Postmortem 014: 逆向私有接口与模型规范隐性漂移，缺漂移检测

- **日期**: 2026-09-18
- **严重级别**: SEV-2
- **分类**: 依赖
- **状态**: Active
- **根因归类**: 工具反馈

## 摘要

这个项目依赖两类不稳定、且由他人掌控的外部契约：逆向出来的 Twitter/IG 私有接口，以及 AI provider 的模型规范。两者都会在无预警的情况下变化，而仓库没有漂移检测。2026-08-19 `unified_card` 只认固定布局、jetfuel 被确认是无公开 schema 的私有二进制格式；2026-08-31 guest 认证缺 `TWEET_SEARCH`，让搜索整体返回 `RESOURCE_NOT_ALLOWED`；2026-09-13 DeepSeek 模型 slug 已停用且有拼写错误（`deepseek v4 pro` 带空格）；2026-09-17 Space 的 `creator_results` 是同名但更瘦的用户对象。共同点是：契约变化只在运行时以「数据丢了 / 接口拒绝 / 字段 undefined」的形式暴露。

## 影响

- 用户可见：卡片信息丢失、搜索结果整体失败、模型调用报错、认证徽标消失。
- 返工：jetfuel 的逆向调查耗时最长（临时探针 + 运行时猴补丁 + 对照上游行为）；模型 slug 与 guest auth 各需一次排查。
- 隐藏风险：私有格式没有公开 schema，只能靠固化的 fixture 与真实 E2E 兜底；模型 slug 出错甚至不抛错，只表现为质量下降。

## 时间线

| 日期 | commit | 事件 |
| ---- | ------ | ---- |
| 2026-06-23 | `d603cd1` | 修正 X-Client-Transaction-ID 的处理 |
| 2026-08-19 | `2cec41d` | 解析 `jetfuel_attachment` 得到 trending card 信息 |
| 2026-08-19 | `265cb6d` | 渲染官方风格的 trending card |
| 2026-08-19 | `175b081` | `unified_card` 补 `topic_detail` 布局（此前只认 `details_1`） |
| 2026-08-31 | `2027ea0` | 为 tweet search 开放 guest 认证，此前缺 `TWEET_SEARCH` 导致整组被拒 |
| 2026-09-13 | `11d78c6` | 新增 DeepSeek 通道并对齐官方模型 slug |
| 2026-09-17 | `75ed543` | Space 卡片；`creator_results` 精简对象缺认证字段 |

## 根因分析

1. 契约是逆向得来的，既没有版本也没有变更通知。jetfuel 是私有二进制帧（节点字典式压缩），上游开关一开就会启用，仓库只能靠固化的 fixture 断言其形态。
2. 上游对象「看起来一样、实际更瘦」。Space 的 `creator_results` 是同名但缺 `is_blue_verified` / `verified_type` 的精简对象；`verified` 字段还会被省略（是 `undefined` 而非 `false`），直接使用就会丢数据或崩。
3. 模型规范靠手抄。DeepSeek 的 slug 列表里存在已停用项与拼写错误，没有与官方文档对齐的校验，错误要等调用失败才暴露。
4. 没有漂移检测。fixture 只在人工更新时才反映新形态；#010 的构建门禁与 #001 的解析器测试都在代码侧，覆盖不到外部契约。

一句话归纳：外部契约会无预警变化，而仓库既没有单一定义源，也没有漂移检测，只能等运行时报错。

## 触发条件

上游启用新布局或新 flag；上游精简响应对象；provider 停用或更名模型。

## 检测

全部靠运行时异常或人工对比：卡片信息缺失、搜索整组失败、模型调用报错。当时的盲区是没有对真实上游做定期形态校验，fixture 只在人工更新时才反映新形态。

## 处置

逆向时先写临时探针核实上游返回形态，再落地实现。把真实上游响应固化为 fixture（如 `test/fixtures/space/*.json`），配离线 AC。模型 slug 对齐官方文档。解析侧对缺失字段一律保守回退。

## 做得对的地方

逆向时不猜字段，先用运行时猴补丁注册临时资源、核实返回形态。识别出「上游要区分『没有』与『取不到』」——已删除的 Space 返回空 `metadata`，而请求失败是抛错——因此只对前者渲染墓碑，避免把限流误报成已删除。Space 与 jetfuel 都把真实响应固化成了 fixture。

## 行动项

### 缓解

- [x] 解析 jetfuel payload 并渲染 trending card（`2cec41d` / `265cb6d`）
- [x] `unified_card` 支持 `topic_detail` 布局（`175b081`）
- [x] tweet search 开放 guest 认证（`2027ea0`）
- [x] DeepSeek 模型 slug 对齐官方文档（`11d78c6`）
- [x] Space 对精简对象缺字段做保守回退（`75ed543`）

### 预防

- [ ] 为每个逆向契约建立 fixture 语料，并在 CI 做形态快照：新增或缺失字段时报警，而不是静默（维护者）
- [ ] 模型 slug 收敛为单一定义源，并加一条对齐官方文档的校验，禁止裸字符串散落（维护者）
- [ ] 上游对象统一走「窄类型 + 缺字段回退」，禁止用可选字段直接索引枚举（维护者）
- [ ] 每月对关键上游接口跑一次真实 E2E 形态检查（维护者）

## 教训

逆向接口和模型规范都是会变的外部契约。要么固化 fixture 做形态快照，要么等它在线上报错；靠记忆和手抄一定会漂。

## Changed Files

```
app/lib/react-tweet/api-v2/parseTweet.ts
app/lib/rettiwt-api/parsers/jetfuel.ts
app/lib/react-tweet/api-v2/get-tweet.ts
app/lib/react-tweet/utils/space.ts
app/types/space.ts
app/lib/constants.ts
```

## 关联报告

- #001 推文解析：同为解析外部数据，且都缺回归锚点
- #010 Babel 主版本漂移：同为「外部版本变化打穿门禁」
