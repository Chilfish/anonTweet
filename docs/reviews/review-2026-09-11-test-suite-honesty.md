# 验证套件诚信审查：AC 空跑报绿 / 静态扫描冒充行为断言（2026-09-11）

> 依据：CLAUDE.md（「验证先行」强制规范 2 / 「开写代码前先读尸检报告」4）/ docs/INDEX.md / verify/README.md / verify/index.ts / vitest.config.ts / verify/acceptance-criteria/\*.md / test/\*\* 全量精读 / .github/workflows/verify.yml / lefthook.yml，以及本机实测（`bun run verify/index.ts --exit-on-fail`、`vitest --project acceptance --reporter=verbose`、逐 `--module` / `-t` 探针）。
>
> 评审对象：`test/` 三层（unit / acceptance / integration）+ `verify/` 薄 CLI 与其 AC 契约文档。触发问题：`bun run verify/index.ts --exit-on-fail` 这条被 CLAUDE.md、README、CI、pre-push 同时引用的「护城河」命令，实际能证明什么？

## 1. 执行摘要

- **一句话**：unit 层是真测试；**acceptance 层大半是「扫源码字符串」，integration 层被设计成「裸跑永远绿」，且 `--ac` / `--module` 选不中任何用例时会 exit 0**。于是「verify 全绿」对相当一部分功能**不携带信号**——这正是 postmortem #003/#007 复发土壤的同一类问题（验证名实不符）。
- **P1×6**：
  1. **空跑报绿**：`--ac <不存在的编号>` 与 `--module translation/screenshot/postmortem` 均 0 用例、exit 0（实测）。
  2. **死断言**：`ac-sec.spec.ts` 的 AC-SEC-001「设置页披露」用例开头 `return`，后续 `expect` 全为死代码，AC 文档 P3 从未被验证。
  3. **静态扫描冒充行为验收**：AC-CI-003 被 workflow 里的**一句注释**满足；AC-MEDIA/OBS/DECOUPLE/RESOLVER/SEC/SHOT/VISION/UI/PWA 的多数断言是 `toContain('字面量')`。
  4. **集成层结构性不可失败**：默认隔离 key → `skipIf` 结构性跳过；AC-SHOT-001/002 用无效 id 且只断言「含 HTML」（NotFound 页也满足）；AC-TWEET-006 `catch { return }`。
  5. **命令本身已红**：`bun run verify/index.ts --exit-on-fail` 当前 exit 1（globalSetup 起的 dev server 崩在 `jsxDEV is not a function` / `Cannot access 'abort' before initialization`），integration 实际未执行——集成层的「绿灯」声明当前不可复现。
  6. **AC ↔ 测试名 1:1 断链**：verify/README.md 宣称「AC 编号即测试名，文档 ↔ 代码 1:1 可追溯」，实测 AC-TRANS-002/005/006/007 只存在于文档、无任何 `it('AC-...')` 命名，`--module translation` 因此静默空跑。
- **P2×3**：fixture 自证（tautological，断言 JSON 自身字段而非解析器输出）、AC-TWEET-004 正则近乎恒真、AC-IG-006 声称验翻译却不调用 `translateIGCaption`。
- **亮点（事实）**：`test/unit/**` 是像样的行为测试（工厂构造 + 负例 + 不可变断言），AC-CARD-002/003（真实 jetfuel payload）与 `card-render.spec.ts`（`renderToString`，AC-CARD-005~008）是真渲染断言，AC-PM-007 真跑脚本冒烟。团队在 AC-card.md v1.1 已自我纠正过一次「名实不符」，说明该坑已被认知，只是未制度化。
- **修复优先级**：先修 dev server（否则三层门禁名存实亡）→ 再堵「空跑报绿」（最危险）→ 死断言与注释误判 → 静态扫描降级为「辅助检查」或改真行为测试 → 集成层引入可失败的确定性正例。

## 2. 评价框架（继承 review-2026-08-19 §2，测试视角改写）

