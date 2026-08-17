# AI Vision PR #14 评审记录 + 修复/打磨行动计划

> 最后更新：2026-08-13
> 评审对象：`feat/ai-vision` → PR #14（42 文件 / +3546 / 12 commit）
> 上游：`docs/archive/ai-vision-plan.md`（原计划）｜ `docs/features/ai-vision/ai-vision.md`（需求）
> 评审视角：Apple 产品 × 研发（设计克制、验证诚实、评审粒度、安全边界）

---

## 1. 总评

**代码质量 A-，评审粒度 C，合前必须修 2 个安全点。**

- 纪律性满格：文档先行 / AC 先行 / 原子 commit / postmortem 雷区逐条对照 / 每个 commit 带真实联调踩坑（`NoObjectGeneratedError`、AI SDK v7 `FilePart` 与 `system` 选项、routes 显式注册坑）。
- 主要问题：**42 文件单 PR 违反本项目"diff >10 文件必须拆分"的强制规范**（commit 原子但 review 单元不是）。reviewer 无法把整个 diff 装进脑子。AI vision 计划里已有 Phase 4 拆 4a/4b 先例，PR 层面也应按 phase 拆。
- 三个真正好的产品决策（见 §2），值得保留为后续功能范式。

---

## 2. 值得保留的设计（"这很对"）

1. **OCR 与翻译两步解耦**：OCR 是纯提取、翻译是语义任务，翻译复用更便宜的文本模型 + 附推文上下文——被真实失败逼出来的正确产品决策。
2. **索引幻觉三层防御**（prompt 约束 + 消息注入 index 映射 + 数量匹配时强制重映射 `alignVisionIndexes`）：对 LLM 不可靠输出做确定性兜底。
3. **宽容解析**（翻译步 3 种形态 + code fence 剥离）：对 chat 模型自由文本输出防御性解析，不把用户卡死在 `NoObjectGeneratedError`。
4. **离线确定性 AC**（AC-VISION-006 用假 key 真正调用 `runImageVision` 证明短路）+ **DR-8 复用已有 Gemini Key**（识图+翻译共用一个 Key）。

---

## 3. 合前必修（P0）

### P0-1 SSRF —— `/api/ai-vision` 绕过媒体代理白名单

`fetchImageDataUri`（`app/lib/vision/fetchImage.ts`）对**任意 URL** 做服务端 fetch，URL 来自客户端 POST 的 `tweet.mediaDetails[].media_url_https`（schema `.passthrough()`，`vision.ts` 只校验 id_str/text）。

对比 `app/routes/api/proxy/image.ts` 有 `IMAGE_EXT_RE`/IG 域名白名单。vision 路由是该防线的旁路：攻击者 POST `http://127.0.0.1:PORT/...` 服务器即代发请求——盲 SSRF + 内网探测（状态码/时延差分）+ OCR 模式数据外带。

**修复**：`fetchImageDataUri` 前对 host 白名单（twimg / IG CDN），与 proxy 白名单语义对齐。

### P0-2 未认证缓存写入（cache poisoning）

`handleGenerate` / `handleSave`（`app/routes/api/ai/vision.ts`）把客户端发来的整个 tweet JSON `setLocalCache` 进服务端 FS/内存缓存（`cache/tweet-<id>.json`，TTL 1h）。任意匿名访客可对已知 tweet id 写任意内容，后续所有访问者读到被污染快照。`handleSave` 全盘信任客户端、不做合并。

**修复**：`save` 对 `visionInfo` 做强 schema 校验（结构 + index 范围）；`generate` 只写服务端生成结果合并后的数据。校验 schema 下沉 `app/lib/validations/vision.ts`（Postmortem #002 / #007）。

---

## 4. 健壮性（P1，随本次或下个 commit）

| #    | 问题                                                                                                                                                                                            | 建议                                                                            |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| P1-1 | 文档承诺 vs 代码现实：`docs/features/ai-vision/ai-vision.md §4.4` 写"失败走 proxy 回退 + 单图 `status:'error'` 不整批失败"；实际 `fetchMediaImages` 一张图抛错全批 500，`status:'error'` 字段定义了但几乎不可达 | 实现 proxy 回退或单图 error 标记；或改文档对齐。字段已定义、UI 已渲染，倾向实现 |
| P1-2 | `describeImages.ts` 重试只覆盖 `VisionParseError`；翻译步真实踩过的 SDK 层 `NoObjectGeneratedError` 不在内，generate 路径撞上即 500                                                             | SDK 层结构化失败也纳入 validate+retry                                           |
| P1-3 | `alignVisionIndexes` 数量不一致时"交由上层按内容合并"——无上层实现                                                                                                                               | 代码显式注明 known limitation                                                   |
| P1-4 | 多图串行抓图，N 张 = N 次串行网络往返                                                                                                                                                           | 二期加并发限流                                                                  |
| P1-5 | nit：`constants.ts` `deepseek v4 pro` 模型名带空格；`AIVisionEditorDialog` Select 值传对象 vs 设置页传字符串（同组件两套用法）                                                                  | 顺手修                                                                          |

