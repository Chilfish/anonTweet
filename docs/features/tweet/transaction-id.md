# X client transaction ID：前端迁移（webpack → Rolldown/Vite）的根因与应对

> 状态：调研完成，结论已实测 ｜ 日期：2026-09-25
> 关联：[postmortem 013](../../postmortem/013-upstream-frontend-drift.md) · Rettiwt-API #908 · Lqm1/x-client-transaction-id #17/#20 · tweety #298

## 0. 结论先行

- **根因不在「换哪个页面」，而在「外壳请求没带登录 cookie」。**
  同一 URL `x.com/home`：匿名 → 新外壳（无 `ondemand.s`）；**带 cookie → 旧外壳（有 `ondemand.s`）**。
- 上游 `_handleXMigration()` 只发 `config.headers`，**从不发 cookie**，所以即使用户配了 API Key，
  外壳请求仍是匿名的 → 必然拿到新外壳 → 抛 `OnDemandFileUrlResolutionError`。
- 这是**回归**：Rettiwt #885 曾用「带上解密 cookie」修好过，被 #888 合并时回退掉了。
- 我们的项目 `TWEET_KEYS` 是必配的（生产无 guest 场景），所以修好 = 外壳请求带 cookie，一行级别的改动。

## 1. 机制拆解：库需要什么

| 输入                  | 来源                                       | 旧外壳 | 新外壳 |
| --------------------- | ------------------------------------------ | ------ | ------ |
| site verification key | `<meta name="twitter-site-verification">`  | ✅     | ✅     |
| anim frames           | `#loading-x-anim-*` 的 SVG path            | ✅     | ✅     |
| **key byte indices**  | `ondemand.s` chunk 内的 `(\w[n], 16)` 正则 | ✅     | ❌     |

只有 indices 绑定 webpack chunk map；另两项输入新外壳也提供。所以问题收敛为「如何拿到旧外壳」。

## 2. 关键证据

### 2.1 决定性：登录态决定拿到哪个外壳（本机实测）

同一 URL，仅切换 `Cookie` 头（cookie 来自本机 `.env` 的 `TWEET_KEYS`，`Buffer.from(key,'base64')`）：

| 模式      | URL         | 响应大小 | `ondemand.s` | meta | anim frames |
| --------- | ----------- | -------- | ------------ | ---- | ----------- |
| 匿名      | `/home`     | 16.8 KB  | **0**        | 1    | 4           |
| 带 cookie | `/home`     | 305 KB   | **1**        | 1    | 4           |
| 带 cookie | `/`         | 305 KB   | **1**        | 1    | 4           |
| 带 cookie | `/i/topics` | 305 KB   | **1**        | 1    | 4           |

**端到端**：用 cookie 版 `/home` 文档喂给真实 `FetcherService`（真实 `apiKey`），
`TWEET_DETAILS`（guest 允许）与 **`TWEET_LIKERS`（仅登录可用，即 #908 的复现接口）均成功返回**。
`ClientTransaction.create()` 初始化正常、生成 94 位 transaction id。

### 2.2 上游缺陷所在

`_handleXMigration()`（`src/services/public/FetcherService.ts`）只用 `this.config.headers` 取外壳，
cookie 只在 `request()` 组装 API 请求时才通过 `cred.toHeader()` 注入 → 外壳请求永远匿名。
#885 正是加了 `migrationHeaders['cookie'] = AuthService.decodeCookie(apiKey)` 修好的；#888 合并后丢失。
上游 Lqm1 侧亦把同一现象归因为「需要有效登录 session」（issue #20）。

### 2.3 indices 每次构建都变，不能 pin / 长期缓存

取 fa0311 维护的 legacy chunk map 历史，逐个下载当日 `ondemand.s` 并用库自带正则提取 —— **30/30 全部不同**：

