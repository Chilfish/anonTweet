# 隐私加固：AI baseUrl 白名单（可选加固）验收标准

> 版本：1.2 | 日期：2026-09-12
> 关联 Review：2026-08-17 P1-3（客户端任意 baseUrl = SSRF/滥用面）
> 关联 Backlog：阶段二任务 4（隐私加固：baseUrl 白名单 + 隐私页披露）；F3（死断言清理）
> 执行命令：`bun run verify/index.ts --module sec` / `--ac AC-SEC-001`
>
> **v1.1 变更（2026-08-19）**：白名单由「强制」改为「**可选加固，默认关闭**」——
> 自定义 baseUrl 是第三方中转站/自建端点场景的核心功能，强制白名单会堵死该路径；
> 默认放行任意 baseUrl（行为与引入白名单前一致，部署零配置）。
> 公开部署的部署方设 `ENABLE_AI_BASE_URL_WHITELIST=true` 开启，此时按白名单拒绝。
>
> **v1.2 变更（2026-09-12）**：所有者裁定设置页的长段隐私披露文案「太吵」，已从
> `AITranslationSettings.tsx` 移除；原 P3「设置页披露（源码扫描）」断言随之删除（不再声称
> 该 AC 覆盖披露文案）。另外修复了该断言此前形同虚设的问题——原用例开头有一句死 `return`
> （`// 暂时不管他`），其后三条 `expect` 永不执行，属「已知缺口被静默吞掉」。

---

## AC-SEC-001：AI baseUrl 白名单（可选）

### 背景

客户端自带 API Key 经服务端中继出网，且 `baseUrl` 由客户端指定——服务端可能成为任意
LLM 端点的代理（SSRF/滥用面，review P1-3）。白名单作为**可选加固**：
默认关闭（自定义端点可用），开启后仅放行已知提供商域名 + 部署方扩展域名。

### 验证对象

- `app/lib/ai-base-url.ts`（白名单 helper：`ALLOWED_AI_BASE_URL_HOSTS` /
  `isAllowedAIBaseUrl` / `isAIBaseUrlWhitelistEnabled` / `getAIBaseUrlWhitelistHosts`）
- `app/lib/env.server.ts`（开关 `ENABLE_AI_BASE_URL_WHITELIST` 默认 false +
  扩展域名 `ALLOWED_AI_BASE_URL_HOSTS`）
- 接受客户端 `baseUrl` 的服务端边界：`app/routes/api/ai/ai-translation.ts`
  （twitter + ins 分支）、`app/routes/api/ai/vision.ts`（generate + translate 分支）、
  `app/routes/api/ai/ai-test.ts`

### Pass 条件

- **P1 白名单语义（单元测试）**：`isAllowedAIBaseUrl`（默认关闭 → 任意 baseUrl 放行；
  开启后）——
  - 无 `baseUrl`（undefined/空白）→ 允许（回落官方默认端点）；
  - 已知提供商域名（`generativelanguage.googleapis.com` / `api.deepseek.com` /
    `openrouter.ai`，含路径/端口变体）→ 允许；
  - 未知域名 / IP 直连 / 非 http(s) 协议 / 非法 URL → 全部拒绝（仅开启时）。
- **P1.1 默认关闭（单元测试）**：`isAIBaseUrlWhitelistEnabled() === false`；
  未开启时 `isAllowedAIBaseUrl` 对任意端点（含 IP/localhost/未知域名）返回 true。
- **P1.2 扩展域名（单元测试）**：`getAIBaseUrlWhitelistHosts` 将 env
  `ALLOWED_AI_BASE_URL_HOSTS`（逗号分隔，大小写归一、空白忽略）与内置官方域名合并。
- **P2 边界接入（源码扫描，辅助检查）**：三个接受 `baseUrl` 的路由文件均 import 并调用
  `isAllowedAIBaseUrl`，且无绕过（不得在调用前把 baseUrl 塞进 provider）；
  env schema 中开关默认 `false` 且扩展域名字段存在。

> ⚠️ P2 为**源码扫描（辅助检查）**，非行为验收；真正的白名单行为由 P1/P1.1/P1.2 单测覆盖。

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