| #   | 标准         | 探针问题                                                  |
| --- | ------------ | --------------------------------------------------------- |
| 1   | 可失败性     | 故意改坏被测行为，该用例会红吗？（不会红 = 无效）         |
| 2   | 名实相符     | 文档写的「验证方法」和 `it()` 里真正干的事一致吗？        |
| 3   | 行为 vs 实现 | 一次不改外部行为的重构会不会让它误红？（会 = 测实现细节） |
| 4   | 信号 > 绿灯  | 「全绿」里有多少是 `skip` / 空跑 / 恒真？                 |
| 5   | 契约闭环     | AC 编号、测试名、文档编号、`--module` 别名是否 1:1 对齐？ |
| 6   | 夹具独立性   | 断言的是**函数产出**还是**夹具自称**？                    |
| 7   | 集成真实性   | 无 key 时是「确定性地验错误路径」，还是「干脆不跑」？     |
| 8   | 门禁可信     | CI / pre-push 引用的那条命令，真的能拦住回归吗？          |

> 判断基准（业内共识）：**若一次不改变外部行为的重构就让测试变红，它测的是实现细节**；**若改坏实现测试仍绿，它是「Liar」**（永远通过的测试）。标准工具是 mutation testing（Stryker / PIT）——向源码注入变异，存活变异体 = 断言无效。

## 3. 锐评报告（P1 → P3）

### P1-1 空跑报绿：`--ac` / `--module` 选不中用例时 exit 0

- 【问题】`verify/index.ts` 把 `--ac` / `--module` 直接映射为 vitest `-t <子串过滤>`（L66-71）。vitest 在「无测试名匹配」时输出 `N skipped` 并 **exit 0**——门禁无法区分「全过」与「一条都没跑」。
- 【证据】（本机实测，`--project unit --project acceptance`）：
  - `-t AC-TRANS-005`（文档里有、测试名里没有）→ `Test Files 43 skipped` / `Tests 366 skipped` / **exit=0**
  - `-t AC-NOPE-999`（根本不存在）→ `366 skipped` / **exit=0**
  - `--module translation` → `368 skipped` / **exit=0**；`--module screenshot` → `368 skipped` / **exit=0**；`--module postmortem` → `368 skipped` / **exit=0**
  - 对照正常：`--module tweet` → `6 passed`；`--module vision` → `42 passed`
- 【根因】模块 → 前缀映射写死为 `AC-${module.toUpperCase()}`（`verify/index.ts` L70），但测试名前缀并不等于模块名：`translation`→`AC-TRANS-*`、`screenshot`→`AC-SHOT-*`、`postmortem`→`AC-PM-*`，三者全部错配。
- 【影响】P1：`verify/index.ts` 自身 help（L47）**推荐** `translation`，且 AC-translation.md L6 / AC-screenshot.md L6 / AC-postmortem.md L6 把 `--module translation|screenshot|postmortem` 写成了「执行命令」——按文档执行会得到一次「成功」的空跑。
- 【建议】① 增加「匹配数为 0 → 非零退出」的守卫（或改用 `--reporter=json` 统计 executed 数）；② 修正模块别名映射表（translation→`AC-TRANS`、screenshot→`AC-SHOT`/`AC-PERF`、postmortem→`AC-PM`），并对 `--module` 白名单做启动期校验；③ 增加一条元测试：扫描 `verify/acceptance-criteria/*.md` 的 AC 编号集合 vs `test/**` 中 `it('AC-...')` 命名集合，差集非空即失败（见 P1-6）。
- 【成本】0.5 人日 / 风险低 / 收益：门禁恢复「绿灯即证据」。

### P1-2 死断言：AC-SEC-001「设置页披露」用例开头 `return`

- 【问题】`test/acceptance/ac-sec.spec.ts` 的 `it('settings page discloses ...')` 在第 78-79 行是 `// 暂时不管他` + `return`，其后三条 `expect`（RELAY_TEXT / WHITELIST_TEXT / ARBITRARY_ENDPOINT_TEXT）永不执行。
- 【证据】`test/acceptance/ac-sec.spec.ts` L77-83（`it()` 在 L77，死分支 `// 暂时不管他` + `return` 在 L78-79，其后 L80-82 三条 expect 不可达）；AC-sec.md「P3 披露（源码扫描）」仍宣称该断言存在。实测该用例 `0ms` 通过。
- 【影响】P1（标准 1/2）：AC-SEC-001 的 P3 完全未验证，且这是**已知缺口被静默吞掉**——比单纯没写测试更危险（读者以为有覆盖）。
- 【建议】删除 `return`，补真实断言；若设置页文案确实未落地，则如实把该 AC 标为未完成并从「已验证」清单移除，另开修复项（不要用 `return` 假装通过）。
- 【成本】0.1 人日（删 return）/ 0.5 人日（核对文案并补齐）/ 风险低。

