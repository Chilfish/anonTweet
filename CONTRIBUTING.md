# 贡献指南

**项目**: Anon Tweet | **最后更新**: 2026-08-09

## 行为准则

本项目遵循 [Contributor Covenant 2.1](https://www.contributor-covenant.org/version/2/1/code_of_conduct/)。简言之：友善、尊重、建设性。

## 如何贡献

### 报告 Bug

1. 在 [Issues](https://github.com/Chilfish/anonTweet/issues) 搜索是否已有相同问题
2. 使用 **Bug Report** 模板创建 Issue
3. 填写：复现步骤、预期行为、实际行为、设备信息、截图

### 提议功能

1. 在 Issues 搜索是否已有类似提议
2. 使用 **Feature Request** 模板创建 Issue
3. 描述：使用场景、期望行为、备选方案
4. 等待讨论确认后再开始实现（避免浪费精力）

### 提交代码

1. Fork 本仓库
2. 创建 Feature 分支：`git checkout -b feat/your-feature`
3. 遵循代码规范（见 `docs/engineering/code-style.md`）
4. **验证先行**：先写 AC（`verify/acceptance-criteria/`）+ 测试，再实现
5. 确保所有检查通过：
   ```bash
   bun run typecheck
   bun run lint
   bun test
   bun run verify/index.ts --exit-on-fail
   ```
6. 提交：`git commit -m "feat: your feature description"`
7. Push 并创建 Pull Request（使用 PR 模板）

### PR 要求

- [ ] 代码通过所有测试
- [ ] 新功能有测试覆盖 + 验证套件通过
- [ ] Lint 零错误
- [ ] Commit 遵循 Conventional Commits
- [ ] 无 merge conflict
- [ ] PR 描述清楚改了什么、为什么
- [ ] 相关文档已更新（开发日志 `docs/development-log/`、CHANGELOG）

## 开发环境

- **Runtime**: Bun 1.3+
- **Node**: 通过 Bun 运行（`packageManager: bun@1.3.14`）
- **数据库**（可选）: PostgreSQL（Neon Serverless）+ Drizzle

## 项目结构

参见 [docs/README.md](docs/README.md) 与 [docs/project_architecture.md](docs/project_architecture.md)
