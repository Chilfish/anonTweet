# Release Checklist

> 目标：验证 release 包满足发布标准。
> 执行环境：本地 `bun run build` + 生产环境冒烟 / Vercel 部署后验证。

## 版本纪律

两个版本域**各自单源**，禁止同一域内手改多处：

- **应用 / API 版本** — 单源 `package.json` 的 `version` 字段。
  `/openapi.json` 的 `info.version` 与随附快照
  `.agents/skills/anon-tweet/references/anon-tweet-openapi.json` 均由
  `app/lib/llms.ts` 直接读取该字段注入，不手写；
  `test/unit/llms.spec.ts`（AC-LLMS-002）做版本奇偶校验兜底。
- **anon-tweet skill 版本** — 单源 `SKILL.md` 的 `metadata.version`
  （第三方安装器 `npx skills add` 读取该字段）。`scripts/anon-tweet.ps1` 的
  User-Agent 运行时从 `../SKILL.md` 读取，不再维护手写副本。
  skill 独立于应用发版：skill 迭代不代表应用接口变更，反之亦然。
- 发版走 `docs/engineering/git-workflow.md#版本发布`：CHANGELOG 更新 → 版本号 → PR → tag → GitHub Release
- **tag 只打在门禁绿的 commit 上**
- 版本号严格递增，禁止回退

## 本地门禁（push 前）

- [ ] `bun run typecheck` 通过
- [ ] `bun run lint` 通过（无 error）
- [ ] `bun run test` 全部通过
- [ ] `bun run verify/index.ts --exit-on-fail` 全部 PASS（离线 AC）
- [ ] Postmortem 预发布检查（对照 `docs/postmortem/README.md`：Changed Files 重叠？模式复现？）

## 构建与部署

- [ ] `bun run build` 成功产出 `.react-router/` 产物
- [ ] Vercel 部署成功（`VERCEL=true` 已设置）
- [ ] 生产域名 `HOSTNAME` 配置正确（截图回调依赖）

## 功能冒烟（生产环境）

### Twitter

- [ ] `/tweets/:tweetId` 渲染 + Hydration 正常
- [ ] `/plain/:tweetId` 截图路由渲染正常
- [ ] `/plain/:tweetId?translation=true` AI 翻译实体正常
- [ ] 媒体代理正常（图片/视频可加载，无双代理/漏代理）

### Instagram

- [ ] `/ins/:shortcode` 透卡相框 + 九宫格媒体正常
- [ ] `/plain-ins/:shortcode` 纯净版渲染正常
- [ ] IG caption 翻译正常（`isChinese()` 守卫 + DB 回写）

### 稳定性

- [ ] 冷启动无崩溃、无 SSR mismatch（浏览器 console 无 error）
- [ ] 无网络：错误提示明确
- [ ] 多 `TWEET_KEYS` 负载均衡正常（429/401/403 轮换）

## 验证套件（生产相关 AC）

- [ ] `bun run verify/index.ts --module tweet`（含集成 AC，需 `TWEET_KEYS`）
- [ ] `bun run verify/index.ts --module translation`
- [ ] `bun run verify/index.ts --module ig`（离线 AC）

> 真机/生产验证由作者在发布前执行，勾选并记录日期。
