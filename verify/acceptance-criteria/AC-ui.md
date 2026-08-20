# UI 视觉验证与可访问性基线验收标准

> 版本：1.0 | 日期：2026-08-19
> 对应 Postmortem：003（UI 样式/布局：无视觉回归测试）
> 关联评审：`docs/reviews/review-2026-08-19-tweetcard-storybook-critique.md`（P1-2）
> 执行命令：`bun run verify/index.ts --module ui` / `--ac AC-UI-VISION-001` / `--ac AC-UI-A11Y-001`

---

## AC-UI-VISION-001：每个被使用的组件都有 Storybook story

- **背景**：111 个组件文件只有 4 个 story（评审 P1-2 实测），「还原官方渲染」无视觉证据。
  阶段二主线 = 组件 Storybook 全覆盖 + 视觉验证 + 自动化场景用例（所有者裁定，2026-08-19）。
- **输入**：`app/components/{tweet,ins,translation,settings,ui}/*` 组件清单与
  `app/stories/*.stories.tsx` 清单
- **验证方法**：静态盘点（`test/acceptance/ac-ui.spec.ts`）——tweet 目录评审清单 14 组件
  逐一核对 story 文件存在且非空；ins/translation/settings/ui 所有**在用**组件按「被使用即
  覆盖」核对（有独立 story 文件或被某 story 渲染引用）；story 文件总数 ≥ 18。
- **Pass 条件**：
  - 14 个评审清单组件（TweetCard / TrendingCard / TweetHeader / TweetTextBody /
    TweetMediaAlt / TweetOptionsMenu / PlainTweet / TweetNode / SelectableTweetWrapper /
    TweetInputForm / CommentBranch / ThreadLine / FilterUnrelatedToggle / AIVisionBlock）
    每个都有对应 `app/stories/<Name>.stories.tsx`
  - ins 14 组件全被覆盖（InstagramPostCard/IGActionBar/IGCardHeader/IGMediaGrid/
    IGMusicInfo/IGPostSkeleton 由 InstagramPostCard.stories.tsx，其余 8 个由
    IGCaption/IGHeader/IGHeaderActions/IGTranslateDialog/InsLogo/PlainIGPost stories）
  - translation 在用 10 组件（TranslationActions + TranslationEditors 两个 bundle）
  - settings 在用 8 组件（含 Settings.stories.tsx 既有）
  - ui 在用 22 原语（`ui-primitives.stories.tsx` bundle）
  - 每个 story 至少包含一个场景（默认/加载/错误/空态/官方对照/自身优化之二）
  - 交互/视觉类改动（2026-08-19 起）必须附带 story 或渲染测试（code-style 强制项）
- **开放问题**：`MyTweet`（`Tweet.tsx`）由 `CommentBranch` 覆盖其渲染路径，是否单列 story
  由覆盖盘点（阶段二第 4 周）决定；新建/重构组件后 AC 的「在用清单」需同步增补。

---

## AC-UI-A11Y-001：a11y 基线配置 + 已知违规修复

- **背景**：Trending 主图 `alt={trending.title}` 与同卡 h3 重复朗读（评审 P1-2 点名），
  加结构里元素无错误态占位。
- **输入**：`.storybook/main.ts` / `.storybook/preview.tsx` / 组件源码
- **验证方法**：静态检查（`test/acceptance/ac-ui.spec.ts`）：
  - a11y addon 已注册（`@storybook/addon-a11y` 在 addons 列表）
  - preview 配置了 `parameters.a11y`（axe 检查开启，`test: 'todo'` 或 `'error'`；
    阈值收紧为 CI 硬失败待所有者拍板，见 review 开放问题 3）
  - Trending 主图 `alt=""`（装饰图，标题 h3 承载可访问名称）→ 消除重复朗读
  - 头像组 `alt=""`（装饰元素）不参与读屏
  - 图标按钮带可访问名（`sr-only` 文本：TweetOptionsMenu 更多选项 / AIVisionBlock
    生成编辑 / 折叠细条 title 属性）
- **Pass 条件**：上述源码级断言全过；`bun run build-storybook` 零报错；
  交互验证（axe 实测零 violation）并入视觉基线任务（review 阶段二 item 4）。

---

## 总计：2 条 AC

| AC               | 分类     | 依赖外部 API | 依赖 AI |
| ---------------- | -------- | ------------ | ------- |
| AC-UI-VISION-001 | 静态盘点 | 否           | 否      |
| AC-UI-A11Y-001   | 静态检查 | 否           | 否      |

> 离线 AC（无服务器无 key）。Storybook 构建检查：`bun run build-storybook`，
> 已并入 pre-push 门禁（lefthook.yml，2026-08-19）。
