# Git 开发流程

**项目**: Anon Tweet | **最后更新**: 2026-08-09

## 分支模型

采用 **Trunk-Based Development** (简化版):

```
main ─────●─────●─────●─────●──→ (始终可发布)
           \     /
feat/xxx ──●───●
```

| 分支类型     | 命名格式                        | 用途                             | 生命周期   |
| ------------ | ------------------------------- | -------------------------------- | ---------- |
| `main`       | —                               | 稳定分支，始终可发布             | 永久       |
| `feat/*`     | `feat/ig-translation`           | 功能开发                         | 合并后删除 |
| `fix/*`      | `fix/media-proxy`               | Bug 修复                         | 合并后删除 |
| `refactor/*` | `refactor/unify-media-pipeline` | 重构                             | 合并后删除 |
| `docs/*`     | `docs/claude-setup`             | 文档更新                         | 合并后删除 |
| `release/*`  | `release/v0.2.0`                | 发布准备（版本号变更/CHANGELOG） | 合并后删除 |

## Commit 规范

遵循 [Conventional Commits 1.0.0](https://www.conventionalcommits.org/)。

### 格式

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Type

| Type       | 说明               | 示例                                                         |
| ---------- | ------------------ | ------------------------------------------------------------ |
| `feat`     | 新功能             | `feat(translation): add dual-provider fallback`              |
| `fix`      | Bug 修复           | `fix(media): apply proxy to video download URLs`             |
| `refactor` | 重构（不改变行为） | `refactor(translation): extract pure resolveTranslationView` |
| `test`     | 测试               | `test(parser): add note_tweet edge case coverage`            |
| `docs`     | 文档               | `docs: update dev log for IG actions`                        |
| `style`    | 格式化             | `style: apply eslint autofix`                                |
| `chore`    | 构建/工具          | `chore: bump react-router to v8`                             |
| `perf`     | 性能优化           | `perf(cache): use structuredClone over JSON round-trip`      |

### Scope

Scope 使用模块名或功能名：

- `tweet`, `ig`, `translation`, `translation:ig`, `media`, `cache`, `stores`, `api`, `ui`, `verify`, `docs`, `build`, `deps`

### 规则

- **Description 用英文祈使句** (命令式): `add`, `fix`, `remove`（不用 `added`, `fixed`）
- 首字母小写
- 不加句号
- 不超过 72 字符
- **Breaking change**: footer 中标记 `BREAKING CHANGE: description`

### Commit 纪律

> **先想 commit message，再动工写代码。** 避免"上帝 commit"（一个超大 commit 包含所有变更）。

工作流程：

1. **写代码前**，先用 Conventional Commit 格式确定 commit message（如 `feat(verify): add screenshot verifier with AC-SHOT-001~004`）
2. **围绕这个 message 的范围编写代码**，超出范围的工作留给下一个 commit
3. **当 diff 变大时（>10 文件或 >200 行），主动拆分**为多个独立 commit
4. 每个 commit 应能独立通过检查（typecheck + lint + test）
5. 功能实现、测试、配置修改、文档更新应分开 commit

典型拆分示例（IG 集成）：

```bash
# Commit 1: 类型与路由骨架
git commit -m "feat(ig): add IGPost types and URL detection"

# Commit 2: API 层 + BFF 路由
git commit -m "feat(ig): add SDK integration and /api/ig/get route"

# Commit 3: UI 组件
git commit -m "feat(ig): add InstagramPostCard and 13 sub-components"

# Commit 4: 验证
git commit -m "test(ig): add IG verifier with AC-IG-001~006"

# Commit 5: 文档
git commit -m "docs: update dev log for IG integration"
```

## 代码审查

### PR 流程

1. 创建 PR → 自动运行 CI（Verify + Typecheck + Lint + Test）
2. 至少 1 人 Approve；AI 辅助先进行自动化 Code Review
3. 所有 CI 检查通过
4. Create a Merge Commit 到 `main`

### 审查清单

- [ ] 代码逻辑正确，覆盖边界情况
- [ ] 测试充分（新功能有测试、改动无回归；解析器/纯函数必须单测）
- [ ] 验证套件通过：`bun run verify/index.ts`（相关模块）
- [ ] 遵循代码规范（`bun run lint` 无 error）
- [ ] 无硬编码 Key / Cookie / CDN URL
- [ ] Zustand 用 selector + `useShallow`，无整 store 订阅
- [ ] **UI 变更附带 Storybook story + 渲染测试**（2026-08-19 起强制，见 code-style.md 组件规范；新组件必须配 story，交互/视觉改动必须更新或新增 story）
- [ ] `bun run build-storybook` 通过（UI 变更时）
- [ ] UI 变更附带截图/录屏
- [ ] 相关文档已更新（开发日志、CHANGELOG）

### Merge 策略

- **Create a Merge Commit** — 保留 PR 内每个原子 commit，同时生成 `Merge pull request #N from ...` 合并提交
- 各 commit message 沿用 Conventional Commits 格式
- 若 PR 内含大量 WIP / 格式修正等无意义 commit，先本地 `git rebase -i` 整理为原子 commit 再合并

## AI 协作开发

本项目由 AI 主导开发，使用 `gh` CLI 进行 GitHub 全流程管理。

### gh CLI 常用操作

```bash
# 查阅 Issue/PR
gh issue list --state open
gh issue view 1
gh pr list --state open
gh pr view 1

# 创建与管理
gh pr create --title "feat(verify): add screenshot verifier" --body "$(cat <<'EOF'
## Summary
...

## Verification
- [ ] bun run verify/index.ts --module screenshot 通过
EOF
)"

# Code Review
gh pr diff 1
gh pr review 1 --approve
gh pr review 1 --request-changes --body "需要修改..."
gh pr comment 1 --body "LGTM!"

# PR 状态检查与合并
gh pr checks 1
gh pr merge 1 --merge --delete-branch
```

### AI Code Review 流程

1. **PR 创建后**，AI 自动执行 `gh pr diff` 获取变更
2. **AI 根据审查清单逐项检查**，在 PR 下添加 Review 评论
3. **检测项**：
   - 架构一致性（BFF 边界、`app/lib` vs 组件）
   - 命名规范（是否符合 code-style）
   - 测试覆盖（解析器/纯函数是否有单测）
   - 验证套件（是否有对应 verifier + AC）
   - 安全（API Key / Cookie 处理、`catch unknown`）
   - 边界情况处理
4. **AI Review 结论**：`--approve` / `--request-changes` / `--comment`

## 版本发布

使用语义化版本 [SemVer 2.0.0](https://semver.org/lang/zh-CN/)：

- **MAJOR** (1.x.x) — 不兼容的 API 变更
- **MINOR** (x.1.x) — 向后兼容的功能新增
- **PATCH** (x.x.1) — 向后兼容的 Bug 修复

### 发布步骤

1. 从 `main` 创建 `release/x.y.z` 分支
2. 更新 `CHANGELOG.md`
3. 更新 `package.json` 的 `version` 字段
4. 创建 PR → 合并到 `main`
5. 在 `main` 上打 Tag: `git tag v1.0.0 && git push --tags`
6. GitHub Release: `gh release create v1.0.0 --generate-notes`
7. 走 `docs/engineering/release-checklist.md` 真机验收

## Issue 管理

- Bugs 用 **Bug Report** 模板
- 新功能用 **Feature Request** 模板
- 技术债/重构用 `refactor` label
- 文档改进用 `documentation` label
- 所有 PR 关联对应 Issue（`Closes #123`）

## Git Hooks（lefthook）

`lefthook.yml` 由 `bun install` 时自动安装（postinstall script）。

- `pre-commit`：ESLint autofix（staged files）
- `pre-push`：真实 gate — `typecheck + lint + test + verify`（当前 test 44/44、verify 17 PASS，可正常放行）

手动运行：`bun run lefthook run pre-push`
