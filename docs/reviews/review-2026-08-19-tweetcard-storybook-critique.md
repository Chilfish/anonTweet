# TweetCard 组件 Apple 视角锐评与行动计划（2026-08-19）

> 依据：CLAUDE.md / docs/INDEX.md / planning/backlog.md（2026-08-17 版）/ planning/architecture.md / planning/project-architecture.md / postmortem/README.md / features/{translation,instagram,ai-vision,tweet} / engineering/{code-style,git-workflow} / 代码审计（`app/components/tweet/TweetCard.tsx`、`app/lib/SmartPool.ts`、`resolveTranslationView.ts`、`app/components/ui/media.tsx`、`app/types/{card,tweet}.ts`）及验证套件实测（`test/acceptance/ac-card.spec.ts`、`ac-perf.spec.ts`、`.storybook/main.ts`、`app/stories/`）。
>
> 评审对象：`app/components/tweet/TweetCard.tsx`（TweetLinkCard + TrendingCardView，264 行）。所有者三项裁定：① 外链离开匿名环境提示**不做**；② 下一阶段主攻**组件 Storybook 全覆盖 + 视觉验证 + 自动化场景用例**（还原官方 + 自身优化）；③ jetfuel 解析改版**直接回退普通卡**，靠用户反馈驱动后续更新解析器。

## 1. 执行摘要

- **P1 验证造假**：AC-CARD-005 文档声称「Storybook / 单测快照驱动」（AC-card.md L68-77、L92），实测是 `read(FILES.card)` 源码字符串扫描（ac-card.spec.ts L93-106），且 `app/stories/` 下根本没有 TweetCard 的 story——验收标准与实现名实不符。
- **P1 视觉验证空心**：全仓 111 个组件文件（glob 实测 `app/components/**/*.tsx`）只有 4 个 story 文件（Settings / settings-layout / TweetCompoments / InstagramPostCard）；Storybook 全家桶（chromatic / addon-vitest / addon-a11y）已装（`.storybook/main.ts` L8-13、package.json L74-81）却近乎闲置；`test/` 下唯一组件渲染是 ac-perf 的 MyPlainTweet SSR，零交互测试、零视觉回归——postmortem #003 雷区（无视觉回归测试）未实质解除。
- **P1 架构**：jetfuel 是「not a stable schema」的私有不稳定格式（development-log 2026-08-18 L68），渲染层无行为锁定；**已按所有者裁定降级：解析失败回退普通卡 + 用户反馈驱动**——降级路径结构上存在（TweetCard.tsx L231），但「回退」本身无组件级测试。
- 外链隐私（原会议稿 P1-3）经所有者裁决**不做**，移入不做清单。
- 亮点（事实）：AC-CARD-001~004 是真 fixture 驱动的解析器测试；`useProxyMedia`/语义 token/懒加载符合 AC-PERF-001；Storybook 基建（chromatic + vitest + a11y）已就位——差的只是**用起来**。
- 三阶段：1-2 周止血（验证诚信 + 测试基建）→ 3-6 周核心体验（Storybook 全覆盖 + 视觉基线，主线）→ 7-8 周+ 护城河（闭环 + 规模化 + story 入门禁）。

## 2. 评价框架（8 条检验标准）

| # | 标准 | 探针问题 |
|---|------|---------|
| 1 | 聚焦减法 | 每条渲染分支服务哪个真实场景？「还原官方」有无测试锁定？ |
| 2 | 端到端拥有 | card/trending 从解析到渲染到截图是否单一路径、无重复管线？ |
| 3 | 工艺细节 | 空态/错误态/加载态/键盘可达是否达交付级？ |
| 4 | 隐私信任 | 出站路径与「匿名」承诺是否一致？（本期经裁决不处理） |
| 5 | 性能预算 | 卡片图在长链/截图路径是否按预算懒加载？ |
| 6 | 测试纪律 | 每个用到的组件有无 story？AC 验证方法是否名实相符？ |
| 7 | 复杂度税 | 私有格式依赖有没有降级路径与测试？ |
| 8 | 流程责任 | 组件目录守强制规范（barrel）？storybook 是否纳入门禁？ |

