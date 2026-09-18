# Postmortem 010: 依赖升级越过 Babel 主版本，.tsx 构建全量失败

- **日期**: 2026-09-11
- **严重级别**: SEV-2
- **分类**: 依赖
- **状态**: Mitigated
- **根因归类**: 工具反馈

## 摘要

一次例行依赖升级后 `bun run build` 直接失败。`@babel/preset-typescript` 被提升到 v8.0.1，而 `@babel/core` 仍是 7.29.7（被 `vite-plugin-babel@1.x` 的 peer `@babel/core ^7` 锁死）。Babel 8 的该 preset 移除了 `isTSX` / `allExtensions`，不再为 `.tsx` 自动开启 JSX 解析，`entry.client.tsx` 里的 `<StrictMode />` 被当成类型断言，报 `Unexpected token`，12 个模块连锁失败。修复本身很小，但它暴露的真问题是没有任何门禁跑过生产构建，正是 #004 留下的纠正项。

## 影响

- 构建完全不可用（client + SSR），阻塞开发与部署。
- 排查约 30 分钟。
- 隐藏风险：这次的升级包能通过当时全部门禁（typecheck、lint、unit + acceptance、verify），却产不出构建产物。

## 时间线

| 日期 | commit | 事件 |
| ---- | ------ | ---- |
| 2026-09-11 | — | 依赖升级，`@babel/preset-typescript` 被加为显式 devDep 并解析到 `^8.0.1` |
| 2026-09-11 | — | `bun run build` 报 Babel SyntaxError，`.tsx` 的 JSX 被当作类型断言 |
| 2026-09-11 | — | 对齐 preset 至 `~7.29.7` 后恢复，补构建门禁与 AC-BUILD |

## 根因分析

1. 门禁里没有构建步骤。pre-push 只跑 typecheck / lint / verify / build-storybook，CI 同理，`bun run build` 从不执行。
2. preset 用了 caret。`^7.29.7` 允许解析到 8.x；上游 `@react-router/dev` 8.3.1 移除传递依赖后，它变成一条无约束的直接依赖，bun 选了最新主版本。
3. Babel 生态的双重约束不可见：`vite-plugin-babel` 的 peer 是 `@babel/core ^7`，而 preset v8 要求 core ^8 且改了行为，两处约束分散在 `package.json`、`vite.config.ts` 与上游 metadata 里。
4. CI 路径过滤漏掉依赖文件：`verify.yml` 的 `paths` 不含 `package.json` / `bun.lock` / `vite.config.ts`，纯依赖升级 PR 根本不触发 CI。

一句话归纳：门禁不跑生产构建，加上跨主版本仍用 caret，构建失败只能在人工构建或部署时才暴露。

## 触发条件

上游移除对 `@babel/preset-typescript` 的传递依赖，使它被重新解析到 v8。

## 检测

人工跑 `bun run build` 发现。当时的盲区是没有构建门禁，CI 也不因依赖文件变更触发。

## 处置

把 preset 锁到 `~7.29.7`，与 core 7.x 对齐；在 `vite.config.ts` 写明版本约束与升级前置条件。

## 做得对的地方

先做最小复现（用 `@babel/core` 直接 `transformSync` 一段 TSX），把根因从「版本不对」收敛到「preset 不再自动开 JSX」，再动手改依赖。修复方向对照官方迁移文档确认，没有凭猜。

## 行动项

### 缓解

- [x] preset 锁到 `~7.29.7`，与 core 7.x 对齐（维护者）
- [x] `vite.config.ts` 写明版本约束与升级前置条件（维护者）

### 预防

- [x] AC-BUILD-001：用实际 Babel 配置转换 `.tsx`，断言不抛错且 JSX 保留（维护者）
- [x] AC-BUILD-002：断言 `@babel/preset-typescript` 与 `@babel/core` 主版本一致（维护者）
- [x] AC-BUILD-003：断言 pre-push 与 CI 都执行 `bun run build`（维护者）
- [x] `bun run build` 纳入 pre-push 与 CI，并补 CI `paths`（维护者）
- [x] CI bun 版本对齐 `packageManager`（1.3.14 → 1.4.2；维护者）
- [ ] 评估用 `@vitejs/plugin-react` 内建 babel 集成替代 `vite-plugin-babel`，从根上移除 `@babel/core ^7` peer 约束（维护者）

## 教训

构建不能靠「有人想起来才跑」。门禁只覆盖类型、静态和测试，构建失败就会溜进 main。跨主版本的 caret 依赖要显式锁死。

## Changed Files

```
package.json
vite.config.ts
lefthook.yml
.github/workflows/verify.yml
test/acceptance/ac-build.spec.ts
verify/acceptance-criteria/AC-build.md
verify/README.md
docs/postmortem/010-babel-major-drift.md
docs/postmortem/README.md
```

## 关联报告

- #004 构建配置：同一根因「缺构建门禁」的原始记录，本篇为其纠正项的落地
