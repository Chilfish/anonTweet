# Changelog

All notable changes to Anon Tweet will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/lang/zh-CN/).

## [Unreleased]

### Changed

#### X 数据层切换到 `@chilfish/tweet@0.2.2`（2026-11-19）

- 删除内嵌 `app/lib/rettiwt-api`（148 文件）与 `app/lib/SmartPool.ts`，新增 `app/lib/twitter.server.ts` 装配层（`createClient` + `obsLog` logger）
- `EnrichedTweet` 字段统一为 `id` / `quotedTweetId` / `retweetedOriginalId` / `isInlineMedia`；`RawUser` 修正为 `UserData`（model 形状）
- 旧 localCache / DB 数据在读取时归一化；CTA 文案与 Space 日期保持中文 UI
- `@chilfish/tweet@0.2.2` 已修复 Article `fieldToggles`；无需 app 侧临时补丁
- 测试与 AC 迁移；`typecheck` / `lint` / `test` 665 / `verify` 676 / `build` / `build-storybook` 全绿

### Added

#### AI 请求路径与 DeepSeek Flash 默认（2026-11-18）

- 新增「浏览器直连」开关（`aiRequestMode`，默认 `server`）：关闭时经 CF Worker `/api/ai-*` 中继，开启后由浏览器直接请求模型服务商；翻译 / 文章 / IG / 视觉 / 连通性测试统一走 `app/lib/ai/request.ts` dispatcher
- 浏览器直连复用同一套翻译与识图管线（`ai-timeout` / 图片抓取已同构），失败时提示 CORS 并引导切回服务端中继
- 截图 SSR 翻译优先使用 `DEEPSEEK_API_KEY` + `DEEPSEEK_MODEL`（默认 `deepseek-flash`），未配置时回退 Gemini
- `AC-TRANS-008/009` + `test/unit/app-config-defaults.spec.ts` / `test/unit/ai-request-mode.spec.ts`

#### 无图链接卡对齐官方（2026-11-14）

- 上游 App 卡（如 youtu.be 音乐链接）没有任何图片 binding 时，卡片回退为官方同款的左侧图标占位块 + 右侧详情，不再塌成纯文字卡
- 卡片域名优先取 `vanity_url`（`youtube.com`），不再显示带 `www.` 前缀的 `domain`
- `AC-CARD-015/016` + `test/fixtures/cards/no-image-app-card.json` / `test/unit/parseTweet.spec.ts` / `test/acceptance/card-render.spec.ts`

#### 投票推文（2026-11-11）

- 新增 `EnrichedTweet.poll`（`mapPollCard`），从 `card.binding_values` 解析纯文字 / 带图投票：选项、票数、整数百分比、`counts_are_final`、结束时间、选项图片与主色
- 新增只读投票组件 `PollCardView`：文字结果条 / 带图 2×2 网格 / 最终结果与截止时间，接入 `TweetNode` 与 `PlainTweet`
- 批量下载包含投票选项图；无普通媒体时分享预览回退到第一张选项图
- `AC-CARD-013/014` + `test/unit/poll-card.spec.ts` / `test/acceptance/poll-card-render.spec.ts`；旧缓存不自动回填（等自然过期/重抓）

#### 媒体广告卡（2026-11-09）

- `unified_card` 媒体卡解析与渲染：多图 `image_carousel_*` 按 `media_list` 顺序还原轮播（不再随机取单图），单图 `image_website` 按原图比例展示（不再裁成 1.91:1），`video_website` 展示封面 + 播放按钮 + 时长 badge（不内嵌播放，mp4/hls 保留给下游下载）
- 两种形态：官方同款横向轮播（scroll-snap + 箭头 + 圆点）与截图友好平铺；截图模式自动强制平铺
- 旧 `unified_card` 缓存首次访问一次性回填 `card.layout/images`，不反复重抓
- 批量下载媒体时包含媒体卡全部图片（多图轮播不再只下载第一张），视频卡下载代理后的 mp4
- 字幕/文档表格格式纳入 pre-commit lint（`lefthook.yml` glob 增加 `md`），避免只在 CI 暴露 `format/prettier` 错误
- `AC-CARD-010/011/012`（`verify/acceptance-criteria/AC-card.md`）+ `test/unit/carousel-card.spec.ts` / `test/unit/download-media.spec.ts` / `test/acceptance/carousel-card-render.spec.ts`

