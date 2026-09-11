# Postmortem 010: 依赖升级越过 Babel 主版本，`.tsx` 构建全量失败

- **日期**: 2026-09-11
- **严重级别**: 中
- **状态**: Mitigated
- **根因归类**: 工具反馈（缺构建门禁）+ 决策滞后（版本约束未固化）

## 摘要

一次例行依赖升级后 `bun run build` 直接失败：`@babel/preset-typescript` 被提升到
**v8.0.1**，而项目里的 `@babel/core` 仍是 **7.29.7**（由 `vite-plugin-babel@1.x` 的
peer `@babel/core ^7` 锁死）。Babel 8 的该 preset 移除了 `isTSX`/`allExtensions`，
不再为 `.tsx` 自动开启 JSX 解析，于是 `entry.client.tsx` 里的 `<StrictMode />` 被当成
TS 类型断言解析，报 `Unexpected token, expected "</>/<=/>="`，12 个模块连锁失败。
修复本身很小（把 preset 对齐回 core-7 线），但它暴露的真问题是：
**没有任何门禁跑过生产构建**——这正是 [postmortem 004](004-build-configuration.md)
写下的未竟纠正项。

## 影响

- 构建完全不可用（client + SSR 全挂），阻塞开发与部署
- 排查：定位 `@react-router/dev` 8.3.0→8.3.1 移除了 `@babel/preset-typescript` 传递依赖、
  该 preset 被补成显式依赖并解析到 v8 大版本，约 30 分钟
- 隐藏风险：升级包（bun.lock/package.json）能通过当时的全部门禁
  （typecheck / lint / unit+acceptance / verify），却无法产出构建产物

## 时间线

| commit / 事件 | 说明                                                                                                 |
| ------------- | ---------------------------------------------------------------------------------------------------- |
| 依赖升级      | `package.json` 大批依赖升 minor/patch；`@babel/preset-typescript` 被加为显式 devDep，解析到 `^8.0.1` |
| 2026-09-11    | `bun run build` 报 Babel SyntaxError，`.tsx` 的 JSX 被当类型断言                                     |
| 2026-09-11    | 对齐 preset 至 `~7.29.7` 后构建恢复；补构建门禁 + AC-BUILD 防护                                      |

## 根因分析（blameless）

- **贡献因素 1：门禁里没有构建步骤**。pre-push（lefthook）只跑
  typecheck / lint / verify / build-storybook，CI 同理——**`bun run build` 从不执行**。
  构建失败只能在人工 `bun run build` 或部署时才发现。
- **贡献因素 2：preset 用了 caret，可跨主版本**。`^7.29.7` 允许解析到 8.x；
  当上游（`@react-router/dev` 8.3.1）移除对它的传递依赖后，它变成一条**无约束的
  直接依赖**，bun 直接选了最新大版本。
- **贡献因素 3：Babel 生态的双重约束不可见**。`vite-plugin-babel@1.x` peer 是
  `@babel/core ^7`，而 preset v8 要求 core ^8 且改了行为——两处约束分散在
  `package.json`、`vite.config.ts` 与上游包的 metadata 里，没有任何地方写明。
- **贡献因素 4：CI 路径过滤漏掉依赖文件**。`.github/workflows/verify.yml` 的 `paths`
  不含 `package.json` / `bun.lock` / `vite.config.ts`，纯依赖升级 PR **根本不触发 CI**。

## 做得对的地方

- 先本地最小复现（`@babel/core` 直接 `transformSync` 一段 TSX）把根因从"版本不对"
  收敛到"preset 不再自动开 JSX"，再动手改依赖
- 对照官方迁移文档确认行为变更（Babel 8 移除 `isTSX`/`allExtensions`），而非凭猜测
- 修复方向选了"对齐回 core-7 线"而非强升 core 8（后者受 `vite-plugin-babel` peer 阻塞）

## 行动项

### 缓解（针对已发生的具体缺口）

- [x] `@babel/preset-typescript` 锁到 `~7.29.7`，与 `@babel/core` 7.x 对齐（2026-09-11）
- [x] `vite.config.ts` 写明版本约束与升级前置条件（2026-09-11）

### 预防（针对整类问题）

- [x] 新增行为级 AC-BUILD-001：用项目实际 Babel 配置转换一段 `.tsx`，断言不抛错且 JSX 保留（2026-09-11）
- [x] 新增 AC-BUILD-002：断言 `@babel/preset-typescript` 与 `@babel/core` 主版本一致（2026-09-11）
- [x] 新增 AC-BUILD-003：断言 pre-push 与 CI 都执行 `bun run build`（2026-09-11）
- [x] `bun run build` 纳入 lefthook pre-push 与 CI，并补 CI `paths`（package.json/bun.lock/vite.config.ts/react-router.config.ts）（2026-09-11）
- [x] 顺带消除 CI bun 版本漂移（1.3.14 → 1.4.2，对齐 `packageManager`）（2026-09-11）
- [ ] 评估用 `@vitejs/plugin-react` 内建 babel 集成替代 `vite-plugin-babel`，从根上移除
      `@babel/core ^7` peer 约束（避免下次 Babel 生态整体升级时再被卡住）

## 教训

- **构建不能只是"有人想起来才跑"**：验证门禁若只覆盖类型/静态/测试，构建失败就会
  悄悄溜进 main。凡是会改变产物形态的依赖（编译器/打包器/preset），都必须有构建门禁。
- **跨主版本的 caret 依赖要显式锁**：当一条依赖的兼容性由"另一个包的 peer"决定时，
  `^` 就是隐患；用 `~` 或精确版本，并把约束写进注释与 postmortem。

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

## 关联 Postmortem

- #004（Build Configuration）— 同一根因"缺少构建验证门禁"的原始记录，本次为其纠正项 #2/#3 的落地
