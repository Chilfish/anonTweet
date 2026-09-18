# Postmortem 004: 构建配置在框架迁移与 SSR 复杂度中反复出问题

- **日期**: 2026-05-31（回溯整理）
- **严重级别**: SEV-2
- **分类**: 依赖
- **状态**: Mitigated
- **根因归类**: 工具反馈

## 摘要

构建配置累计修了 10 次，横跨 Vite 配置、SSR 入口、依赖迁移（jsdom → happy-dom）、运行时迁移（rettiwt-api → Hono）和环境变量 schema。每次迁移都留下配置漂移，需要后续补修。根本问题是当时没有任何构建门禁，客户端/服务端越界和依赖破坏只能等到人工构建或部署时才发现。该缺口后来由 #010 补上。

## 影响

- 影响面：构建失败会同时阻塞开发与部署。
- 跨度：2025-11 至 2026-01，几乎贯穿整段开发期。
- 最重的一次是 `9926698`：71 个文件、2323 行插入，单行 commit message，实际上不可评审。

## 时间线

2026-05-31 回溯整理。

| 日期 | commit | 事件 |
| ---- | ------ | ---- |
| 2025-11-26 | `f32eabe` | 补 server 入口并配置 SSR 构建 |
| 2025-11-26 | `7a76f7a` | 集中修 typecheck |
| 2025-12-20 | `7ab766d` | 移除多余的 `node:` 导入 |
| 2025-12-20 | `e8a7020` | 清理冗余 `'use client'` 指令 |
| 2025-12-20 | `a812bc8` | 环境变量 schema 对齐 |
| 2026-01-02 | `5cb2fd5` | client 组件引用了 server 模块 |
| 2026-01-10 | `dba2ecd` | jsdom 迁到 happy-dom |
| 2026-01-10 | `9926698` | 同步 rettiwt-api 上游并迁移 Hono |
| 2026-01-10 | `ef29efc` | 移除临时 Hono adapter |
| 2026-01-19 | `645f988` | `node:*` 导入改为注释以通过类型检查 |
| 2026-01-21 | `22dfe4e` | 修复构建错误 |

## 根因分析

1. `lib/` 没有区分 server-only 与共享代码，client 组件可以直接引用服务端模块。
2. 项目从 Remix 模板长出，`lib/` 是万能目录，`server/` 存在但未被一致使用。
3. 预提交与 CI 只跑 typecheck / lint / test，从不跑构建。
4. 单人流程，没有分支保护或必需状态检查，CI 结果不拦合并。

一句话归纳：没有构建门禁，客户端/服务端越界和依赖破坏只能拖到人工构建或部署才暴露。

## 触发条件

依赖迁移、SSR 配置调整、环境变量 schema 变更。

## 检测

靠人工跑 `bun run build` 发现。当时的盲区是没有预提交构建，类型错误会一直累积到专门的修复提交。

## 处置

逐个修复，Hono 迁移收尾后配置趋于稳定。

## 做得对的地方

Hono 迁移收尾干净（`ef29efc` 移除 adapter），没有留下临时兼容层。上游变更以增量类型为主，服务层兼容性尚可。

## 行动项

### 缓解

- [x] `bun run build` 纳入 pre-push 与 CI（于 #010 补齐；维护者）

### 预防

- [ ] 拆 `lib/` 为 `shared/` 与 `server/`，用 ESLint `no-restricted-imports` 阻止越界引用（维护者；判据：CI 在越界时报错）
- [ ] 生产构建冒烟：启动服务并访问 `/api/health`（维护者；判据：构建产物能启动并响应）
- [ ] 在 CONTRIBUTING.md 写明客户端/服务端边界规则（维护者）

## 教训

不跑构建的门禁会漏掉产物形态问题。大迁移要拆成可评审的小步，71 个文件的提交等于没评审。

## Changed Files

```
vite.config.ts
package.json
bun.lock
app/root.tsx
server/express.js
server/app.ts
app/lib/env.server.ts
app/lib/database/db.server.ts
app/lib/browser.ts
app/routes/api/tweet/get.ts
app/types/global.d.ts
```

## 关联报告

- #010 Babel 主版本漂移：本篇未竟的构建门禁纠正项
- #005 媒体管线：代理配置与环境变量处理交叉
