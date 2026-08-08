# CI/CD Pipeline 验收标准

> 版本：1.0 | 日期：2026-08-09
> 对应阶段：Phase 2 S5（verify 套件二期）
> 关联 Verifier：`verify/modules/ci.verifier.ts`
> 执行命令：`bun verify --module ci`

---

## AC-CI-001：CI workflow 存在

- **输入**：`.github/workflows/verify.yml`
- **预期输出**：文件存在且可读
- **验证方法**：`bun verify --ac AC-CI-001`
- **Pass 条件**：
  - 文件存在
  - 内容非空

---

## AC-CI-002：类型检查自动运行

- **输入**：`.github/workflows/verify.yml`
- **预期输出**：workflow 在每次 push 触发 `tsc`（typecheck）
- **验证方法**：`bun verify --ac AC-CI-002`
- **Pass 条件**：
  - workflow 在 `push` 事件上触发
  - workflow 包含 `bun run typecheck` 步骤

---

## AC-CI-003：单元测试自动运行

- **输入**：`.github/workflows/verify.yml`
- **预期输出**：workflow 触发 `bun run test`（vitest）
- **验证方法**：`bun verify --ac AC-CI-003`
- **Pass 条件**：
  - workflow 使用 `oven-sh/setup-bun` 配置 bun 运行时
  - workflow 包含 `bun run test` 步骤

---

## AC-CI-004：CLI 验证自动运行

- **输入**：`.github/workflows/verify.yml`
- **预期输出**：workflow 触发 `bun run verify/index.ts --exit-on-fail`
- **验证方法**：`bun verify --ac AC-CI-004`
- **Pass 条件**：
  - workflow 包含 `bun run verify/index.ts --exit-on-fail` 步骤

---

## 总计：4 条 AC

| AC        | 分类 | 依赖外部 API | 依赖 AI |
| --------- | ---- | ------------ | ------- |
| AC-CI-001 | 静态 | 否           | 否      |
| AC-CI-002 | 静态 | 否           | 否      |
| AC-CI-003 | 静态 | 否           | 否      |
| AC-CI-004 | 静态 | 否           | 否      |

> 全部为静态检查，无需服务器或 API key。