## 3. 锐评报告（P1 → P3）

### P1-1 验证造假：AC-CARD-005 的「视觉回归」是源码扫描，组件零渲染测试

- 【问题】项目把 verify 当护城河（ADR-007、CLAUDE.md 规则 2），但处于 postmortem 热点区（`Tweet.tsx` 13 次 fix、#001/#003）的链接卡片组件，验收 AC 用源码扫描冒充渲染断言。
- 【证据】`test/acceptance/ac-card.spec.ts` L93-106：`read(FILES.card)` 后 `expect(src).toContain('aspect-[18/10]')` 等字符串断言；AC-card.md L68-77 自称验证方法为「Storybook / 单测快照断言结构类名与内容」、L92 声称「由 Storybook 或组件快照测试驱动」；`app/stories/` 实测 4 个文件，无任何 TweetCard / TweetLinkCard / TrendingCardView 的 story。
- 【影响】P1（标准 6/8）：改坏卡片布局（遮罩层级、圆角、头像溢出）门禁照绿；「verify 全绿」在此失真——正是 #003 二十次单行 CSS fix 的复发土壤。
- 【Apple 会怎么做】标准 6：声称的覆盖必须是真实覆盖——source scan 就叫 source scan，不许叫组件渲染；UI 工程以可运行的测试工件为准，不以注释声称。
- 【建议】① 新增 `test/acceptance/card-render.spec.ts`：`renderToString(createElement(TweetLinkCard, { tweet: jetfuelFixture }))`，断言 HTML 含 `aspect-[18/10]`、`line-clamp-3`、趋势 URL href、alt；损坏 payload 用例断言回退渲染普通卡布局；② 同批补 `app/stories/TweetCard.stories.tsx`（large / horizontal / trending / 无卡 / 解析失败回退五态）。验证：`bun run test && bun run verify/index.ts --exit-on-fail`。
- 【成本】1-1.5 人日 / 风险低 / 收益：命门组件首次拥有行为锁定。

### P1-2 视觉验证空心：111 组件仅 4 stories，Storybook 基建装了不用

- 【问题】产品卖点是「还原 Twitter 官方渲染 + 自身优化」（TweetCard.tsx L113-117 注释、trending-card.md 全篇、backlog L48），但支撑该主张的视觉证据近乎为零——产品定位与工程能力的结构性缺口。
- 【证据】glob 实测 `app/components/**/*.tsx` 111 个文件；`app/stories/` 仅 4 个 story，其中 TweetCompoments.stories.tsx 只有 TweetSkeleton（L1-18）；Storybook 的 chromatic / addon-vitest / addon-a11y 已装（`.storybook/main.ts` L8-13）却一个组件测试都没写；`test/` 下组件渲染仅有 ac-perf.spec.ts L74 的 MyPlainTweet SSR，无交互、无视觉、无 a11y 断言（grep `@testing-library|fireEvent|act(` 零命中）。
- 【影响】P1（标准 6/3）：「还原官方」无法举证、无法防回归；a11y 缺口（Trending 主图 alt 与 h3 标题重复朗读）长期无测试拦截。
- 【Apple 会怎么做】标准 6：设计资产与视觉回归是工程资产的一部分——每个组件都有设计评审与自动化视觉基线，官方对照是验收的输入而非口号。
- 【建议】执行所有者既定方向：以「每个用到的组件都有 story + 场景矩阵 + 视觉基线」为阶段二主线（见行动计划）；先修点：Trending 卡主图 `alt={trending.title}` 与同卡 h3 重复（screen reader 读两遍），改为 `alt=""` + aria-hidden 或保留一者。
- 【成本】见阶段二排期 / 风险低 / 收益：UI 从「口说还原」变为「可验证还原」。