| 日期  | indices     | 日期  | indices     |
| ----- | ----------- | ----- | ----------- |
| 09-24 | 19,19,21,4  | 09-09 | 1,28,3,46   |
| 09-22 | 20,37,47,5  | 09-05 | 20,45,22,32 |
| 09-19 | 47,41,13,12 | 09-01 | 11,2,33,34  |
| 09-16 | 18,15,11,13 | 08-20 | 2,1,1,30    |
| 09-12 | 9,10,21,24  | 08-14 | 42,2,4,4    |

⇒ **可缓存 URL（内容哈希、不可变），不可缓存 indices**（会算出无效 id）。必须运行时解析当前 chunk。

### 2.4 「换页面」只是时间赛跑（非本方案依赖）

匿名下 `/home`、`/`、`/explore`、`/i/grok` 恒为新外壳；`/i/topics`、`/i/display`、`/i/timeline`、
`/i/communitynotes`、`/jobs` 恒为旧外壳 —— 仅因尚未迁移。带 cookie 后所有页面都是旧外壳，无需依赖这些。

### 2.5 上游库现状

Lqm1：issue #17/#20 同一错误；历史修复为「改正则」(PR #18/#19) + 「带登录 session」(Rettiwt #885 的思路)

- 文档改指 `/home`(PR #21)。`main` 此后未改，npm 最新 `0.3.1` 即当前实现。

## 3. 方案与推荐

| 方案                            | 做法                                                      | 评价                                                      |
| ------------------------------- | --------------------------------------------------------- | --------------------------------------------------------- |
| **B 外壳请求带 cookie**（推荐） | `_handleXMigration` 附 `AuthService.decodeCookie(apiKey)` | 命中我们「cookie 必配」的场景；上游已有先例；真正修复根因 |
| A 换页面 URL                    | `/home` → `/i/topics`                                     | 仅绕过；不解决根因，且匿名下仍是时间赛跑                  |
| C 多页面探测 + 校验             | 候选列表 + 校验                                           | 匿名 fallback 才有意义                                    |
| E 缓存 URL（短 TTL）            | 只缓存 ondemand URL                                       | 降载，可叠加                                              |
| F 上游库可插拔                  | `create(doc, { onDemandFileUrl })` / 多页面 / 回退        | 长期方向，需 Lqm1 合并                                    |
| G 跟踪新栈                      | `x-tfe-transaction-id` 等新头                             | 战略观察                                                  |

**推荐**：B 为主（本项目 + 上游 PR），E 可选叠加。guest（无 key）残留问题单列（见 §4）。

## 4. 残留问题 / 后续

1. **guest 模式**（无 `apiKey`，如自部署未配 `TWEET_KEYS`）仍然匿名 → 仍会失败。上游支持 guest，
   若要覆盖，需要「候选页面探测」兜底（方案 C）或上游可插拔（F）。我们项目不涉及。
2. 向上游提 PR：以「#885 回归修复」的定位提交 B（最小、有先例、易被接受）。
3. 监控：加每日探针（匿名/登录外壳是否含 `ondemand.s`），失效告警。
4. 是否 X 会把需要 transaction id 的 legacy GraphQL 端点也迁到新栈？若迁，机制整体改变。

## 5. 复现方式

```bash
# cookie 来自 TWEET_KEYS[0]（base64）
KEY=$(grep -E '^\s*TWEET_KEYS\s*=' .env | cut -d= -f2- | cut -d, -f1 | tr -d ' ')
COOKIE=$(node -e "process.stdout.write(Buffer.from(process.argv[1],'base64').toString())" "$KEY")

UA='Mozilla/5.0 (X11; Linux x86_64; rv:144.0) Gecko/20100101 Firefox/144.0'
curl -sL --compressed -A "$UA" https://x.com/home               | grep -c ondemand.s   # 0 = 新外壳
curl -sL --compressed -A "$UA" -H "Cookie: $COOKIE" https://x.com/home | grep -c ondemand.s # 1 = 旧外壳
```
