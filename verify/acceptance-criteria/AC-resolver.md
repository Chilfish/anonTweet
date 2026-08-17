# Translation View Resolver 收敛验收标准

> 版本：1.0 | 日期：2026-08-17
> 关联 Postmortem：002（翻译逻辑耦合）、009（index 对齐合并四处漂移）
> 关联 Review：2026-08-17 P2-3（决策链四处重复）
> 执行命令：`bun run verify/index.ts --module resolver` / `--ac AC-RESOLVER-001`

---

## AC-RESOLVER-001：三处选择链收敛为单一纯函数实现

### 背景

「手动翻译 > 新版 AI（`entities[].aiTranslation`）> 旧版 AI（`autoTranslationEntities`）> 原文」
这个选择链历史上在多个位置各写一遍：

1. `app/lib/translation/resolveTranslationView.ts`（显示层规范决策链，已收敛）
2. `app/hooks/use-translation-editor-logic.ts`（编辑器 A：`prepareInitialEntities` 优先级 A/B/C）
3. `app/hooks/use-alt-translation-logic.ts`（编辑器 B：`initializeEditor` 逐实体回填）

三处一旦漂移即复发 postmortem #009 类数据不一致。本 AC 强制其收敛为
`app/lib/translation/resolveEntities.ts` 的单一纯函数 `deriveManualTranslation`。

### 验证对象

- `deriveManualTranslation(base, { manual, legacyAI }, opts?)`（`app/lib/translation/resolveEntities.ts`）
- `app/hooks/use-translation-editor-logic.ts` / `app/hooks/use-alt-translation-logic.ts`（源码扫描）

### 语义契约（单一实现必须满足）

对每个实体按下列优先级取 `translation` 字段，返回新数组（不改入参）：

1. **手动翻译**（`manual`，按 `index` 匹配）：命中且 `translation` 非空 → 取之
2. **新版 AI**（实体自带的 `aiTranslation`）→ 取之
3. **旧版 AI**（`legacyAI` 按 `index` 匹配：`aiTranslation || translation || text`）→ 取之
4. **原文**（无任何命中）→ 不写 `translation`（保持原实体）

`opts.types` 可选：仅对指定类型实体计算，其余原样返回（Alt 编辑器只处理 `media_alt`）。

### Pass 条件

- **P1 单一实现（源码扫描）**：两个 hook 源码必须 import 并调用 `deriveManualTranslation`，
  且不得包含独立实现的选择链特征片段（按 index `find` + 多级 `||` 回退的翻译取值逻辑）。
- **P2 语义正确（单元测试）**：单元 spec 断言上述 4 级优先级的各分支结果（manual 命中覆盖
  ai / ai 回退 / legacy 回退 / 无命中保持原文；`opts.types` 过滤；输入不被修改）。
- **P3 三处一致（一致性断言）**：给定同一实体与同一来源，两个 hook 经共享函数得到的
  `translation` 与显示层 `resolveTranslationView` 的决策（manual > ai > original，AC-TRANS-005
  已覆盖 view 层）语义一致；spec 用同一 fixture 断言编辑器侧结果与
  `mergeEntityTranslationsByIndex` / `resolveTranslationView` 场景一致。

### 验收命令

```bash
bun run verify/index.ts --ac AC-RESOLVER-001   # 单一 AC
bun run test                                   # 全量门禁（unit + acceptance）
```

---

## 总计：1 条 AC

| AC             | 分类   | 依赖 AI | 依赖 Fixture |
| -------------- | ------ | ------- | ------------ |
| AC-RESOLVER-001 | 纯函数 + 仓库级静态检查 | 否 | 否 |