#### DeepSeek 视觉渠道（2026-09-12）

- AI 图片描述新增 DeepSeek 渠道（`deepseek-flash` 支持图片输入；`deepseek-v4-pro` 为纯文本，设置页按 `supportsVision` 过滤并在切换 provider 时回退）
- `AC-VISION-013`（`verify/acceptance-criteria/AC-vision.md`）+ `test/unit/ai-provider-config.spec.ts`

#### 验证诚信修复（2026-09-12）

- `test/acceptance/ac-contract.spec.ts`：文档 AC 编号 ↔ `describe/it` 名 1:1 元测试（F4）
- eslint `test/expect-expect` / `no-conditional-expect` / `no-standalone-expect`（F10）
- postmortem 011（验证名实不符 / dev 模式泄漏）；完成项归档至 `docs/archive/backlog-completed-2026-09-12.md`

#### 版本单源治理（2026-09-11）

- AC-LLMS-002 版本奇偶校验：`info.version` ↔ `package.json` ↔ 随附快照三方一致

#### 测试验证基建重构（2026-08-14）

- `test/integration`：globalSetup 自动起停 TestServer（tweet/ig/media/screenshot API 集成测试），外部凭据缺省 `skipIf`
- `parseTweet.ts` 单测 16 用例（postmortem #001 高危文件零覆盖 P0 补缺）
- 共享 helpers：`load-fixture`（统一解包）/ `read-project-file` / `pixel-server` / `test-context`

#### 工程规范（对标 Float）

- 文档体系：`docs/README.md` 索引、`docs/engineering/{code-style,git-workflow,release-checklist}.md`、`docs/planning/{action-plan,architecture}.md`（ADR-001~008）、`docs/development-log/`
- `CHANGELOG.md`、`CONTRIBUTING.md`

### Changed

#### ins 多图堆叠角标（2026-11-18）

- 保留旋转照片堆，但改为整格裁切：越界部分被卡片框架压住，不再覆盖相邻图片
- 图层边框跟随 `border-card`，静止/悬停错位收敛；`+N` 固定为轴对齐 pill 并补可访问名称

#### ins 帖子骨架屏（2026-11-18）

- `IGPostSkeleton` 改为连续 3:2 媒体占位 + 骨架化动作栏，移除卡片级 `animate-pulse`（不再与格块动画叠加）
- 普通帖子加载只渲染 1 张骨架（`ins.tsx` / `InsPageSkeleton`），不再是两张完整卡片

#### 快拍相册网格（2026-11-18）

- 快拍 / 精选集网格从 5 列小方图改为 3:4 竖版大图（手机 2 列 / 桌面 3 列，≤4 条 2 列），间距 `gap-2`，格块 hover 轻微放大
- 同步 `IGStoryListSkeleton`、`AC-IG-STORY-008` 与 Storybook

#### 外壳重做与内容恢复（2026-11-18）

- 删除通栏 header，也不设常驻导航条：Hero 与日付线由 Layout 在每个视图固定渲染；设置与「搜索推文」同行放在输入卡底部，页脚默认收起
- 搜索页新增最近搜索（IndexedDB，去重 + 20 条上限，chips 点选重搜/清除）；无历史时给 3 个语法示例，点击只填入输入框
- 去掉主题渐变：标题改纯色、移除背景品牌色光斑；新增 `--seal` 朱印色 token
- 撤回 44469cf 的信息型删减：PageHeader 说明与横屏提示、输入卡 description + 支持格式清单、页脚 GitInfo（构建日期 + commit）与「关于 / GitHub」入口；页脚默认展开
- 新增 `/about`：构建信息、数据与隐私边界、机器可读入口（llms.txt / openapi.json / skill）、GitHub 与 CHANGELOG；版本经 loader 读取，不进客户端 bundle
- 首页移除与恢复后 PageHeader 重复的能力提示条
- `AC-ABOUT-001` + 渲染测试；`AC-HOME-002` 更新为悬浮导航与装饰外壳

