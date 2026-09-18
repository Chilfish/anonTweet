# Postmortem 索引

本目录记录这个项目踩过、且值得再次提醒的坑。写代码前先过一遍，尤其是「高频雷区」和「高危文件」。

原则是 blameless：不追谁写错了，只追什么系统条件让它发生，然后修条件。报告格式见 [TEMPLATE.md](TEMPLATE.md)。001~008 是 2026-05-31 从 git 历史回溯整理的，009 起为事后及时记录。

覆盖范围 2025-09 至 2026-09，共 12 份。

| #                                                         | 主题             | 严重级 | 分类         | 状态         | 一句话根因                                                      |
| --------------------------------------------------------- | ---------------- | ------ | ------------ | ------------ | --------------------------------------------------------------- |
| [001](001-twitter-content-parsing.md)                     | Twitter 推文解析 | SEV-2  | Architecture | 🔴 Active    | `parseTweet.ts` 无测试、无内部分层，每次改动风险全局            |
| [002](002-translation-system.md)                          | 翻译系统         | SEV-2  | Architecture | 🔴 Active    | 翻译逻辑全部耦合在 React 组件内，store 迁移静默丢数据           |
| [003](003-ui-styling-layout.md)                           | UI 样式/布局     | SEV-3  | Bug          | 🟡 Active    | 20 次单行 CSS fix，无 design token，无视觉回归测试              |
| [004](004-build-configuration.md)                         | 构建配置         | SEV-2  | Change       | 🟢 Mitigated | 客户端/服务端边界不清，`lib/` 无 import 约束                    |
| [005](005-media-handling.md)                              | 媒体管线         | SEV-2  | Architecture | 🔴 Active    | 代理/视频/截图四套重复 URL 转换逻辑                             |
| [006](006-state-management.md)                            | 状态管理         | SEV-2  | Bug          | 🟢 Mitigated | zustand 整 store 订阅 + 无类型迁移                              |
| [007](007-instagram-integration.md)                       | Instagram 集成   | SEV-3  | Change       | 🔴 Active    | 新功能无验收清单、无测试 fixture                                |
| [008](008-fonts-and-rendering.md)                         | 字体/渲染        | SEV-2  | Bug          | 🟢 Mitigated | Web font 加载与 headless 截图竞争                               |
| [009](009-prepend-persistence.md)                         | 翻译句首补充     | SEV-2  | Bug          | 🟡 Active    | index 对齐合并四处漂移，base 外实体（-1/30000+）被静默丢弃      |
| [010](010-babel-major-drift.md)                           | 依赖/Babel 构建  | SEV-3  | Dependency   | 🟢 Mitigated | preset 越过 core 主版本 + 门禁不跑生产构建，`.tsx` 全量构建失败 |
| [011](011-verification-honesty.md)                        | 验证诚信         | SEV-3  | Process      | 🟢 Mitigated | AC 空跑报绿 / 静态扫描冒充行为 / dev 模式泄漏，门禁不携带信号   |
| [012](012-mobile-adaptation-and-scroll-lock-ownership.md) | 移动端适配       | SEV-3  | Process      | 🟢 Mitigated | 断点列表冒充移动端适配；手写滚动锁与浮层原语抢归属              |
| [013](013-upstream-frontend-drift.md)                     | 上游前端漂移     | SEV-2  | Dependency   | 🟡 Active    | 只认单一页面解析 webpack chunk map，上游换 bundler 即全站硬失败 |

## 严重级别

| 级别 | 判据 |
| ---- | ---- |
| SEV-0 | 不可逆数据丢失；或生产/构建完全不可用且当天无绕行 |
| SEV-1 | 用户可见核心功能失效或数据损坏；错误结论被当作事实采用（如门禁假绿）；同一问题复发 ≥3 次 |
| SEV-2 | 用户可见功能降级但可绕行；阻塞部分开发流程；中等规模返工 |
| SEV-3 | 局部或体验层问题，影响可控，但暴露系统性缺口 |

