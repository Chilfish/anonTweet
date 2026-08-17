# GET 与 AI 翻译解耦验收标准

> 版本：1.0 | 日期：2026-08-17
> 关联 Review：2026-08-17 P1-2（AI 调用阻塞首屏）
> 关联 Backlog：阶段二任务 1（GET 与 AI 翻译解耦 + AI 端点流式化）
> 执行命令：`bun run verify/index.ts --module decouple` / `--ac AC-DECOUPLE-001`

---

## AC-DECOUPLE-001：GET /api/tweet/get 不内联 LLM 调用

### 背景

开启 AI 翻译后，`POST /api/tweet/get` 曾同步等待 1~2 次 LLM 完整返回（含 quoted tweet），
分钟级首屏（review P1-2）。解耦后 GET 只负责拉取（DB 缓存 → 原文），AI 翻译统一由客户端
触发 `/api/ai-translation`，首屏先渲染原文，翻译就绪再注入。

### 验证对象

- `app/routes/api/tweet/get.ts`（源码扫描）
- `app/routes/tweet.tsx` / `app/hooks/use-auto-translate.ts`（客户端触发）
- `app/routes/plain.tsx`（截图 SSR 两步走：GET + `/api/ai-translation`）

### Pass 条件

- **P1 GET 路由（源码扫描）**：`tweet/get.ts` 不得 import `~/lib/AITranslation`
  （`autoTranslateTweet`），不得出现 `generateText` / `streamText` 等 LLM 调用特征。
- **P2 客户端触发**：推文页拿到 GET 数据后经 `/api/ai-translation` 触发翻译
  （源码含该端点引用）。
- **P3 截图链路**：plain 路由在 `?translation=true` 时经 `/api/ai-translation` 两步完成翻译
  （不得回退为依赖 GET 内联翻译）。

## AC-DECOUPLE-002：服务端 AI 调用带超时

### 背景

服务端 AI 调用无超时，Serverless 上 LLM 挂起会无限叠加超时与计费（review P1-2）。
所有服务端 AI 调用必须携带 `AbortSignal.timeout`（`app/lib/ai-timeout.ts`，
默认 120s，`AI_TRANSLATION_TIMEOUT_MS` 可覆盖）。

### 验证对象

- `app/lib/ai-timeout.ts`（超时 helper）
- `app/lib/AITranslation.ts`（推文翻译 `translateText`）
- `app/lib/translateIGCaption.ts`（IG caption 翻译）

### Pass 条件

- **P1 helper**：`ai-timeout.ts` 导出默认超时 ms（正整数且有界）与创建
  `AbortSignal.timeout` 信号的工厂函数。
- **P2 调用点（源码扫描）**：`AITranslation.ts` / `translateIGCaption.ts` 的 `generateText`
  调用均携带 `abortSignal`。
- **P3 单元测试**：helper 返回信号可中止；默认超时有界（1000 ≤ ms ≤ 300000）。

### 验收命令

```bash
bun run verify/index.ts --ac AC-DECOUPLE-001
bun run verify/index.ts --ac AC-DECOUPLE-002
bun run test
```

---

## 总计：2 条 AC

| AC              | 分类                  | 依赖 AI | 依赖 Fixture |
| --------------- | --------------------- | ------- | ------------ |
| AC-DECOUPLE-001 | 仓库级静态检查        | 否      | 否           |
| AC-DECOUPLE-002 | 仓库级静态检查 + 单测 | 否      | 否           |