#### llms.txt 索引化（2026-11-18）

- `/llms.txt` 从「schema 摘要 + 16 条端点清单」收敛为 1.2KB 纯索引：blockquote + 调用约定 + `Start here` / `Live examples` / `Optional`
- 删除 `## Data Shapes`（与 `/openapi.json` 重复），字段定义只指向 OpenAPI；任务级示例指向 `/skills/anon-tweet/SKILL.md`
- 删除 `apiEndpoints` 端点清单，AC-LLMS-001 改为「索引而非文档」并加体积/内容上限；AC-LLMS-002 奇偶校验改为 OpenAPI paths ↔ `EXPECTED_PATHS`
- 不再把 POST-only 端点（`/api/tweet/set`、`/api/ai-*`、`/api/ig/translate`、`/api/bili-post`）作为链接；示例链接全部为可 GET 取回的真实 fixture
- `robots.txt` 显式 Allow 只读接口；`sitemap.xml` 移除隐藏入口 `/bili`；`root.tsx` 增加 `rel="describedby"` 指向 `/llms.txt`
- `anon-tweet` skill 移除 B 站自用端点，版本 1.3.0 → 1.3.1

#### 文档与界面信息密度收敛（2026-11-18）

- 根指令文件 `CLAUDE.md` → `AGENTS.md`，145 行压到 36 行：只留项目一句话、验证命令、6 条硬约束与文档入口；目录树、技术栈清单、核心机制、Current State、gh 流程、Git Hooks、skills 说明全部外链到 `docs/`（根文件只写无法从代码推断的约束）
- 统一 pre-push 门禁描述：`typecheck` → `eslint .` → `verify --exit-on-fail` → `build` → `build-storybook`（修正根文件漏 `build`、`INDEX.md` 与 `git-workflow.md` 各自一套的三方矛盾）
- 新增 [`docs/ui-design/INFORMATION-DENSITY.md`](docs/ui-design/INFORMATION-DENSITY.md)：8 条负向约束、每屏预算与验收动作；`ui-design/README.md` 的 70 行组件清单改为「以目录为准」，修掉 `./components/*.md` 断链与 `select-cossui.md` 悬空引用
- 品牌 Hero 只在首页渲染，详情页不再被「あのん Tweet + 三段介绍」占据首屏；页脚移除 build 时间 / commit hash 与隐藏入口 `/bili`
- 删除三处与链接重复的入口文案（`TweetArticleCard`「阅读全文 →」、`ArticleEmbedTweet`「在 X 查看 →」、B站页「点击查看动态」），AI 视觉块标题改为「AI 描述」与原生 alt 面板区分
- 设置页删除复述 label 的 description、隐私提示 / 词条计数 / 共用 Key 三处脚注；`IGMediaGrid` 删除仅 story 使用的 `showInfoLabel`；`plain` 截图路由补 `overflow-x-auto`
- 删除未被引用的 `app/components/ui/settings-layout.tsx`（与 `settings/SettingsUI.tsx` 重复），`SETTINGS.md` 改指真实导入路径

#### 提示词适配新一代模型（2026-11-18）

- 推文 / 文章 / IG / 视觉提示词统一补「输入末尾复述输出契约」：明确可选字段 `entityText` 只在 Entity Reference 存在 HASHTAG/SYMBOL 占位符时输出，否则整段省略；字面量 `#tag` 未解析成实体时不得补进 `entityText`
- DeepSeek 翻译默认思考档位从 `high` 调整为 `minimal`（官方建议翻译 / OCR 关闭思考；关闭后 temperature 才生效）
- 新增 [`docs/features/translation/prompt-guidelines.md`](docs/features/translation/prompt-guidelines.md)：调研结论、提示词原则、已知失败形态与模型升级检查清单

#### AI 请求路径与 DeepSeek Flash 默认（2026-11-18）

