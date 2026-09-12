# dev server 启动健康验收标准

> 版本：1.0 | 日期：2026-09-12
> 关联 Postmortem：011（验证名实不符 / dev server NODE_ENV 泄漏）
> 关联 Backlog：F1（修复 dev server 启动崩溃，阶段 0 阻塞项）
> 执行命令：`bun run verify/index.ts --ac AC-DEV-001` / `--module dev`

---

## AC-DEV-001：dev server 以 development 模式启动并可服务根页

- **输入**：宿主环境导出 `NODE_ENV=production` 时执行 `bun run dev`
- **验证对象**：`bun run dev`（react-router dev + Vite SSR）
- **预期输出**：应用根页 `GET /` 返回 2xx HTML
- **验证方法**：集成层（`test/integration/dev-server.spec.ts`）+ `TestServer` 启动
- **Pass 条件**：
  - `TestServer` 能就绪（`waitForReady` 要求根页 2xx）
  - `AC-DEV-001` 用例断言 `GET /` 健康
- **回归背景**：`react-router dev` 继承了宿主 `NODE_ENV=production` → Vite SSR 仍按 dev
  产出 `import { jsxDEV } from 'react/jsx-dev-runtime'`，但 React 的 CJS shim 在 production
  下返回不含 `jsxDEV` 的构建 → 根页 500 `TypeError: (0, ...jsxDEV) is not a function`。

---

## AC-DEV-002：dev / build 脚本固定 NODE_ENV（结构性防护）

- **输入**：`package.json` 的 `scripts`
- **验证对象**：`dev` / `build` 脚本
- **预期输出**：`dev` 显式固定 `NODE_ENV=development`，`build` 显式固定 `NODE_ENV=production`
- **验证方法**：仓库级静态检查（acceptance 层）——**辅助检查，非行为验收**
- **Pass 条件**：
  - `scripts.dev` 含 `NODE_ENV=development`
  - `scripts.build` 含 `NODE_ENV=production`
- **说明**：行为验收见 AC-DEV-001；本条用于在脚本被改回裸命令时**快速失败**（结构性约束，
  如实标注为源码扫描，不冒充行为断言）。

---

## 总计：2 条 AC

| AC         | 分类                   | 依赖外部 API | 依赖 AI |
| ---------- | ---------------------- | ------------ | ------- |
| AC-DEV-001 | 集成（行为）           | 否           | 否      |
| AC-DEV-002 | 仓库级静态（辅助检查） | 否           | 否      |
