# 搜索页验收标准

> 版本：1.0 | 日期：2026-11-18
> 背景：搜索页在没有关键词时只有一个空态，缺少回访与起步入口。
> 关联 Verifier：`test/unit/search-history.spec.ts`、`test/acceptance/search-history-render.spec.ts`
> 执行命令：`bun verify --module search [--ac AC-SEARCH-NNN]`

---

## AC-SEARCH-001：最近搜索与语法示例

- **输入**：`app/lib/storage/searches.ts`、`RecentSearches`、搜索页空态
- **预期输出**：提交过的关键词可一键重搜；首次使用时给出可点击的语法示例
- **Pass 条件**：
  - 提交搜索时写入 IndexedDB；同一关键词去重并刷新时间；保留上限 `SEARCH_HISTORY_LIMIT`（20）
  - 搜索页无 `q` 时展示最近搜索（最多 10 条）；点击直接以该关键词重搜；提供「清除」
  - 无历史时展示 3 个语法示例（`from:` / `#` / `lang:`），点击只填入输入框，不直接发起搜索
  - 空关键词不写入；历史只存本机，不上报

---

## 变更约定

- 最近搜索与「最近查看」共用同一 IndexedDB 数据库，迁移通过版本号 upgrade 增量创建 store
- 示例关键词只作为语法模板，不伪装成推荐内容或热门数据