---

## 5. 测试基线红灯（流程诚实性）

dev-log 2026-08-13 自述"全量 test 105 pass，仅剩 env.server/getTweet 既有 4 fail 1 error（基线）"，而 action-plan 又记 44/44 全绿。**被接受的红色测试基线 = pre-push gate 打洞**（CLAUDE.md 强制规范 4）。列入行动：本次 PR 合前清零。

---

## 6. 项目层锐评（Apple 产品 × 研发视角）

- **产品缺北极星**：双平台 + 文本翻译 + 图片 OCR/描述 + 卡片导出 + 多 provider 配置 + 三层缓存 + Postgres ≈ 8 个方向的产品。所有 AI 能力 BYOK + 默认关闭 = power feature 而非主产品。应做成"一个入口、一段配置、零概念负担"，而非散布 5 个设置 Tab。`enableAIVision` 默认关 + 无首次引导，普通用户发现不了（Apple 会做 guided setup）。
- **验证体系在滑向"流程表演"**：五层闭环 + postmortem 自动化很了不起，但已知红灯基线 + 42 文件 PR 里 240 行 dev-log + 340 行 verifier + 444 行 spec，体量开始超过代码本身。保持，别让文档/验证超过代码。
- **三层缓存是缓存还是产品？** Memory LRU + NodeFS + Postgres 对"匿名直读 passthrough"可能是过度设计。二期 visionInfo DB 落库前先回答"这是缓存还是用户收藏/历史产品"——前者 FS 够用，后者是另一个产品决定。

---

## 7. 行动项（按序执行）

> 状态：**P0 + P1-2 + UI 打磨已完成（2026-08-13 本 commit）**，P1 其余与基线修复为后续。

### 7.1 P0 安全修复 ✅

- [x] P0-1 `fetchImage.ts` 加 host 白名单（`assertAllowedMediaHost`，精确 hostname 匹配，杜绝 SSRF），fetch 前校验
- [x] P0-2 新建 `app/lib/validations/vision.ts`（`visionInfoItemSchema` + 数组 schema + index 唯一/范围）；`save` 强校验必填；generate/translate 共享 tweetField 校验 visionInfo（存在则合法），不信任客户端直接落盘
- [x] 测试：`vision.spec.ts` +6（白名单 5 host 拒绝 + schema 4 边界）

### 7.2 UI 打磨 ✅（Apple HIG：Clarity / Deference / Depth / Consistency）

三个新增组件与项目现有设计语言（`AltTranslationEditor` / `AITranslationSettings`）同构，但整套语言本身密度高、噪音大、文案功能导向。本次把三组件立成"克制、清晰、有节奏"的标杆：

**AIVisionBlock（展示块）—— 最该 Apple 化**

1. 头栏噪音：标题 + icon 按钮 + Switch 三元素挤一行 → 精简为「图片描述」+ 一个编辑 icon；「仅译文」由 Switch 改**文字级 toggle**（iOS 阅读器风格，文案随状态切换「仅译文/显示原文」）
2. 「图{i+1}」边框徽章 → 去掉；多图用 hairline 分隔 + 顺序对应（图片本体在媒体区上方，编号是冗余装饰）
3. 字阶收敛：标题 text-xs / 原文 text-xs muted / 主文本 text-sm（去掉 text-[10px] 泛滥与 font-bold 抢层级）
4. 容器 `rounded-xl border bg-muted/30` → hairline + 更透背景
5. 空态文案用户语言化（"为配图生成 AI 描述"）

**AIVisionEditorDialog（编辑弹窗）**

1. `OCR TEXT` / `DESCRIPTION` uppercase mono label → 自然语言「原文」「译文」直接做 textarea 上方小字
2. 按钮层级：保存 = 唯一 primary；AI 翻译/AI 生成弱化为 outline，文案精简
3. footer provider 说明减负（移到 header 副标题或去掉）
4. 卡片内多重背景层叠 → 单 hairline 分隔
5. Select 值统一字符串（修 P1-5 一致性）

**AIVisionSettings（设置）**

1. description / 底注文案用户语言化、精简
2. 保持与 AITranslationSettings 结构一致（Apple 的 Settings 一致性是硬要求，不做差异化重构）
3. 高级项（思考强度/自定义模型）本期不动，维持一致性

#### 第二轮（2026-08-13，用户反馈"UX 还是丑"后更本质的视觉重设计）

第一轮只是减密度/清文案，格局没变。第二轮做结构性改造，真正落在 design system 上（`docs/ui-design/README.md`：native-first / invisible design / bg-card 分组 / 4px grid）：

