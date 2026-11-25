# Postmortem 017: dev 启动改用 Bun 运行时，Cloudflare 插件内部转发失效

- **日期**: 2026-11-25
- **严重级别**: SEV-2
- **分类**: 依赖
- **状态**: Mitigated
- **根因归类**: 工具反馈

## 摘要

`68a39d9`（本地数据库接入 devkit）把 `bun run dev` 从直接执行 `react-router dev`
改成 `bun scripts/dev.ts`，脚本里用 `resolveServerSpawn({ runtime: 'bun' })` 显式
指定 Bun 启动 dev server。旧链路走 `node_modules/.bin/react-router` 的
`#!/usr/bin/env node`，实际跑在 Node 上；改完后跑在 Bun 上。

`@cloudflare/vite-plugin` 启动时由 miniflare 用 undici 的 Dispatcher 做进程内转发
（`initRunner` / `fetchWorkerExportTypes` 请求 `http://localhost/__vite_plugin_cloudflare_*`）。
Bun 提供的 `undici` 是残缺 shim（`MockAgent` 连 `disableNetConnect` 都没有），
dispatcher 被忽略，请求真的连到 `localhost:80`，`ECONNREFUSED`，dev server 启动约
1.5 秒后退出；CI 的 verify 集成层因此起不来。

## 影响

- 用户可见：无（Deploy 仍绿，线上未受影响）。
- 门禁：`Verification Suite` 红，fail 在 `TestServer failed to become ready`。
- 返工：定位 1 次（CI 日志 → 探针 → 本地验证）。
- 隐藏风险：dev 与 CI 的启动链路不同，问题只在 CI 暴露；本地残留的旧 dev server
  会让 `TestServer.probe()` 复用假服务器，掩盖真实启动失败。

## 时间线

| 日期       | commit    | 事件                                                                                    |
| ---------- | --------- | --------------------------------------------------------------------------------------- |
| 2026-11-25 | `68a39d9` | `bun run dev` 改为 `bun scripts/dev.ts`（devkit 包装，runtime 指定 bun）                |
| 2026-11-25 | `1108734` | 多图轮播功能提交（与其无关）触发 CI                                                     |
| 2026-11-25 | `4558741` | CI verify 失败：`http://localhost/__vite_plugin_cloudflare_get_export_types__` 连接被拒 |
| 2026-11-25 | —         | 探针确认 Bun 下 `undici` 为残缺 shim、dispatcher 不生效；改为 `runtime: 'node'`         |

## 根因分析

1. **运行时被隐性改变**。旧脚本的运行时来自 `.bin` shim 的 shebang，没人显式写过；
   devkit 为了跨平台绕开 `.cmd`/`.exe`，改成「运行时 + 包真实入口」，等于顺手把
   Node 换成了 Bun，而 commit 说明与文档都没有提到这一点。
2. **第三方插件依赖 undici Dispatcher**。miniflare 的 `dispatchFetch` 不监听端口，
   靠 `undici.fetch(request, { dispatcher })` 在进程内路由；Bun 的 `undici` 兼容层
   不实现这套语义，于是回落到真实网络。
3. **门禁的暴露面只在 CI**。本地 Windows 上同一路径未复现（未确认平台/版本差异），
   而 pre-push 不跑集成层，回归只能等 CI 发现。
4. **本地假绿**。上一轮 verify 残留的 dev server 还占着 9081，`TestServer` 探测到
   「已就绪」就直接复用，真实启动失败被掩盖。

一句话：包装脚本改变运行时是隐性破坏；依赖 undici Dispatcher 的工具必须跑在 Node。

## 触发条件

在 CI（或任何干净环境）通过 devkit 脚本启动 dev server。

## 检测

CI `Verification Suite` 的 verify job。日志里 `TestServer failed to become ready`
只是表象，真实错误在其上方：`TypeError: Unable to connect ... path: "http://localhost/..."`
来自 miniflare 的 `undici.fetch`。

## 处置

`scripts/dev.ts` 的 `resolveServerSpawn` 改为 `runtime: 'node'`，并写明原因（插件依赖
undici dispatcher，Bun shim 不实现）。本地在**干净端口**上跑
`bun run verify/index.ts --ac AC-DEV-001 --exit-on-fail` 验证：dev server 正常起在
9081，`Local: http://127.0.0.1:9081/`，用例通过。同时清掉了历史残留的 dev server 进程。

## 做得对的地方

- Deploy 与 verify 拆成两个 job，构建/部署路径没有被这次运行时回归影响。
- 集成层有 `AC-DEV-001`（dev server 健康）这条确定性用例，能把启动失败变成红灯，
  而不是靠人肉冒烟。
- 排查用了最小探针（`undici` dispatcher 在 node / bun 下的行为差异），没有靠猜。

## 行动项

- [x] `scripts/dev.ts` 固定 Node 运行时 + 注释说明（维护者；判据：CI verify 绿）
- [ ] `TestServer` 在 Windows 上清理残留进程（relaunch 后的 node 子进程会逃出
      `taskkill /T` 的进程树）；判据：连续两次 verify 不出现 `Port 9081 is in use`
- [ ] 上游 `@chilfish/devkit`：`resolveServerSpawn` 尊重 bin 的 shebang，或把
      「显式 runtime」写进必须项；判据：不指定 runtime 时不会静默换运行时

## 教训

工具链替换运行时（Node ↔ Bun）必须显式声明并验证启动链路；依赖 undici
Dispatcher 的插件（Cloudflare vite plugin / miniflare）只能跑在 Node 上。

## Changed Files

```
scripts/dev.ts
```

## 关联报告

- [004](004-build-configuration.md)（构建/运行时边界）
- [016](016-gate-infra-instability.md)（环境残留导致的假红/假绿）
