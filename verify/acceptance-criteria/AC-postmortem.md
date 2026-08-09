# Postmortem 预发布检查验收标准

> 版本：1.0 | 日期：2026-08-09
> 对应 Postmortem：S10 工具化（`docs/postmortem/README.md` Pre-Release 检查）
> 关联 Verifier：`verify/modules/postmortem.verifier.ts`
> 执行命令：`bun verify --module postmortem [--ac AC-PM-NNN]`
>
> 配套脚本：`bun run scripts/postmortem-check.ts <base-ref> <head-ref>` —— git 改动文件与各报告 Changed Files 交叉比对，重叠 → WARN（提示复查预防措施），解析失败 → FAIL。

---

## AC-PM-001：报告目录完整

- **验证对象**：`docs/postmortem/`
- **Pass 条件**：
  - 编号报告 `001`~`008` 文件齐全（`0NN-*.md`）
  - 存在 `README.md`（索引）与 `TEMPLATE.md`（沉淀模板）

---

## AC-PM-002：每份报告含状态字段

- **验证对象**：8 份编号报告 frontmatter
- **Pass 条件**：每份报告含 `**状态**: Active | Mitigated`（用于区分可复发/已预防）

---

## AC-PM-003：每份报告含 Changed Files 块

- **验证对象**：8 份编号报告
- **Pass 条件**：每份含 `## Changed Files` + 代码块，且能解析出 ≥ 1 个文件路径（S10 脚本交叉比对的数据源）

---

## AC-PM-004：README 索引覆盖全部报告

- **验证对象**：`docs/postmortem/README.md`
- **Pass 条件**：索引表引用 `001`~`008` 全部编号，无遗漏

---

## AC-PM-005：高危文件表引用一致

- **验证对象**：`docs/postmortem/README.md` 高危文件表
- **Pass 条件**：表中引用的报告编号（`#001` 等）均存在于索引

---

## AC-PM-006：S10 脚本存在

- **验证对象**：`scripts/postmortem-check.ts`
- **Pass 条件**：文件存在且包含 `Changed Files` 解析逻辑

---

## AC-PM-007：S10 脚本可运行

- **验证对象**：`scripts/postmortem-check.ts` 执行
- **Pass 条件**：以默认 `main HEAD` 运行，输出 `RESULT: PASS` 或 `RESULT: FAIL`（脚本自身冒烟测试）

---

## 总计：7 条 AC

| AC        | 分类     | 依赖外部服务   |
| --------- | -------- | -------------- |
| AC-PM-001 | 静态检查 | 否             |
| AC-PM-002 | 静态检查 | 否             |
| AC-PM-003 | 静态检查 | 否             |
| AC-PM-004 | 静态检查 | 否             |
| AC-PM-005 | 静态检查 | 否             |
| AC-PM-006 | 静态检查 | 否             |
| AC-PM-007 | 冒烟测试 | 否（git 本地） |
