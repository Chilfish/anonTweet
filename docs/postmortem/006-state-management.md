# Postmortem 006: Zustand 误用，整 store 订阅与脆弱迁移

- **日期**: 2026-05-31（回溯整理）
- **严重级别**: SEV-2
- **分类**: 缺陷
- **状态**: Mitigated
- **根因归类**: 工具反馈

## 摘要

两个 store（`useAppConfigStore`、`useTranslationStore`）累计 6 次修复，集中在三处：store 迁移丢字段、整 store 订阅导致多余重渲染、拉取新推文后评论区状态不重置。根因是 Zustand 的默认写法鼓励整 store 订阅，而迁移 API 全手写、无类型，`partialize` 与 `version` 对不上就静默丢字段。

## 影响

- 用户可见：`translationMode` 静默重置为默认；切换推文后仍显示上一条的评论。
- 性能：任意设置变动触发 7 个无关组件重渲染。
- 隐藏风险：迁移是定时炸弹，只在用户升级、带着旧 localStorage 加载时触发，开发期很难碰到。

## 时间线

2026-05-31 回溯整理。

| 日期 | commit | 事件 |
| ---- | ------ | ---- |
| 2026-01-22 | `e23f285` | store 持久化迁移，找回 `translationMode` |
| 2026-01-23 | `13a4148` | 拉新推文时重置评论区状态 |
| 2026-04-25 | `2e9e84b` | 修复 zustand 错误使用，7 个组件改 `useShallow` |
| 2026-04-25 | `2e9e8a8` | 模板存储版本升级 |

## 根因分析

1. Zustand 的 `migrate` 用 `any`，`partialize` 的持久化 schema 与迁移函数之间没有类型连接。
2. `translationMode` 原本是顶层字段，`settings` 先存在，晚加的字段没同步更新持久化策略。
3. 迁移只在带旧 localStorage 加载时跑一次，开发期频繁清库，这条路径几乎不被覆盖。
4. `useStore()` 直接返回整个 state，用 selector 需要显式 opt-in，默认写法就是错的。

一句话归纳：Zustand 的默认写法鼓励整 store 订阅和 any 迁移，项目又没有 store 测试策略，两类 bug 都真的发生了。

## 触发条件

store 版本升级后加载旧数据；任意设置变动触发订阅。

## 检测

用户升级后发现设置重置；重渲染问题通过 React DevTools profiling 发现。当时的盲区是没有「序列化 → 升版本 → 反序列化 → 断言字段不丢」的测试。

## 处置

补 `migrate` 把字段搬进 `settings` 并更新 `partialize`；7 个组件统一改为 `useShallow` + 显式 selector。

## 做得对的地方

`useShallow` 修复一次性覆盖全部 7 个文件，没有留下滴漏式跟修。

## 行动项

### 缓解

- [x] 7 个组件改为 selector + `useShallow`（维护者）
- [x] 补 `migrate` 与 `partialize`，找回 `translationMode`（维护者）

### 预防

- [ ] 补 store 迁移测试助手 `testMigration(oldState, newVersion, expected)`（维护者；判据：每次升版本都有迁移测试）
- [ ] ESLint 禁止无 selector 的整 store 订阅（维护者）
- [ ] `migrate` 签名去掉 `any`，改为类型化 `OldState → NewState`（维护者）
- [ ] 写 `docs/zustand-conventions.md`：用 selector、测迁移、改 schema 必升 version（维护者）

## 教训

永远用 selector，不用整 store 订阅。改 persist schema 必须升 version 并配迁移测试，否则丢字段是静默的。

## Changed Files

```
app/lib/stores/translation.ts
app/lib/stores/appConfig.ts
app/lib/stores/hooks.ts
app/components/ThemeProvider.tsx
app/components/settings/AITranslationSettings.tsx
app/components/settings/GeneralSettings.tsx
app/components/settings/SeparatorTemplateManager.tsx
app/components/settings/ThemeSwitcher.tsx
app/components/settings/TranslationDictionaryManager.tsx
app/components/tweet/TweetOptionsMenu.tsx
app/routes/tweet.tsx
```

## 关联报告

- #002 翻译系统：同一类 store 迁移丢字段
