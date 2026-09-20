# Postmortem 013: 缓存与持久化层静默失效，陈旧数据遮蔽新逻辑

- **日期**: 2026-09-18
- **严重级别**: SEV-1
- **分类**: 架构
- **状态**: Active
- **根因归类**: 设计建模

## 摘要

缓存与持久化层在三个月里以四种不同面貌造成了同一类后果：用户以为保存了、其实没写；或者新代码明明上线了、行为却不变。2026-08-14 Vision「保存」失效——`ENABLE_LOCAL_CACHE=false` 时 `setLocalCache` 静默 return，服务端仍回 `{ success: true }`，客户端还把错误吞掉。2026-08-31 发现 tweet GET/SSR 入口绕过缓存链直连上游。2026-09-12 IG Story 的读键与写键不一致，导致 story 缓存永不命中。2026-09-17 Space 新增字段后，改动前落地的缓存条目直接把渲染打崩，而且新逻辑因缓存命中从未执行。

## 影响

- 用户可见：保存后刷新即丢（假成功）；stories 永远走上游，慢且耗配额；Space 卡片渲染崩溃。
- 返工：至少四次独立排查，其中两次要读上游与依赖源码才能定位。
- 隐藏风险：静默失败意味着「没有报错」被当成「已经完成」，排障只能靠复现。

## 时间线

| 日期 | commit | 事件 |
| ---- | ------ | ---- |
| 2026-08-14 | `95f6665` | Vision 保存改为 localCache + DB 双写；排查出 env 开关导致的 no-op 与假成功 |
| 2026-08-31 | `283d109` | tweet GET/SSR 统一走 `getLocalTweet` 缓存链，此前只有 POST action 走缓存 |
| 2026-09-12 | `2f4d06c` | IG Story 的 DB 写键改为请求键；此前读键是请求键、写键是 `post.id`，永远 miss |
| 2026-09-17 | `75c7e37` | `getLocalTweet` 出口做旧缓存回填：缓存命中导致新逻辑从未执行 |
| 2026-09-17 | `75ed543` | Space 可用性状态机；后加字段让旧缓存条目 `ACTION_BY_AVAILABILITY[undefined]` 崩溃 |

## 根因分析

1. 缓存没有身份契约。读键与写键由调用方各自拼装：story 读取用 `username/story_id`、写入用 `post.id`，普通帖子恰好两者相等，把问题掩盖了。键里一旦出现 `/`，在 Windows 上还会静默写不进文件。
2. 写入被禁用时不携带信号。`setLocalCache` 在开关关闭时直接 return，调用方无从得知；服务端照样回 `{ success: true }`；客户端 `save` 又 `.catch(() => {})` 吞掉异常。三层各让一步，失败最终被压成成功。
3. 缓存对象没有 schema 与版本。`space` 后加 `availability` 后，旧条目缺少该字段，组件直接索引枚举就抛错。这与 #006 的 store 迁移、#009 的持久化语义是同一类问题。
4. 缓存与真实数据源的边界模糊。「谁必须走缓存链」没有单点约束，GET/SSR 入口可以绕过它直连上游。
5. 缓存命中会遮蔽新逻辑。命中旧条目后直接返回，新写的解析与回填代码根本不执行，只有人工清缓存才会暴露。

一句话归纳：缓存层缺少身份、版本、失败信号三个契约，于是「没写进去」和「写了旧的」都表现为无声的行为异常。

## 触发条件

环境开关（`ENABLE_LOCAL_CACHE` / `ENABLE_DB_CACHE`）关闭；读写两侧缓存键不一致；缓存对象新增字段；线上已存在旧结构条目。

## 检测

全部靠人工复现：用户反馈刷新后丢失，owner 复测「还是渲染了链接」。当时的盲区是没有断言「写入是否真的生效」，也没有缓存结构的版本校验。

## 处置

补字段级合并的 `updateTweetVisionInfo`，避免客户端旧快照整体覆盖；统一 GET/SSR 走缓存链；写键改为请求键；在 `getLocalTweet` 出口做旧结构回填并 best-effort 写回；`resolveSpacePlaybackState` 对缺失字段保守回退。

## 做得对的地方

定位时把缓存命中日志（`cache.get … hit:true`）当作事实依据，而不是继续怀疑新代码。回填是 best-effort：取数失败保持原样，不伪造墓碑。顺手发现并修掉了缓存键含 `/` 导致的静默写失败。

## 行动项

### 缓解

- [x] Vision 保存改为 localCache + DB 双写，字段级合并避免旧快照覆盖（`95f6665`）
- [x] tweet GET/SSR 统一走缓存链（`283d109`）
- [x] IG Story 写键与读键对齐为请求键（`2f4d06c`）
- [x] `getLocalTweet` 出口对旧结构做回填与升级（`75c7e37`）
- [x] Space `availability` 缺失时按早期字段保守回退（`75ed543`）

### 预防

- [ ] 缓存键收敛为单一构造函数，读写同源，并禁止键中出现路径分隔符（维护者）
- [ ] 缓存结构引入 version，新增字段必须提供默认回退或迁移（维护者）
- [ ] 写入被禁用时返回明确失败，禁止 `{ success: true }` 假成功；客户端不得无条件吞错（维护者）
- [ ] 对「必须走缓存链」的入口加一条仓库级断言，禁止直连上游（维护者）

## 教训

缓存要回答三个问题：键是谁生成的、结构变了怎么办、写失败怎么让调用方知道。缺任何一个，故障都会以「看起来没生效」的形式出现。

## Changed Files

```
app/lib/service/getTweet.server.ts
app/lib/localCache.ts
app/routes/api/ai/vision.ts
app/routes/api/ig/get.ts
app/lib/ig/normalizeIGPost.ts
app/lib/react-tweet/utils/space.ts
app/lib/react-tweet/api-v2/get-tweet.ts
app/components/tweet/TweetSpaceCard.tsx
```

## 关联报告

- #006 状态管理：同类「持久化结构变更无迁移」
- #009 句首补充：同一「持久化语义未定义」的家族
- #014 上游契约漂移：上游对象变瘦后同样落到缓存里的旧结构
