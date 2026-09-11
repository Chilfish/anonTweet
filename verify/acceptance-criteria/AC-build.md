# 构建管线验收标准

> 版本：1.0 | 日期：2026-09-11
> 关联 Postmortem：[010-babel-major-drift](../postmortem/010-babel-major-drift.md)
> 测试实现：`test/acceptance/ac-build.spec.ts`
> 执行命令：`bun run verify/index.ts --module build`（或 `bun run test`）

---

## AC-BUILD-001：Babel 能转换 `.tsx` 的 JSX

- **输入**：一段含 JSX 的 `.tsx` 探针源码 + 项目实际的 Babel 配置
  （`@babel/preset-typescript` + `babel-plugin-react-compiler`）
- **预期输出**：`babel.transformSync` 正常返回，且产物保留 JSX、注入 React Compiler runtime
- **验证方法**：`bun run verify/index.ts --ac AC-BUILD-001`
- **Pass 条件**：
  - 转换不抛错（复现的失败模式：`.tsx` 的 `<Jsx/>` 被当作 TS 类型断言，
    报 `Unexpected token, expected "</>/<=/>="`）
  - 产物包含 `<div`（JSX 未被误解析/丢弃）
  - 产物包含 `react/compiler-runtime`（React Compiler 确实参与转换）

---

## AC-BUILD-002：Babel preset 与 core 主版本一致

- **输入**：`node_modules/@babel/preset-typescript/package.json` 与
  `node_modules/@babel/core/package.json`
- **预期输出**：两者 major 相同
- **验证方法**：`bun run verify/index.ts --ac AC-BUILD-002`
- **Pass 条件**：
  - `@babel/preset-typescript` 的 major === `@babel/core` 的 major
  - 失败即说明 preset 越过了 `vite-plugin-babel@1.x` 的 `@babel/core ^7` 约束
    （v8 preset 需 core 8 且移除了 `.tsx` 自动 JSX 解析）

---

## AC-BUILD-003：生产构建纳入门禁

- **输入**：`lefthook.yml`（pre-push）与 `.github/workflows/verify.yml`（CI）
- **预期输出**：两处门禁都执行 `bun run build`
- **验证方法**：`bun run verify/index.ts --ac AC-BUILD-003`
- **Pass 条件**：
  - `lefthook.yml` 包含 `bun run build`
  - CI workflow 包含 `bun run build`
  - 防止构建门禁被静默移除（postmortem 010 的检测缺口）

---

## 总计：3 条 AC

| AC           | 分类 | 依赖外部 API | 依赖 AI |
| ------------ | ---- | ------------ | ------- |
| AC-BUILD-001 | 行为 | 否           | 否      |
| AC-BUILD-002 | 静态 | 否           | 否      |
| AC-BUILD-003 | 静态 | 否           | 否      |

> 全部离线，无需服务器、密钥或网络。