## 状态

- **Active** — 根因未消除，同类问题仍可能复发（含预防措施尚未落地）。
- **Mitigated** — 具体缺口已消除，且预防已落地或有门禁兜住。

## 索引

| # | 主题 | 级别 | 分类 | 状态 | 根因（一句话） |
| - | ---- | ---- | ---- | ---- | -------------- |
| [001](001-twitter-content-parsing.md) | Twitter 推文解析 | SEV-1 | 架构 | Active | parseTweet.ts 无分层、测试不足，每次改动风险外溢 |
| [002](002-translation-system.md) | 翻译系统 | SEV-1 | 架构 | Active | 翻译逻辑耦合在组件内，store 迁移静默丢字段 |
| [003](003-ui-styling-layout.md) | UI 样式与布局 | SEV-3 | 缺陷 | Active | 缺 design token 与视觉回归，靠手工逐处补 CSS |
| [004](004-build-configuration.md) | 构建配置 | SEV-2 | 依赖 | Mitigated | 客户端/服务端边界不清，且当时无构建门禁 |
| [005](005-media-handling.md) | 媒体管线 | SEV-2 | 架构 | Mitigated | 代理/视频/截图各写一套 URL 转换 |
| [006](006-state-management.md) | 状态管理 | SEV-2 | 缺陷 | Mitigated | 整 store 订阅 + 无类型迁移，字段静默丢失 |
| [007](007-instagram-integration.md) | Instagram 集成 | SEV-3 | 变更 | Active | 新功能缺验收清单与 fixture，边界情况留到线上 |
| [008](008-fonts-and-rendering.md) | 字体与渲染 | SEV-2 | 依赖 | Mitigated | 字体栈与加载时序未覆盖 headless 截图 |
| [009](009-prepend-persistence.md) | 句首补充丢失 | SEV-2 | 架构 | Active | index 对齐合并四处漂移，base 外实体被静默丢弃 |
| [010](010-babel-major-drift.md) | Babel 主版本漂移 | SEV-2 | 依赖 | Mitigated | 门禁不跑生产构建，preset 越过 core 主版本 |
| [011](011-verification-honesty.md) | 验证名实不符 | SEV-1 | 流程 | Active | 空跑报绿、静态扫描冒充行为断言，门禁不携带信号 |
| [012](012-mobile-adaptation-and-scroll-lock-ownership.md) | 移动端适配 | SEV-3 | 流程 | Active | 断点列表冒充触屏行为清单；手写滚动锁与浮层原语抢归属 |

## 高危文件

改动前先读对应报告并补测试。

| 文件 | 出现于 | fix 次数 |
| ---- | ------ | -------- |
| `app/lib/react-tweet/api-v2/parseTweet.ts` | #001 #005 | 10 |
| `app/components/tweet/Tweet.tsx` | #001 #003 #005 | 13 |
| `app/components/translation/TranslationEditor.tsx` | #002 #003 | 10 |
| `app/lib/stores/` | #002 #006 | 6 |
| `app/components/tweet/TweetTextBody.tsx` | #001 | 5 |
| `app/lib/translation/resolveEntities.ts` | #002 #009 | 2 |
| `app/lib/service/getTweet.server.ts` | #009 | 1 |

## 高频雷区

**1. 解析器负担过重（#001）**
`parseTweet.ts` 修了 10 次，因为单函数同时管实体抽取、去重、文本范围、媒体和引用推文。改之前先看 `test/unit/parseTweet.spec.ts` 与 `test/unit/entitytParser.spec.ts`，新解析逻辑先写测试再实现。

**2. 翻译逻辑挤进组件（#002）**
翻译 UI、字典、AI 提示词、实体跳过全在组件边界内。纯逻辑（resolver / materialize / placeholder）放进 `app/lib/translation/` 并单测，组件只做渲染和事件。

