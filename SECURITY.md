# 安全政策

## 报告漏洞

请不要用公开 issue 报告安全问题，走 GitHub 的私有渠道：

<https://github.com/Chilfish/anonTweet/security/advisories/new>

报告里尽量写清：

- 受影响的版本或 commit
- 复现步骤或 PoC
- 影响范围：能读到什么、能改到什么
- 如果已有思路，附上修复建议

确认问题后我会回复，修复发布后再公开讨论细节。如果你愿意，可以在发布说明里署名致谢。

## 视为漏洞的情况

- 绕过 `/api/proxy/image` 的 URL 白名单，造成 SSRF
- 未授权读到别人的缓存数据，或命中数据库里的敏感字段
- 服务端泄露 `TWEET_KEYS`、`INS_COOKIES`、`DB_URL`、AI API Key 等环境变量
- 注入类问题：命令注入、XSS、SQL 注入
- 绕过 `ENABLE_TIMELINE` 等功能开关

## 不视为漏洞的情况

- 上游 Twitter / Instagram 自身的限流、封禁或风控
- 需要用户主动把自己的凭据交给别人的场景
- 单纯的技术栈版本 banner、缺少某些安全响应头

## 部署者注意

- `TWEET_KEYS` 是账号 Cookies 的 Base64 编码，权限等同于账号密码，`INS_COOKIES` 同理
- 凭据只通过 `.env` 注入，由 `app/lib/env.server.ts` 统一读取，不要写进代码或提交到仓库
- 公开部署建议设置 `ENABLE_AI_BASE_URL_WHITELIST=true`，配合 `ALLOWED_AI_BASE_URL_HOSTS` 限制 AI 请求可以打到哪些 baseUrl

## 支持的版本

安全修复只针对 `main` 分支和最新的发布版本。
