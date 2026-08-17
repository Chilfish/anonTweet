# 可观测性结构化日志验收标准

> 版本：1.0 | 日期：2026-08-17
> 关联 Backlog：阶段二任务 3（可观测性：翻译耗时/缓存命中率/RettiwtPool 状态结构化日志）
> 目标：为阶段三「三层缓存规模化与命中率指标」提供指标来源
> 执行命令：`bun run verify/index.ts --module obs` / `--ac AC-OBS-001`

---

## AC-OBS-001：翻译耗时 / 缓存命中率 / RettiwtPool 状态输出结构化日志

### 背景

翻译耗时、缓存命中率、RettiwtPool 冷却/耗尽状态是阶段三缓存规模化的核心指标，
现状为零散 console 文本（格式不统一、不可聚合）。统一为单行 JSON 结构化日志。

### 验证对象

- `app/lib/obs-log.ts`（`obsLog` / `ObsEvent` / `suffix`）
- `app/lib/AITranslation.ts`（推文翻译计时）
- `app/lib/translateIGCaption.ts`（IG caption 翻译计时）
- `app/lib/localCache.ts`（缓存命中/未命中）
- `app/lib/SmartPool.ts`（轮换 / 耗尽状态）

### Pass 条件

- **P1 helper**：`obs-log.ts` 导出 `obsLog(event, fields)`（输出单行 JSON 含 `ts` + `event`）
  与 `suffix()`（key/id 尾部摘要，防日志泄露完整令牌）；`ObsEvent` 覆盖
  `ai.translate` / `ai.translate.ig` / `cache.get` / `pool.rotate` / `pool.exhaust`。
- **P2 翻译计时（源码扫描）**：`AITranslation.translateText` 与 `translateIGCaption`
  调用 `obsLog('ai.translate'` / `obsLog('ai.translate.ig'`，字段含 `ms` 与 `attempts`
  （失败含 `ok: false` 与 `reason`）；不含 apiKey/baseUrl 等敏感字段。
- **P3 缓存命中（源码扫描）**：`localCache.ts` 的 `getLocalCache` 记录
  `obsLog('cache.get'`，字段含 `hit`（布尔）与 `adapter`。
- **P4 池状态（源码扫描）**：`SmartPool.ts` 记录 `obsLog('pool.rotate'`（轮换/冷却）与
  `obsLog('pool.exhaust'`（全部 Key 耗尽）。
- **P5 单元测试**：`obsLog` 输出为可解析的单行 JSON（含 `ts`+`event`）；`suffix` 截断/短值原样。

### 验收命令

```bash
bun run verify/index.ts --ac AC-OBS-001
bun run test
```

---

## 总计：1 条 AC

| AC          | 分类                    | 依赖 AI | 依赖 Fixture |
| ----------- | ----------------------- | ------- | ------------ |
| AC-OBS-001  | 仓库级静态检查 + 单测   | 否      | 否           |