### P1-3 静态源码扫描冒充行为验收（Inspector + Liar）

- 【问题】acceptance 层大量 AC 用 `readFileSync(...).toContain('字面量')` 代替行为断言。最刺眼的一条：**AC-CI-003 断言 workflow 含 `bun run test`——该字符串实际只出现在 `.github/workflows/verify.yml` L48 的注释里**（真正的 `run:` 步骤中并无此命令）。注释即满足，删掉注释才会红。
- 【证据】静态扫描型 AC（非穷举）：`ac-media.spec.ts`（004/005/006）、`ac-decouple.spec.ts`（全部）、`ac-obs.spec.ts`（全部）、`ac-resolver.spec.ts`、`ac-sec.spec.ts`（P2）、`ac-screenshot.spec.ts`（003/004）、`ac-vision.spec.ts`（008/009/010）、`ac-ui.spec.ts`（全部）、`ac-pwa.spec.ts`（全部）、`ac-card.spec.ts`（004/009）。AC-CI-003 见 `ac-ci.spec.ts` L27-30（断言 `toContain('bun run test')` 在 L29）+ `verify.yml` L48（该字符串仅存在于注释）。
- 【典型失真】AC-MEDIA-005 只断言 `TweetCard.tsx` 里出现 `proxyMedia` 字样，**不验证 URL 真的被代理**；AC-DECOUPLE 用「源码不含 `generateText`」这类**否定式字符串断言**证明解耦（改个名/包一层即静默失效）；AC-OBS 只断言 `obsLog('cache.get'` 字面量存在。
- 【影响】P1（标准 1/3/4）：会因无关重构误红（Inspector），却对功能是否工作无感（Liar）。「verify 全绿」在这些 AC 上几乎不携带信号。
- 【建议】二选一，不得模糊：① **降级为「辅助检查」并改名**（如 `AC-*-SRC`），在 AC 文档中把「验证方法」如实写成「源码扫描」，主验收另立行为 AC；② **改真行为测试**——直接 import 调纯函数、用 `renderToString` 断言输出、用 msw/fetch 桩断言 URL 重写与副作用。AC-CI-003 必须解析 YAML 的 `run:`/`uses:` 步骤，禁止 substring。
- 【成本】按 AC 逐条估，3-6 人日 / 风险中（需引入 msw 等测试依赖）/ 收益：AC 从「文档声称」变为「可失败证据」。

### P1-4 集成层结构性不可失败

- 【问题】集成层默认路径下真正执行的只有三条「错误路径」，正向行为全部靠 `skipIf` 结构性跳过；即便执行的几条也存在半恒真写法。
- 【证据】
  - `test/integration/global-setup.ts` L28-30：`isolateExternal=true` 时 `delete process.env['INS_COOKIES' / 'TWEET_KEYS']` → AC-TWEET-005/008/010、AC-IG-007/008 的 `describe.skipIf` 恒成立。
  - `api.screenshot.spec.ts` L17-24：AC-SHOT-001（L17-19）/ 002（L22-24）用无效 id `__screenshot_verify__`（L18、L23）请求 `/plain-tweet/*`，**只断言响应含 `<!DOCTYPE html>`/`<html>`**——NotFound 页同样满足；真正截图渲染路径（有内容的推文/IG）未被断言。
  - `api.tweet.spec.ts` L35-44：AC-TWEET-006 把调用包在 `try { ... } catch { return }`（`catch` 在 L40），抛错也算过，半恒真。
  - verify/log.md 与 README 均明言 SKIP 语义「裸跑永远绿」——即设计目标就是「不许红」。