- AI 默认引擎与视觉 provider 切到 DeepSeek Flash（`deepseek-flash` 官方别名，当前由 DeepSeek-V4.1-Flash 提供，1M 上下文且支持图片输入）；persist v7→v8，仅在未配置 Gemini Key 时改写旧默认
- DeepSeek 策略对齐官方规范：`minimal` 显式下发 `thinking: { type: 'disabled' }`；思考开启时省略不生效的 `temperature` / `top_p`，且不覆盖调用方显式给出的 `thinking`
- IG caption 与 OCR 翻译补齐 thinking / reasoning 配置与 `AbortSignal` 超时；视觉生成、连通性测试补齐超时
- 模型注册表补官方版本与能力注释（`deepseek-v4-pro` 纯文本、旧 slug 已退役）

#### Cloudflare Workers 部署（2026-11-10）

- 构建链从 `@vercel/react-router` preset 切到 `@cloudflare/vite-plugin` + `wrangler`，新增 `workers/app.ts` 与 `wrangler.jsonc`
- 新增 `app/entry.server.tsx`（`renderToReadableStream`），修复 Workers 下默认 Node 入口调用 `renderToPipeableStream` 报 500
- 环境文件统一为 `.dev.vars`（模板 `.dev.vars.example`），构建 / 部署 / dev 共用；旧 `.env` / `example.env` 删除
- axios 服务端固定 fetch adapter；Workers 下本地缓存回退内存 LRU，避免只读 VFS 写入静默失败
- 静态响应头迁移到 `public/_headers`；新增手动触发的 `.github/workflows/deploy.yml`
- 纯客户端交互（xlsx / modern-screenshot / @dnd-kit）通过 SSR 分支裁掉动态加载，Worker 上传体积 6887→6045 KiB
- 新增 `bun run secrets:sync`（gh CLI 写入 `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`）；`deploy.yml` 改为非纯文档 push 自动部署

#### DeepSeek 视觉渠道（2026-09-12）

- DeepSeek 模型 slug 对齐官方文档：`deepseek-v4-flash` → `deepseek-flash`、`deepseek v4 pro` → `deepseek-v4-pro`（顺带修 review P1-5 模型名空格）；persist v6 迁移改写旧 slug

#### 验证诚信修复（2026-09-12）

- AC-CI-002/003/004 改为解析 workflow `run:` / `uses:` 步骤断言，注释不再能冒充步骤（F5）
- AC-TWEET-001~004/007、AC-IG-001/006 去 fixture 自证，改为断言真实函数产出；AC-IG-006 真实调用 `translateIGCaption`（LLM 打桩）（F8）
- 补 AC-TRANS-005/006/007 命名；新增 `verify/acceptance-criteria/AC-test.md` 登记 `AC-TEST-006`；新增 `AC-dev.md`（F1/F9）
- `verify/README.md` 修订「AC 编号即测试名 1:1 可追溯」「裸跑永远绿」失实表述（F12）
- `--server` / `--server-port` 标注 deprecated（no-op）；`hasEntityType` 形参收窄为 `Entity['type']`（F13）

#### 版本单源治理（2026-09-11）

- OpenAPI `info.version` 由硬编码 `1.0.0` 改为读取 `package.json`（`app/lib/llms.ts`），随附 skill 快照 `references/anon-tweet-openapi.json` 随之重新生成对齐
- `anon-tweet.ps1` 的 User-Agent 版本改为运行时从 `../SKILL.md` frontmatter 读取（`Get-SkillVersion`），删除手写副本
- 版本纪律（`release-checklist.md` / `git-workflow.md`）由「单源 package.json」更正为「应用 / API 版本」与「skill 版本」两个独立单源域

#### 测试验证基建重构（2026-08-14）

- verify 引擎：自研 VerifyRunner/Verifier 框架删除，57 条 AC 迁移到标准 Vitest 三层架构（`test/unit` 纯函数 / `test/acceptance` AC 语义层 / `test/integration` BFF API），AC 编号 = test 名保持可追溯
- `verify/index.ts` → 薄 CLI（参数映射 vitest `-t` 过滤）；`bun run test` = unit+acceptance、`bun run test:integration` 独立
- 新增 AC-TEST-001~008 验收标准（单命令全分层 / AC 可追溯 / 去重 / 死代码清零 / 离线确定性 / parseTweet 覆盖 / 文档同步 / 样板收敛）