### P1-3 jetfuel 依赖不稳定私有格式；回退策略已定但回退路径未测

- 【问题】trending 卡数据来自 X 私有二进制 payload（官方文档措辞「not a stable schema」，development-log 2026-08-18 L68），渲染层无行为锁定。**（所有者裁定：改版就回退普通卡，用户会感知并反馈，后续再更新解析程序——降级策略成立，但「回退」必须被测。）**
- 【证据】trending-card.md L93-102：解析失败保留 unified_card 结果 + `obsLog('jetfuel.parse.fallback')`；组件 L231 `card?.trending` 存在才走 TrendingCardView，否则自然落普通卡路径——结构上已支持回退；但全仓无任何测试断言「trending 缺失/损坏时组件渲染普通卡布局」。
- 【影响】P1（标准 7）：降级策略是人肉保证的；回退逻辑在代码里，却没被任何 AC 锁住。
- 【Apple 会怎么做】标准 7：对不稳定外部依赖，降级路径与主路径同等对待——Apple 对网络降级（无网络/无服务）有完整测试矩阵。
- 【建议】P1-1 的 `card-render.spec.ts` 增加两用例：① 无 `trending` 字段 → 断言渲染普通链接卡（无 `aspect-[18/10]`）；② `trending` 存在但 `imageUrl` 缺失 → 断言不塌陷（无图纯文卡或占位盒）。验证：`bun run test`。**无需「官方改版巡检」专项——按裁定取消该计划项，靠用户反馈闭环。**
- 【成本】0.5 人日 / 风险低 / 收益：降级承诺从口头变为测试。

### P2-1 强制规范自打脸：14 文件的 tweet 目录无 barrel index.ts

- 【问题】code-style.md L48 强制「3+ 文件的组件目录必须有 index.ts」，`app/components/tweet/` 14 个文件无 index.ts。
- 【证据】glob 实测无 `app/components/tweet/index.ts`；`app/components/ins/index.ts` 存在作对照；`PlainTweet.tsx` L14、`TweetNode.tsx` L16 均裸路径 `from './TweetCard'`。
- 【影响】P2（标准 8）：规范失信；目录无统一出口，新增组件无法收敛。
- 【建议】补 `app/components/tweet/index.ts` 导出全部 14 组件；顺带将 `TrendingCardView` 拆出为 `TrendingCard.tsx`（现 264 行单文件承载 6 个职责）。验证：`bun run lint && bun run typecheck`。

### P2-2 媒体管线一文件三套：原生 img / MediaImage / 自管 error

- 【问题】同一文件内：头像用原生 `<img>` 无错误处理（L165-171）；主图用 `MediaImage`（自带 loading/error fallback，L55/L132）；`CardImage` 再自管 `isError` 且错误时整块 `return null`（L41-46）——错误态三种行为。
- 【证据】`app/components/ui/media.tsx` L81-141 已统一三态并支持 `errorFallback`；TweetCard L44-46 在其上再包一层 error 判定，大图分支错误时整块塌陷。
- 【建议】删除 `CardImage` 自管 error，改传 `errorFallback` 占位块；头像改用 `MediaImage`。验证：渲染断言错误态仍有占位盒。

### P3-1 双重截断 + 代理对风险

- 【问题】`truncateText`（L13-18，魔数 120/200）与 `line-clamp-2/3`（L89/98/155/186）重复做工；`slice` 按码元截断可切坏 emoji 代理对。
- 【建议】移除 `truncateText`，纯靠 CSS clamp；title 用 `title` 属性承载全文。成本：低。

### P3-2 其余打磨

- L205-208 `isLargeImageCard` 对 `unified_card` 一律 `aspect-[16/9]`，与官方 1.91:1 不一致（trending 才用 18:10）。
- L231 `card?.trending` 判断位于 L226 `cardData` 早退之后——依赖「trending 非空 ⇒ title/image 非空」的合并不变量，建议把 trending 分支提前至早退之前。
- L175-179 `•{trending.postsCount}` 无间距；L146 `key={cat}` 分类键可重复。