- 【影响】P1（标准 4/7）：集成层对回归几乎无拦截力；AC-SHOT 正例实为负例断言。
- 【建议】① CI 增一条带真 key 的 job（或全面改为**录制 fixture + msw**，让集成测试离线也验正例）；② AC-SHOT 改用真实 fixture id 并断言内容特征（作者/正文片段），无 key 时至少断言「有内容的 fixture id ≠ 无效 id 的 HTML 差异」；③ 把 `catch { return }` 的容错改为显式断言可接受的错误码，不要让「抛错」等同于「通过」。
- 【成本】2-4 人日 / 风险中（涉及密钥注入 CI 与网络）/ 收益：集成层真正可失败。

### P1-5 门禁命令当前已红：dev server 启动崩溃

- 【问题】被 CLAUDE.md、verify/README、CI（verify.yml L49，step 名见 L46）、pre-push（lefthook.yml L12）同时引用的 `bun run verify/index.ts --exit-on-fail`，在本机当前工作树 **exit 1**；`bun run dev` 单独启动亦 500/退出 1。integration 未执行。
- 【证据】实测输出：`[Server:err] TypeError: (0 , __vite_ssr_import_5__.jsxDEV) is not a function`（重复数百行）+ `ReferenceError: Cannot access 'abort' before initialization` → `error: script "dev" exited with code 1` → `[TestServer] Process exited with code 1` → `No test files found, exiting with code 1`。
- 【影响】P1（标准 8）：三层门禁中 integration 名存实亡；「218 PASS / verify 全绿」的历史声明在当前树不可复现。需先定位是应用回归还是依赖/运行时环境问题（`jsxDEV` 指向 React jsx-dev-runtime 供给异常）。
- 【建议】先独立修复 dev server 启动（单独 issue），再谈其余修复项——否则所有 integration 修复都无法验证。修复后把 `bun run verify/index.ts --exit-on-fail` 恢复为绿并留一条回归记录。
- 【成本】0.5-2 人日 / 风险中（可能涉及 React/Vite/Bun 版本与 jsx runtime 配置）/ 收益：门禁恢复可运行。

### P1-6 AC ↔ 测试名 1:1 断链

- 【问题】verify/README.md L11-12 宣称「AC 编号即测试名（`it('AC-TWEET-001: ...')`），文档 ↔ 代码 1:1 可追溯」，实测存在只在文档、不在测试名的 AC；同时存在只在测试、不在文档的编号。
- 【证据】编号集合对比（本机 grep）：**文档有、测试无** = `AC-TRANS-002 / 005 / 006 / 007`；**测试有、文档无** = `AC-TEST-006`。前者正是 `--module translation` 空跑的根因。
- 【影响】P1（标准 5）：契约闭环断裂，「用 AC 编号精确定位某条验收」的能力对涉事编号失效。
- 【建议】① 为 AC-TRANS-002/005/006/007 补 `it('AC-TRANS-00N: ...')` 命名（其中 002/005/006 语义已被 `entitytParser.spec.ts` / `resolveTranslationView.spec.ts` / `translationMaterialize.spec.ts` 部分覆盖，只需对齐命名与文档，避免重复造测试）；② 把 `AC-TEST-006` 登记回文档或改为正式编号；③ 落地 P1-1 建议③的元测试，防再次漂移。
- 【成本】0.5-1 人日 / 风险低。

### P2-1 夹具自证（tautological）

- 【问题】部分 AC 断言的是 **fixture JSON 自身的字段**，而非被测解析器的产出，等于「用样本自证样本」。
- 【证据】`ac-tweet.spec.ts` AC-TWEET-001~004/007、`ac-ig.spec.ts` AC-IG-001/002 直接 `loadFixture(...)` 后断言 `post.id` / `entities.length` 等；AC-IG-006 标题为「caption 翻译不破坏原文」，实际只查 fixture 有 `captionTranslation` + 源码不匹配 `post.description =`，**从未调用 `translateIGCaption`**。
- 【影响】P2（标准 6）：真正的解析/翻译回归不会让它红。
- 【建议】改为「fixture 作为输入 → 调 `parseTweet`/`enrichTweet`/`translateIGCaption` → 断言产出」；AC-IG-006 需真正调用纯函数并断言返回字符串与原 `description` 不变。
- 【成本】1-2 人日 / 风险低。

