# CI/CD Pipeline 验收标准

> 版本：1.1 | 日期：2026-09-12
> 对应阶段：Phase 2 S5（verify 套件二期）；v1.1 修复 F5（review-2026-09-11 P1-3）
> 关联 Verifier：`test/acceptance/ac-ci.spec.ts`
> 执行命令：`bun run verify/index.ts --module ci`
>
> **v1.1 变更**：AC-CI-002/003/004 改为**解析 workflow 的 `run:` / `uses:` 步骤后按命令断言**，
> 不再用整文件 substring。原实现下 `bun run test` 只出现在 `verify.yml` 的一句注释里即可
> 让 AC-CI-003 变绿（注释冒充步骤）。同时如实记录：CI 已**不单独跑 `bun run test`**——
> 单测经统一 `bun run verify/index.ts` 门禁执行（该 CLI 含 `unit` 项目），避免同一套测试重复跑。

---

## AC-CI-001：CI workflow 存在且可执行

- **输入**：`.github/workflows/verify.yml`
- **预期输出**：文件存在、非空，且可解析出步骤
- **验证方法**：`bun run verify/index.ts --ac AC-CI-001`
- **Pass 条件**：
  - 文件存在且内容非空
  - 解析出 ≥1 个步骤
  - 使用 `oven-sh/setup-bun` 配置 bun 运行时

---

## AC-CI-002：类型检查自动运行

- **输入**：`.github/workflows/verify.yml`
- **预期输出**：workflow 在每次 push 触发 typecheck
- **验证方法**：`bun run verify/index.ts --ac AC-CI-002`
- **Pass 条件**：
  - workflow 在 `push` 事件上触发
  - 某个 `run:` 步骤的命令恰为 `bun run typecheck`

---

## AC-CI-003：单元测试在 CI 中执行

- **输入**：`.github/workflows/verify.yml` + `verify/index.ts`
- **预期输出**：CI 执行覆盖 unit 的验证套件
- **验证方法**：`bun run verify/index.ts --ac AC-CI-003`
- **Pass 条件**：
  - 某个 `run:` 步骤执行 `bun run verify/index.ts …`
  - `verify/index.ts` 的项目列表含 `unit`
- **说明**：CI 为去重不再单独 `bun run test`；「单测是否在 CI 跑」由「verify 跑没跑 +
  verify 是否含 unit」两件事共同证明，而非在 workflow 里找一个字符串。

---

## AC-CI-004：CLI 验证以 fail-fast 模式运行

- **输入**：`.github/workflows/verify.yml`
- **预期输出**：workflow 的 verify 步骤带 `--exit-on-fail`
- **验证方法**：`bun run verify/index.ts --ac AC-CI-004`
- **Pass 条件**：
  - 存在包含 `bun run verify/index.ts` 且带 `--exit-on-fail` 的 `run:` 步骤

---

## 总计：4 条 AC

| AC        | 分类 | 依赖外部 API | 依赖 AI |
| --------- | ---- | ------------ | ------- |
| AC-CI-001 | 静态 | 否           | 否      |
| AC-CI-002 | 静态 | 否           | 否      |
| AC-CI-003 | 静态 | 否           | 否      |
| AC-CI-004 | 静态 | 否           | 否      |

> 全部为静态检查，无需服务器或 API key。