- **`AIVisionEditorDialog` 模式选择下拉 → `ToggleGroup` 分段控件**（iOS 风格，看图说话 / OCR 识别 / 自定义）——这是"丑"的最大来源，一个下拉塞三个动作是 web 味；分段控件把模式选择变成显式互斥状态
- **编辑器状态上提**：`useVisionLogic` 从弹窗内部上提到 `AIVisionBlock`，弹窗不再自带 trigger（改受控 Dialog）。头栏编辑入口与**空态 CTA** 共用同一打开入口——Apple 的空态是主动邀请动作，不再是无说明的灰字
- **展示块改 `bg-card` 分组容器**（`rounded-xl border bg-card`，对齐 SettingsGroup），hairline 分隔多图；字号收敛到 12/13px 两级，主文本去掉 font-bold 抢层级（回 font-medium + mt-1）
- **空态**：居中 `Sparkles + 为配图生成 AI 描述` 整行可点击 CTA，hover 淡显
- **`AIVisionSettings` Select 值回对象模式**（`value={opt}` + `<SelectValue />`）——与 AITranslationSettings 完全一致（Consistency），并同步修掉第一轮"字符串值"与兄弟组件不一致的回归
- 弹窗逐图编辑卡片改「分组卡片 + divide-y」：每个 textarea 是浅底 `bg-muted/25` + 细 focus ring，去掉多重背景叠层

#### 第三轮（2026-08-13，用户反馈"图片描述的弹窗也丑" → 弹窗原语 + tabs 手机端）

连续反馈链（「UX 还是丑」→「手机端 tab 溢出」→「padding 很大，tab 很丑」→「图片描述、编辑翻译等等弹窗都很丑」）最终指向两个根因：**弹窗原语 padding 过大** + **tabs 手机端溢出**。中途一度把设置页改 iPhone 式垂直长列表，被用户否回——**tabs 是用户既有导航习惯，保留**（Apple 同样尊重用户习惯，勿为追求"苹果感"强行改掉可用模式），溢出改由 tabs 滑动修复。

**弹窗原语收紧（`dialog.tsx`，6 个弹窗一次受益）**：

- `DialogHeader`/`DialogPanel` `p-6`（24px）→ **`p-5`**（20px），`DialogFooter` `px-6` → `px-5`
- 受益：图片描述 / 编辑翻译 / Alt 翻译 / IG 翻译 / 设置 / 词条弹窗

**设置页 tabs（保留 + 手机端修复，`tabs.tsx`）**：

- 保留 5 tab 结构，`TabsList` `w-fit`+`shrink-0` 溢出 → `mx-auto w-fit max-w-full justify-start overflow-x-auto`（内容不足居中=桌面不变，超出横向滑动）
- 窄屏隐藏 absolute Indicator（滚动容器里滑块错位），active 由 tab 自身胶囊承担、随段滚动对齐；宽屏恢复 segment 滑块
- 顺带删除 `SettingsPanel` 从未使用的 `trigger` prop

**Vision 编辑弹窗重写**：

- 分段控件从卡片拿出来裸露在标题下（iOS segmented control 是表层控件）
- 编辑区收敛为单张 `bg-card` 卡片（custom 提示词 + 逐图 + 附上下文开关同卡 `divide-y`）
- textarea 无底色融入卡片（对齐 AltEntityList 范式，`[&_textarea:]` 落内层）；ocr 译文 hairline 贯穿
- footer 去 provider 小字，三按钮右对齐

**移动端**：`SettingsRow` control `shrink-0`；`ToggleGroup` `max-w-full overflow-x-auto`。

### 7.3 收尾 ✅ / 后续

- [x] `typecheck && lint && test && verify --module vision` 全绿（verify vision 8/8）
- [x] 更新 dev-log 2026-08-13 + action-plan「最近更新」
- [ ] **测试基线红灯（独立任务）**：`bun test` 全量 111 pass / 4 fail 1 error（`env.server` 2 + `getTweet` 2+1）。根因诊断：Bun 原生 runner 对 `vi.resetModules` 支持不全（报 `vi.resetModules is not a function`）+ env 模块副作用在并行下互相泄漏。该基线已挡在 pre-push（`bun run test` exit 非 0）。修复需改测试隔离层，独立 commit，不混入本 PR。
- [ ] **P1-1 单图容错**（proxy 回退或单图 `status:'error'`）——二期，字段已定义、UI 已渲染
- [ ] **P1-4 多图抓取并发限流**——二期
- [ ] **P1-5 `constants.ts` `deepseek v4 pro` 模型名空格**——顺手修

---

## 8. 验收入口

```bash
bun run typecheck && bun run lint && bun test
bun run verify/index.ts --module vision
```
