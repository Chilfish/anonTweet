# 搜索页验收标准

> 版本：1.1 | 日期：2026-11-18
> 背景：搜索页在没有关键词时只有一个空态，缺少回访与起步入口；页面主体也没有容器与移动端留白。
> 关联 Verifier：`test/unit/search-history.spec.ts`、`test/acceptance/search-history-render.spec.ts`、`test/acceptance/search-layout.spec.ts`
> 执行命令：`bunx vitest run --project unit --project acceptance test/unit/search-history.spec.ts test/acceptance/search-history-render.spec.ts test/acceptance/search-layout.spec.ts`

---

## AC-SEARCH-001：最近搜索与语法示例

- **输入**：`app/lib/storage/searches.ts`、`RecentSearches`、搜索页空态
- **预期输出**：提交过的关键词可一键重搜；首次使用时给出可点击的语法示例
- **Pass 条件**：
  - 提交搜索时写入 IndexedDB；同一关键词去重并刷新时间；保留上限 `SEARCH_HISTORY_LIMIT`（20）
  - 搜索页无 `q` 时展示最近搜索（最多 10 条）；点击直接以该关键词重搜；提供「清除」
  - 无历史时展示 3 个语法示例（`from:` / `#` / `lang:`），点击只填入输入框，不直接发起搜索
  - 空关键词不写入；历史只存本机，不上报

## AC-SEARCH-002：搜索页布局与状态

- **输入**：`/search` 在 320 / 390 / 1440 宽度下的渲染结果
- **预期输出**：搜索区是一个实心表面，结果与状态清楚，移动端无横向溢出
- **Pass 条件**：
  - 搜索输入、热门/最新、高级搜索合并在同一张 `bg-card` 实心卡片内，不使用半透明卡片
  - 页面主体 `max-w-[600px]`，移动端保留 `px-3` 左右留白，与结果卡片宽度对齐
  - 高级语法按「语法 + 说明」成对展示，点击只插入输入框；不再只有「来自 @」这类无语法标签
  - 有结果时展示已加载条数；搜索失败提供「重试」，无结果提供「清空关键词」
  - 结果操作条在窄屏允许换行；共享 Hero 文案在 320 宽度下不撑出视口

---

## 变更约定

- 最近搜索与「最近查看」共用同一 IndexedDB 数据库，迁移通过版本号 upgrade 增量创建 store
- 示例关键词只作为语法模板，不伪装成推荐内容或热门数据