**3. 单行 CSS 补丁（#003）**
z-index / overflow / min-width 被单独修了约 20 次。样式走语义 token（`bg-background`、`bg-card`、`rounded-xl`），组件规范见 `docs/ui-design/README.md`。

**4. store 订阅与迁移（#006）**
用 selector（`useStore(s => s.x)`），多字段时配 `useShallow`。persist store 改 schema 必须升 version 并写迁移，改完检查 `partialize` 是否覆盖到新字段。

**5. 媒体 URL 转换（#005）**
统一走 `createMediaUrl()`（`app/lib/react-tweet/utils/index.ts`），不要在 React 之外另写一份代理逻辑。截图等待字体用 `document.fonts.ready`，不用固定 delay。

**6. 新功能缺验收清单（#007）**
先写 AC（`verify/acceptance-criteria/`）再实现，完成后补 fixture。IG 集成的路由、持久化、URL 解析问题都是上线后才发现的。

**7. index 对齐合并丢 base 外实体（#009）**
显示、materialize、服务端读缓存、AI 写回各有一份按 index 对齐的合并，只遍历 base 并按 index 覆盖，`index: -1`（句首补充）与 `30000+`（AI 流片段）会被丢掉。合并必须显式处理 base 外实体，并收敛为单一纯函数。

**8. 依赖升级绕过构建门禁（#010）**
跨主版本的 caret 依赖（尤其 Babel preset 与 core 的 peer 约束）用 `~` 或精确版本。升级编译器/打包器前先读 `vite.config.ts` 的版本注释，并本地跑 `bun run build`。

**9. 验证不携带信号（#011）**
「全绿」可能只是没有断言失败。改门禁前先问：故意改坏被测行为，它会红吗？AC 要区分行为断言与源码扫描；CLI 包装层拒绝 0 匹配；断言存在性交给 eslint `test/*` 规则。

**10. 移动端不是断点列表（#012）**
触屏行为——拇指区、安全区（需 `viewport-fit=cover` 才生效）、横滑与滚动抢手势、`dvh`、浮层滚动锁——宽度截图看不出来。浮层用 `ui/dialog|sheet|drawer` 时不要手写滚动锁，原语已负责。

11. 单点依赖上游页面结构 / 上游格式漂移（#013）

`x-client-transaction-id` 只从**一个**页面（`/home`）解析 webpack chunk map（`NNN:"ondemand.s"`）；
X 把首页换成 Rolldown/Vite 后该 pattern 不再存在，初始化即抛错，**所有 X API 调用**在发请求前
就失败（重试/换 key 都无效）。对策：**依赖上游页面/接口结构的功能必须「多候选 + 可用性校验 +
明确降级」**，不能把某个 URL 当稳定单点；`isUsableXDocument`（verification meta + `ondemand.s`）
这类纯函数判定要可导出、可单测；「上游库是最新版」≠「上游已适配」；此类运行时漂移 typecheck/lint/test
覆盖不到，关键外部依赖要有**真实调用冒烟**验证。详见 [013](013-upstream-frontend-drift.md)。


## Pre-Release 检查

1. 取本次改动的 commit 与文件列表。
2. 读各报告的 Changed Files 与根因。
3. 交叉比对：文件是否重叠、模式是否复发、预防措施是否落实。

自动化执行：`bun run postmortem-check <base-ref> <head-ref>`（默认 `main..HEAD`）。命中历史雷区输出 WARN，报告解析失败输出 FAIL；冒烟由 AC-PM-007 覆盖。

## 分布

按级别：SEV-1 共 3 份（001 002 011）；SEV-2 共 6 份（004 005 006 008 009 010）；SEV-3 共 3 份（003 007 012）。

按状态：Active 共 7 份（001 002 003 007 009 011 012）；Mitigated 共 5 份（004 005 006 008 010）。

## 延伸阅读

- [Postmortem 工程学：方法论调研与 SRE 参考](postmortem-engineering.md) — 思想源流、行业实践、模板对比、反模式，以及 Google SRE 第 15 章中文导读。