## 4. 行动计划（所有者裁决后修订）

### 阶段一（1-2 周）止血：验证诚信 + 测试基建就位

| 任务 | 文件 | 验证 |
|---|---|---|
| AC-CARD-005 换真渲染测试 + TweetCard 五态 Storybook（P1-1/P1-3） | `test/acceptance/card-render.spec.ts`、`app/stories/TweetCard.stories.tsx` | `bun run test && bun run verify/index.ts --exit-on-fail` |
| Storybook 全量启用：chromatic 接入 + addon-a11y 配置 + 测试运行器脚本 | `.storybook/main.ts`、package.json scripts、`bun run build-storybook` 入 CI | `bun run build-storybook` 零报错 |
| tweet 目录 barrel + 拆 `TrendingCard.tsx` + 媒体错误态统一（P2-1/P2-2） | `app/components/tweet/index.ts`、`TrendingCard.tsx`、`TweetCard.tsx` | `bun run lint && bun run typecheck` |

验收：`bun run test` 全绿且新增 ≥4 组件渲染用例；`bun run build-storybook` 通过并入 pre-push。

### 阶段二（3-6 周）核心体验：组件 Storybook 全覆盖 + 视觉基线（主线）

**目标**：每个用到的组件都有 story + 场景矩阵 + 视觉基线；UI 从「口说还原」到「可验证还原」。

1. [ui] **tweet 目录 14 组件逐一生成 story**（TweetCard / TrendingCard / TweetHeader / TweetTextBody / TweetMediaAlt / TweetOptionsMenu / PlainTweet / TweetNode / SelectableTweetWrapper / TweetInputForm / CommentBranch / ThreadLine / FilterUnrelatedToggle / AIVisionBlock），对标场景矩阵：
   - 数据态：默认 / 加载 / 错误 / 空（无卡、无媒体、无翻译）
   - 推特官方对照：用 `cache/trending.html` + 真实 jetfuel fixture 作视觉输入
   - 自身优化：翻译可见性（原文/译文/双语）、暗色模式、移动端宽度、长文（15 条线程 fixture）
   - a11y：addon-a11y 断言（修复主图 alt 重复朗读）
2. [ui] **ins 目录补全 13 组件 story**（已有 InstagramPostCard / IGMediaGrid 基础，补齐 IGCaption / IGActionBar / IGHeader / PlainIGPost / IGMusicInfo 等），场景同矩阵。
3. [ui] translation / settings / ui（media / empty / skeleton / preview-card 等在用原语）按「被使用即覆盖」原则补 story，按目录分批。
4. [refactor] 视觉基线：chromatic 或本地 `build-storybook` + 截图对比基线接入 CI（新增 AC：AC-UI-VISION-001「每组件 ≥1 story」+ AC-UI-A11Y-001「a11y addon 零 violation」）。
5. [ux] backlog L26 剩余：AI 端点 stream 化（并入编辑器兼容 stream，阶段三合并执行）。

### 阶段三（7-8 周+）护城河：闭环与规模化

- AI Vision 截图导出 E2E 闭环（`plain.tsx` + `AIVisionBlock`）；Editor 兼容 stream（`TranslationEditor.tsx` + `resolveTranslationView.ts` `isAIStream` 扩展）。
- Instagram Story 接入（先写 `AC-IG-STORY` + fixture 再实现；SDK 已验证）。
- 三层缓存规模化与命中率报表（前置：阶段二可观测）。
- Storybook 用例纳入 `bun run verify/index.ts --module ui` 门禁；组件新增必须伴随 story（写入 code-style.md 强制规范 + PR 审查清单，见 §4 文档动作）。

### 文档动作（本次评审同步落盘）