### P2-2 AC-TWEET-004 近乎恒真

- 【问题】AC-TWEET-004 断言 `text.trimStart()` 匹配 `/^\S/`、`text.trimEnd()` 匹配 `/\S$/`——对任何非空文本恒成立，属「rubber-stamp」。
- 【建议】删除或改为有意义的边界断言（如首尾空白被正确裁剪、显示区间不含纯空白）。
- 【成本】0.1 人日。

### P2-3 无断言/条件断言的防护缺失

- 【问题】仓库未启用能拦截本次问题的 lint 规则，`return` 短路、条件 `expect`、无断言用例都不会被工具发现。
- 【建议】接入 `eslint-plugin-vitest` 的 `expect-expect` / `no-conditional-expect` / `no-standalone-expect`，把「每条 `it` 至少一条断言」变成机器可查。可选：把 Stryker（JS mutation testing）作为阶段性质量门（先对 `app/lib/**` 纯函数跑，观察存活变异体）。
- 【成本】1 人日（lint）/ 2-3 人日（mutation 试点）/ 风险低。

### P3 其余打磨

- verify/README.md 的「AC 编号即测试名，1:1 可追溯」与「裸跑永远绿」两条表述需按 P1-1/P1-6 修订（前者不成立，后者是缺陷而非卖点）。
- verify/index.ts help（L46-53）列出的 `--server` / `--server-port` 已是 no-op 兼容参数，应标注 deprecated 或移除，避免误导。
- `ac-tweet.spec.ts` 的 `hasEntityType(entities, type: string)` 形参应是联合类型而非 `string`，削弱了类型保护。

## 4. 修复行动计划（按优先级，落 backlog）

### 阶段 0（P0，先做）：让门禁重新可信

| #   | 任务                                                            | 文件                                             | 验收                                                                                |
| --- | --------------------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------- |
| F1  | 修复 dev server 启动崩溃（jsxDEV / abort 初始化）               | 待定位（`vite.config.ts` / React·Vite·Bun 版本） | `bun run dev` 200 · `verify --exit-on-fail` 能跑满三层                              |
| F2  | `--ac` / `--module` 零匹配时非零退出 + 修正模块别名 + 启动校验  | `verify/index.ts`                                | 探针矩阵：未知 AC exit≠0；`--module translation/screenshot/postmortem` 真跑对应用例 |
| F3  | 删除 `ac-sec.spec.ts` 死 `return`，如实标注或补齐 AC-SEC-001 P3 | `test/acceptance/ac-sec.spec.ts`、`AC-sec.md`    | 该用例失败可控（改坏文案即红）                                                      |
| F4  | 新增 AC 编号 ↔ 测试名一致性元测试                               | `test/acceptance/ac-contract.spec.ts`（新）      | 文档/测试编号差集非空即失败                                                         |

### 阶段 1（P1）：把「假绿」改成「可失败」

| #   | 任务                                                                  | 文件                                                 | 验收                                         |
| --- | --------------------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------- |
| F5  | AC-CI-003 改为解析 workflow 的 `run:` 步骤（禁止 substring/注释误判） | `test/acceptance/ac-ci.spec.ts`                      | 把 `bun run test` 从 `run:` 删掉即红         |
| F6  | 静态扫描型 AC 降级为辅助检查或改行为测试（media/obs/decouple/…）      | `test/acceptance/*`、对应 `AC-*.md`                  | 「验证方法」与实现一致；关键路径可失败       |
| F7  | 集成层可失败化：真 key CI job 或录制 fixture + msw；AC-SHOT 正例断言  | `test/integration/*`、`.github/workflows/verify.yml` | 无 key 时正例也有确定性断言；有 key 跑真链路 |
| F8  | 去 fixture 自证：断言解析器/翻译器产出而非 JSON 自身                  | `ac-tweet.spec.ts`、`ac-ig.spec.ts`                  | 改坏解析器即红                               |
| F9  | 补 AC-TRANS-002/005/006/007 测试名 + 登记 AC-TEST-006                 | `test/unit/*`、`AC-translation.md`                   | 编号集合 1:1                                 |

### 阶段 2（P2，防复发）

