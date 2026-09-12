# 贡献指南

## 行为准则

参与本项目请遵守[行为准则](CODE_OF_CONDUCT.md)。发现安全漏洞请走 [SECURITY.md](SECURITY.md) 的渠道，不要开公开 issue。

## 报告问题

1. 先在 [Issues](https://github.com/Chilfish/anonTweet/issues) 搜一下有没有相同问题
2. 没有的话用 Bug Report 模板新建 issue，写清复现步骤、预期行为、实际行为和运行环境

## 提议功能

1. 同样先搜一遍 Issues
2. 用 Feature Request 模板说明使用场景和期望行为
3. 等讨论确认后再动手，避免白做

## 提交代码

1. Fork 并克隆仓库，从 `main` 切分支：`git checkout -b feat/your-feature`（修 bug 用 `fix/` 前缀）
2. 代码风格按 [`docs/engineering/code-style.md`](docs/engineering/code-style.md) 来
3. 新增或修改行为时，先补验收标准（`verify/acceptance-criteria/`）和测试，再写实现
4. 本地跑完这几项：

   ```bash
   bun run typecheck
   bun run lint
   bun run build
   bun run verify/index.ts --exit-on-fail
   ```

   `verify` 已经覆盖单元、验收和集成测试，不用再单独跑 `bun run test`。

5. 提交信息用 Conventional Commits：`git commit -m "feat: ..."`
6. Push 后开 PR，按模板填写

## PR 检查项

- [ ] `bun run typecheck`、`bun run lint`、`bun run build` 通过
- [ ] `bun run verify/index.ts --exit-on-fail` 通过
- [ ] 新行为有对应测试和验收标准
- [ ] 提交信息符合 Conventional Commits
- [ ] 没有遗留冲突
- [ ] 文档已同步（相关 `docs/` 文档、`CHANGELOG.md`）

## 开发环境

- Bun 1.4 以上，仓库的 `packageManager` 为 `bun@1.4.2`，Node 由 Bun 提供
- 数据库可选：PostgreSQL（Neon）+ Drizzle，只在开启 `ENABLE_DB_CACHE` 时才需要
- 环境变量配置见 [README 的配置一节](README.md#配置)

## 项目结构

- 文档入口：[`docs/INDEX.md`](docs/INDEX.md)
- 架构总览：[`docs/planning/project-architecture.md`](docs/planning/project-architecture.md)