- `docs/engineering/code-style.md`：组件规范新增「每个用到的组件必须有 Storybook story；交互/视觉改动必须补 story 或渲染测试」。
- `docs/engineering/git-workflow.md`：PR 审查清单新增「UI 变更附带 Storybook story + `bun run build-storybook` 通过」。
- `docs/reviews/README.md`：索引表登记本评审。
- `docs/development-log/2026-08-19.md`：本日补记评审会话。
- `docs/planning/backlog.md`：裁决更新（见下）。

### 不做清单（减法，Apple 式）

| 条目 | 裁决 | 理由 |
|---|---|---|
| 外链离开匿名环境提示/设置项 | **删除（所有者裁定）** | 「外链这件事不用管它」——2026-08-19 决策 |
| jetfuel 官方改版巡检专项 | **删除（所有者裁定）** | 改版回退普通卡 + 用户反馈驱动更新，不设巡检 |
| Threads / Bluesky 新数据源 | 删除 | 定位未决前一律不接 |
| Bili 功能扩展 | 延后（无限期） | 保持隐藏自用，仅卫生化 |
| 编辑器 stream 单独立项 | 延后（并入 L26） | 与 AI 端点流式化合并 |
| 视觉模型训练/微调 | 删除 | ai-vision.md §1.3 非目标 |

### Backlog 未决条目逐条裁决

| 原条目 | 裁决 |
|---|---|
| GET 与 AI 翻译解耦 + AI 端点流式化（L26 剩余） | 采纳 → 阶段二 stream 部分（与 L25 合并，阶段三执行） |
| AI Vision 截图导出 E2E | 采纳 → 阶段三 |
| 编辑器兼容 stream（L25） | 采纳 → 阶段三（并入流式化） |
| IG Story（L20） | 采纳（延后）→ 阶段三，先写 AC + fixture |
| 三层缓存规模化 | 采纳 → 阶段三，前置可观测已就绪 |
| 阶段一五项 + L19/L26 前半 + jetfuel/uniified_card | 已完成 ✅（2026-08-17 ~ 08-19） |
| **新增：组件 Storybook 全覆盖 + 视觉基线 + a11y 门禁** | **采纳 → 阶段二主线（本文件 P1-2）** |
| **新增：外链隐私披露** | **删除 → 不做清单（所有者裁定）** |
| **新增：jetfuel 回退渲染测试** | **采纳 → 阶段一（随 P1-1 实现）** |

## 5. 反方自审与开放问题

### 自审（唱反调）

1. 「视觉验证空心」是否过重？——IG 集成阶段确实产出过 14 个 story（instagram-integration.md L123），说明基建曾有用；批评指向的是**覆盖没有制度化、随重构流失**，而非「从没做过」。
2. AC-CARD-005 的 source scan 至少锁住了变体存在与关键类名，成本极低，对个人项目是合理折中——批评限定在「文档声称渲染/快照却未兑现」。
3. jetfuel 降级主张可能低估用户反馈延迟——回退普通卡后用户可能不报、直接弃用；但这是所有者的产品判断，尊重之。
4. 把 Storybook 全覆盖排进 6 周主线，工作量可能被低估（111 组件 × 场景矩阵）；按「被使用即覆盖」分批砍范围，第 4 周做一次覆盖率盘点再决定是否压缩。

### 开放问题（需所有者拍板）

1. 视觉基线形态：chromatic 云服务（付费、零维护）vs 本地 `build-storybook` + 截图 diff（免费、需维护基线库）？
2. Storybook 全覆盖范围边界：「被使用」定义为何？仅 `app/components` 在用组件，还是含 routes 级组合（MyPlainTweet / TweetInputForm 整页场景）？
3. a11y 门禁阈值：addon-a11y 是否设为 CI 硬失败，还是仅告警？
4. 组件新增 story 是否作为强制规则写入 CLAUDE.md 与 PR 审查清单（git-workflow.md L105-114）？

---

**验证自评**：每项评级均可在 10 分钟内复核（文件 + 行号已给）；唯一不可复现项是「chromatic 是否绑定付费账号」。