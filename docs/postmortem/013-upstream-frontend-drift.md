# Postmortem 013: 上游 X 前端迁移（webpack → Rolldown/Vite）击穿 client transaction id，X 数据接口全站不可用

- **日期**: 2026-09-25
- **严重级别**: 高（SEV-2）
- **状态**: Active（多候选探测 + 可用性校验已缓解；X 若迁走全部 legacy 路由仍会复发）
- **根因归类**: 决策滞后（单点页面依赖）+ 工具反馈（无可用性校验与兜底）

## 摘要

X 把登出首页从 webpack 迁到 **Rolldown/Vite**（新 "x-web"）：`/` 与 `/home` 都不再内嵌
`ondemand.s` 的 webpack chunk map（`NNN:"ondemand.s"`）。而 `x-client-transaction-id`
（`^0.3.1`，已是 npm 最新）靠用正则从首页 HTML 里解析该 chunk map 来取「key byte indices」，
于是初始化直接抛 `OnDemandFileUrlResolutionError`。由于每个 X API 请求都要带
`x-client-transaction-id`，`/api/tweet/get` 等**全部 X 数据接口 100% 失败**。
修复：不再固定从 `/home` 取外壳，改为在若干**仍提供旧版 webpack 外壳**的路由
（`/i/topics` 等）中探测，返回第一个「可用文档」（含 site verification meta + `ondemand.s`）。

## 影响

- 全部走 rettiwt-api 的 X 数据路径不可用（guest 与带 `TWEET_KEYS` 的 auth 同）；复现入口
  `GET /api/tweet/get?id=2103358731920740663`（`getDBTweet → getEnrichedTweet → FetcherService.request`）
- 报错发生在 `_getTransactionHeader → ClientTransaction.create`，即**请求发出前**，无法靠重试或换 key 规避
  （`SmartPool` 的分类器只对 429/401/403 生效，此错直接抛出）
- 隐藏风险：这是**上游运行时结构漂移**，本地全部门禁（typecheck/lint/test）无法感知，
  只有真实请求才暴露——与 [postmortem 010](010-babel-major-drift.md)（构建期依赖漂移）互为镜像

## 时间线

| 事件 / 实测                              | 说明                                                                                                                                                      |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| X 灰度迁移前端                           | `/`（landing）先切新外壳；随后 `/home` 也切（实测 `x.com/home` 稳定返回新外壳，仅 ~17KB，无 `ondemand.s`）                                                |
| 用户报错 get tweet `2103358731920740663` | `OnDemandFileUrlResolutionError: Unable to resolve the X ondemand chunk URL…`                                                                             |
| 路由扫描（各 3 次）                      | `/home`、`/`、`/explore`、`/i/grok` 恒为新外壳；`/i/topics`、`/i/display`、`/i/timeline`、`/i/communitynotes`、`/jobs` 恒为旧外壳（~300KB，含 chunk map） |
| 提取验证                                 | 库自带正则从旧外壳解出 `ondemand.s.6f1c1b85f72bd50ca.js`；拉取后 `INDICES_REGEX` 命中 4 个索引 `[44,45,28,33]`                                            |
| E2E 复核                                 | 改从 `/i/topics` 取文档后，真实 **guest** `TweetDetail` 请求成功返回推特文                                                                                |

## 根因分析（blameless）

- **贡献因素 1：单点页面依赖，无候选、无校验**。`FetcherService._handleXMigration` 硬编码
  `axios.get('https://x.com/home')`，既不校验返回文档是否真的能被 `ClientTransaction` 使用，
  也没有备选页面。上游换 bundler 后单点即全站单点故障。
- **贡献因素 2：解析契约绑定 webpack 语法**。`x-client-transaction-id` 依赖 webpack 的
  数字 chunk map（`{NNN:"ondemand.s"}`）反查 chunk 文件哈希；Rolldown/Vite 用内容哈希命名
  （`guest-token-CuWFb7UC.js`）、**没有该 manifest 机制**，不是「藏起来了」而是不存在。
- **贡献因素 3：「用最新版上游库」≠「上游已修」**。`^0.3.1` 已是 npm 最新，其正则与仓库
  `main` 分支一致（未修）。错误在实例化期抛出，属硬失败，无任何降级路径。
- **贡献因素 4：缺少外壳可用性自检**。没有「首页外壳是否仍含 `ondemand.s`」的探针/告警，
  故障只能由用户请求触发。

## 做得对的地方

- 用**库自带的正则 + linkedom** 在真实响应上复现与验证（而非凭猜测改正则）；
- 修复以**真实 guest API 请求**做端到端确认（不是只看「不再抛错」）——对齐「门禁先问『改坏它会不会红』」；
- 把「可用文档」判定抽成纯函数 `isUsableXDocument`，候选列表 `X_LEGACY_HOME_URLS` 可导出，
  离线单测覆盖，避免只靠真实网络验证。

## 行动项

### 缓解（针对已发生的具体缺口）

- [x] `_handleXMigration` → `_fetchTransactionDocument`：遍历 `X_LEGACY_HOME_URLS`
      （`/i/topics` → `/i/display` → `/i/timeline` → `/i/communitynotes` → `/home`），
      返回第一个 `isUsableXDocument` 为真的文档；无命中则回退最后一个文档，让库抛出更具体的错误（2026-09-25）
- [x] 新增 `isUsableXDocument(document)`（`twitter-site-verification` meta + `ondemand.s` 双条件）（2026-09-25）
- [x] 新增错误 `ApiErrors.HOMEPAGE_FETCH_FAILED`（所有候选均网络失败时使用）（2026-09-25）
- [x] 单测 `test/unit/rettiwt-transaction-document.spec.ts`（旧/新外壳判定 + 列表非空）（2026-09-25）

### 预防（针对整类问题）

- [ ] 若 X 把上述 legacy 路由也迁移：评估**内置兜底**（缓存上次可用的 `ondemand.s` URL 或 indices；
      或加一层「外壳健康探针」定时校验并在异常时告警），避免再次全站硬失败
- [ ] 评估将 transaction 文档做**短 TTL 缓存**，顺带降低每请求 300KB 首页拉取的开销

## 教训

- **依赖上游页面/接口结构的功能，必须多候选 + 可用性校验 + 明确降级**，不能把某个 URL
  当成稳定单点；「上游库最新版」不等于「上游已适配」。
- 上游格式漂移是**运行时**风险，typecheck/lint/test 覆盖不到——关键外部依赖需要有
  「真实调用冒烟」类验证（本次用真实 guest 请求兜底）。

## Changed Files

```
app/lib/rettiwt-api/services/public/FetcherService.ts
app/lib/rettiwt-api/enums/Api.ts
test/unit/rettiwt-transaction-document.spec.ts
docs/postmortem/013-upstream-frontend-drift.md
docs/postmortem/README.md
docs/development-log/2026-09-25.md
docs/development-log/README.md
CHANGELOG.md
```

## 关联 Postmortem

- [010](010-babel-major-drift.md) —「依赖/工具漂移击穿构建门禁」的构建期版本；本文是其在**运行时 /
  上游协议**维度的同类：门禁不覆盖的漂移会在最意想不到的地方硬失败