#### 工程规范（对标 Float）

- CLAUDE.md 真实化：符号链接 → 普通文件（git mode `120000` → `100644`），写入对标 Float 的完整规范（强制规范 / Essential Commands / 结构 / Current State）
- AGENTS.md 弃用：技术内容并入 CLAUDE.md + docs，删除文件
- postmortem 迁移：`postmortem/` → `docs/postmortem/`（对齐 Float），新增 TEMPLATE.md + 高频雷区自查
- `lefthook.yml` pre-push：占位符 → 真实 gate（typecheck + lint + test + verify；当时 verify/test 有预先存在的失败会拦截 push，修复为独立任务）

### Fixed

#### Instagram 精选集直链（2026-11-18）

- 升级 `@chilfish/gallery-dl-instagram` 0.2.5 → 0.2.6：`/stories/highlights/{id}/` 直链改为解析页面内嵌 payload，REST `reels_media` 不可用时仍能取出目录与逐条媒体
- 实测 `highlight~18115369870628555` → 12 条 media，目录带 `username` / `highlight_title`；前端相册卡片与查看器直接复用
- 上游跟踪：[Chilfish/gallery-dl-ins#3](https://github.com/Chilfish/gallery-dl-ins/issues/3)

#### AI 翻译容错与错误提示（2026-11-18）

- 模型返回非法 `entityText`（例如为不存在的占位符编造 key）时不再让整条翻译失败：首次重试，第二次丢弃非法覆盖并正常返回译文
- AI 失败 toast 改为中文分类标题 + 可操作建议（认证 / 余额 / 限流 / 超时 / 空输出 / 格式 / 校验失败），技术详情折叠展示，并补上模型原始输出与 `finishReason`
- 服务端错误日志把 `aiError` 类型、HTTP 状态与原因写入首段字符串，Cloudflare 日志不再只剩请求上下文
- 新增 `entityText` 清洗与错误提示映射单测

#### Instagram 快拍提取（2026-11-14）

- 升级 `@chilfish/gallery-dl-instagram` 0.2.4 → 0.2.5：stories 优先解析页面内嵌 payload，REST `reels_media` 返回 500 时仍能提取
- 用户名解析失败不再统一报 `User not found`：错误信息带上每条策略的状态码与原因；修正 `web_profile_info` 的 `data.user` 层级与 `web` 策略的 `profilePage_<id>` 页面特征

#### 用户详情（2026-11-12）

- `/api/user/get/:username` 对无置顶推文的账号 500（`TypeError: Cannot read properties of undefined (reading '0')`）：上游整个省略 `legacy.pinned_tweet_ids_str`，`User` 反序列化改用可选链，`IUserLegacy.pinned_tweet_ids_str` 标记为可选
- 补 `test/unit/user.spec.ts` + 真实响应 fixture（`test/fixtures/user/details-no-pinned.json`），锁定「省略字段 → `pinnedTweet` 为 `undefined`」与「提供字段 → 正常取值」（postmortem #014 同类上游契约漂移）

#### CI 部署（2026-11-10）

- deploy workflow 不再向构建注入空的 `HOSTNAME`（未设置 repo variable 时不再触发 `z.url()` 校验失败）
- `env.server` 统一把空串可选变量按未设置处理，避免 CI / 平台注入空 env 时启动失败

#### X 前端迁移修复（2026-09-25）

- X 迁移到 Rolldown/Vite 后不再内嵌 `ondemand.s` webpack chunk map，`x-client-transaction-id` 因此抛 `OnDemandFileUrlResolutionError`，所有走 rettiwt-api 的 X 数据接口失败。**真因是外壳请求漏带登录 cookie**（X 仅对登录态返回仍含该 chunk map 的旧外壳）：新增 `buildXShellHeaders`，配置 API Key 时附带解码后的 cookie，`_fetchXHomePage` 改为使用它
- 外壳候选列表改为 `X_SHELL_URLS`（`/home` 优先，legacy 路由作无 Key 时的 guest 兜底）+ `isUsableXDocument` 双条件校验；新增/扩充 `test/unit/rettiwt-transaction-document.spec.ts`
- 沉淀 postmortem 013 与 `docs/features/tweet/transaction-id.md`（含 `ondemand.s` indices 每构建随机、不可 pin 的实测）
- 补 AC-TWEET-011 回归防护（行为断言：mock `axios.get` 跑真实 `_fetchTransactionDocument`，锁定外壳请求必带 cookie、无 Key 时保持匿名），与 AC 文档 1:1 绑定

#### 验证诚信修复（2026-09-12）

- dev server 在外层 `NODE_ENV=production` 下崩溃（`jsxDEV is not a function`）：`dev`/`build` 脚本经 `cross-env` 固定 `NODE_ENV`，不再依赖宿主环境（F1）
- `verify/index.ts` 空跑报绿：`--ac` / `--module` 零匹配（0 executed）现在非零退出并说明原因；修正模块别名（translation→`AC-TRANS` / screenshot→`AC-SHOT`+`AC-PERF` / postmortem→`AC-PM`）；`--module` 白名单启动校验（F2）
- `ac-sec.spec.ts` AC-SEC-001 死 `return`（`// 暂时不管他`）；配合所有者裁定移除过噪的设置页隐私披露文案及其断言（F3）
- 集成层半恒真：AC-TWEET-006 去掉 `catch { return }`，改为断言「`[]` 或干净 HTTP 错误」；AC-SHOT-001/002 拆分 `it.skipIf` 并对真实 fixture id 断言内容特征（F7 部分）

### Removed

#### 测试验证基建重构（2026-08-14）

- `test/fetchTweet.ts`（真网络脚本混入测试目录）、SDK 死类型（`TweetListResponse` 等）

### Deferred

#### 验证诚信修复（2026-09-12）

- F6 / F7（剩余 msw 全量替换）/ F11（Stryker 变异体检）经所有者裁定「暂不修复」延后归档；测试基建收口，后续转功能开发

## [0.1.0] - 2026-05-31

### Added

#### Instagram 集成（5 阶段）

- IG 类型定义 + URL 识别 + 路由骨架（`extractIGId`、`detectInputType`、`/ins/:id`）
- API 层：`@chilfish/gallery-dl-instagram` SDK + `/api/ig/get` BFF 路由
- UI 组件：`InstagramPostCard` + `PlainIGPost` + 13 子组件（九宫格、透卡相框）+ barrel export
- 操作区：`IGHeader`（翻译/截图/下载/复制）+ `IGOptionsMenu` + `IGTranslateToggle`
- AI 翻译管线：`translateIGCaption.ts` + `IGTranslateDialog`
- DB 缓存：`ig_post` 表 + `getIGPost.server.ts` 三层缓存
- 纯文本路由：`/plain-ins/:id` + Storybook 用例（14 个 IG 组件 story）

#### 翻译子系统

- 统一 resolver 纯函数（`resolveTranslationView` stream/overlay 判定）
- materialize / strip translations 纯函数
- 测试：`resolveEntities`、`translationMaterialize`、服务层单测

#### 验证体系（2026-07-04）

- `verify/` 五层闭环：AC（25 条）→ Fixtures（7 个）→ SDK（AnonTweetClient + TestServer）→ CLI（`bun verify`）→ CI（待办）
- Postmortem 8 份报告（107 fix commits → 8 根因集群）

### Changed

#### 代码质量

- `catch (error: any)` → `catch (error: unknown)`
- 提取共享 `formatIGTime()` 到 `utils.ts`，消除重复
- `structuredClone()` 替换 `JSON.parse(JSON.stringify())`（深拷贝性能）

#### 翻译子系统

- AI 翻译强制结构化 JSON 输出（schema 校验 + 占位符校验 + 一次重试）
- `tweet.entities` 回归原文只读；手动翻译只存 `TranslationStore`

### Fixed

#### 代码质量

- `PlainIGPost` 向 `IGCaption` 传递不存在的 `tags` prop
- `RettiwtPool.shouldRetry()` 新增 401/403 轮换

#### 翻译子系统

- 翻译完成后主动刷新 local cache

### Removed

#### 代码质量

- 死代码 `proxyMedia()`、`createSelectors()`