| #   | 任务                                                                 | 文件                                  | 验收                        |
| --- | -------------------------------------------------------------------- | ------------------------------------- | --------------------------- |
| F10 | 接入 `eslint-plugin-vitest`（expect-expect / no-conditional-expect） | `eslint.config.mjs`                   | 死断言/无断言用例 lint 报错 |
| F11 | mutation testing 试点（`app/lib/**` 纯函数）                         | 新增脚本 / CI 可选                    | 产出存活变异体报告          |
| F12 | 修订 verify/README.md 不实表述（1:1 可追溯 / 裸跑永远绿）            | `verify/README.md`                    | 文档与实际能力一致          |
| F13 | 清理 `--server` / `--server-port` no-op 参数与 P3 类型打磨           | `verify/index.ts`、`ac-tweet.spec.ts` | help 无死参数；类型收窄     |

## 5. 反方自审与开放问题

### 自审（唱反调）

1. **静态扫描并非一无是处**：对「某入口必须走统一代理」「日志不得含密钥」这类**结构约束**，源码扫描成本极低且能拦住手滑。批评的落点是「**把它叫成行为验收 / 写进 AC 的 Pass 条件**」，而非否定扫描本身——所以建议是「如实降级」，不是全删。
2. **「裸跑永远绿」是刻意的产品决策**：为让无 key 的贡献者也能跑门禁，SKIP 语义是合理折中；问题在于它被当成「覆盖」，且缺少一条带 key 的可失败路径。
3. **空跑报绿可能被低估**：vitest 的 `-t` 本就是「过滤」语义，exit 0 是框架合理行为；错在 CLI 包装层没有把「0 匹配」当成失败——这属于包装层缺陷，不是 vitest 的锅。
4. **dev server 崩溃可能是环境一次性因素**（依赖/Node·Bun 版本、jsx runtime 配置），不一定是本次审查发现的应用回归；但无论根因，它证明「门禁绿灯」的结论**当前不可复现**，必须优先定位。
5. **成本可能被低估**：F6/F7 改真行为测试需引入 msw 等依赖并维护录制夹具，对个人项目是实打实的税；可按 AC 价值分批，不必一次到位。

### 开放问题（需所有者拍板）

1. 集成层策略：**CI 注入真 key**（覆盖真实、有密钥与网络成本）vs **录制 fixture + msw**（离线确定、需维护录制）——选哪条？
2. 静态扫描 AC 的处置：**降级改名保留**（快、但弱）vs **重写为行为测试**（强、但贵）——是否允许分 AC 混用？
3. 是否把 mutation testing 纳入正式质量门，还是只做一次性体检？
4. 本类问题是否要沉淀一条 postmortem（编号顺延 010）？它已复发一次（review-2026-08-19 P1-1「AC-CARD-005 源码扫描冒充渲染断言」→ 本次 P1-3），符合「新 Bug 模式」沉淀条件。

## 6. 附：本次实测命令与结果（可复现）

```bash
# 1) 门禁命令本身（当前红）
bun run verify/index.ts --exit-on-fail
#  → [Server:err] TypeError: jsxDEV is not a function / Cannot access 'abort' before initialization
#  → TestServer failed to become ready → exit 1

# 2) acceptance 层（离线绿，但含死断言与静态扫描）
bunx vitest run --project acceptance --reporter=verbose
#  → Test Files 16 passed / Tests 95 passed（其中 ac-sec 披露用例 0ms 通过 = 死断言）

# 3) 空跑报绿探针
bunx vitest run --project unit --project acceptance -t AC-TRANS-005   # 366 skipped, exit 0
bunx vitest run --project unit --project acceptance -t AC-NOPE-999    # 366 skipped, exit 0
#   --module translation / screenshot / postmortem → 368 skipped, exit 0
#   --module tweet → 6 passed；--module vision → 42 passed（对照）

# 4) 编号一致性
#   文档有测试无：AC-TRANS-002/005/006/007
#   测试有文档无：AC-TEST-006
```

---

**验证自评**：每条 P1/P2 均可在 10 分钟内复核（文件 + 行号 + 可复现命令已给）；唯一不可复现项是 P1-5 的根因（需进一步定位是应用回归还是本地环境/版本问题）。
