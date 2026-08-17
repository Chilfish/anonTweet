# 隐私加固：baseUrl 白名单验收标准

> 版本：1.0 | 日期：2026-08-17
> 关联 Review：2026-08-17 P1-3（客户端任意 baseUrl = SSRF/滥用面）
> 关联 Backlog：阶段二任务 4（隐私加固：`baseUrl` 白名单 + 隐私页披露）
> 执行命令：`bun run verify/index.ts --module sec` / `--ac AC-SEC-001`

---

## AC-SEC-001：非白名单 baseUrl 拒绝 + 设置页披露 Key 中继

### 背景

客户端自带 Key 经服务端中继出网，且 `baseUrl` 由客户端任意指定——服务端成为任意
LLM 端点的代理（SSRF/滥用面，review P1-3）。白名单只放行已知提供商域名；设置页
如实披露「Key 经服务器中继」。

### 验证对象

- `app/lib/ai-base-url.ts`（白名单 helper：`ALLOWED_AI_BASE_URL_HOSTS` /
  `isAllowedAIBaseUrl`）
- 接受客户端 `baseUrl` 的服务端边界：`app/routes/api/ai/ai-translation.ts`
  （twitter + ins 分支）、`app/routes/api/ai/vision.ts`（generate + translate 分支）、
  `app/routes/api/ai/ai-test.ts`
- 设置页 `app/components/settings/AITranslationSettings.tsx`（披露文案）

### Pass 条件

- **P1 白名单语义（单元测试）**：`isAllowedAIBaseUrl` —
  - 无 `baseUrl`（undefined/空白）→ 允许（回落官方默认端点）；
  - 已知提供商域名（`generativelanguage.googleapis.com` / `api.deepseek.com` /
    `openrouter.ai`，含路径/端口变体）→ 允许；
  - 未知域名 / IP 直连 / 非 http(s) 协议 / 非法 URL → 全部拒绝。
- **P2 边界接入（源码扫描）**：三个接受 `baseUrl` 的路由文件均 import 并调用
  `isAllowedAIBaseUrl`，且无绕过（不得在调用前把 baseUrl 塞进 provider）。
- **P3 披露（源码扫描）**：设置页含「Key 经服务器中继」披露文案（含 baseUrl 白名单说明）。

### 验收命令

```bash
bun run verify/index.ts --ac AC-SEC-001
bun run test
```

---

## 总计：1 条 AC

| AC         | 分类                  | 依赖 AI | 依赖 Fixture |
| ---------- | --------------------- | ------- | ------------ |
| AC-SEC-001 | 仓库级静态检查 + 单测 | 否      | 否           |
