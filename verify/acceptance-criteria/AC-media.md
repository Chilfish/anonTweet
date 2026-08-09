# 媒体代理验收标准

> 版本：1.0 | 日期：2026-08-09
> 对应 Postmortem：[005 (Media Handling)](../../docs/postmortem/005-media-handling.md)
> 关联 Verifier：`verify/modules/media.verifier.ts`
> 执行命令：`bun verify --module media [--ac AC-MEDIA-NNN]`
>
> **确定性实现说明**：AC-MEDIA-001/002 的「代理可达」不使用真实 CDN URL（会随上游状态漂移、离线环境不可用），
> 而是启动一个本地像素图服务器（`Bun.serve`，随机端口），构造既满足白名单又本地可达的 URL，
> 由代理端点真实转发。后缀白名单（AC-001）与 IG 域名白名单（AC-002）两条路径都被覆盖，且完全离线确定。

---

## AC-MEDIA-001：Tweet 图片代理可达

- **输入**：`GET /api/proxy/image?url=<图片 URL>`（后缀白名单路径，如 `http://localhost:<p>/tweet-sample.png`）
- **预期输出**：代理端点成功转发上游图片
- **Pass 条件**（集成，需 `--server`）：
  - HTTP 状态码 200
  - Content-Type 包含 `image/*`

---

## AC-MEDIA-002：IG 图片代理可达

- **输入**：`GET /api/proxy/image?url=<含 cdninstagram.com 的 URL>`（域名白名单路径）
- **预期输出**：代理端点成功转发上游图片
- **Pass 条件**（集成，需 `--server`）：
  - HTTP 状态码 200
  - Content-Type 包含 `image/*`

---

## AC-MEDIA-003：无效 URL 返回错误

- **输入**：缺失 `url` 参数 / 白名单外 URL
- **预期输出**：返回 4xx 错误而非崩溃或透传
- **Pass 条件**（集成，需 `--server`）：
  - 缺失 `url` → HTTP 400
  - 白名单外（非图片后缀、非 IG 域名）→ HTTP 403

---

## AC-MEDIA-004：URL 转换无重复协议

- **验证对象**：`app/lib/stores/appConfig.ts` 的 `useProxyMedia` 幂等守卫 + 全库代码扫描
- **背景**：Postmortem #005 的「双代理」隐患 —— 一旦代理已加前缀，重复应用会产出 `https://https://…`
- **Pass 条件**：
  - `useProxyMedia` 含幂等守卫 `url.startsWith(mediaProxyUrl)`（防重复加前缀）
  - `app/` 源码不含 `https://https://` 字面量

---

## AC-MEDIA-005：Tweet 媒体组件使用统一代理

- **验证对象**：Tweet 媒体渲染 / 截图组件源码扫描
- **背景**：Postmortem #005 要求媒体 URL 统一走代理入口，避免各组件自造 URL 导致漏代理/双代理
- **Pass 条件**：
  - 统一代理入口 `useProxyMedia` 在 `app/lib/stores/appConfig.ts` 导出
  - Tweet 媒体组件（`TweetCard.tsx` / `app/lib/react-tweet/utils/index.ts`）调用 `proxyMedia` 转换媒体 URL
  - 组件源码不直接硬编码受限 CDN URL（`pbs.twimg.com` / `video.twimg.com`）
- **注**：IG 组件直接使用 `display_url` 属合理例外 —— IG CDN 对图片 GET 开放 CORS，无 canvas 污染问题，不在本 AC 约束内

---

## AC-MEDIA-006：视频媒体 URL 正确处理

- **验证对象**：IG 媒体组件视频渲染分支 + `IGMedia` 类型定义
- **Pass 条件**：
  - `IGMedia` 类型含 `video_url` 字段（`app/types/ins.ts`）
  - `IGMediaGrid.tsx` 在 `media.type === 'video'` 分支使用 `media.video_url` 渲染

---

## 总计：6 条 AC

| AC           | 分类         | 依赖外部服务         |
| ------------ | ------------ | -------------------- |
| AC-MEDIA-001 | 集成         | 否（本地像素服务器） |
| AC-MEDIA-002 | 集成         | 否（本地像素服务器） |
| AC-MEDIA-003 | 集成         | 否                   |
| AC-MEDIA-004 | 静态代码检查 | 否                   |
| AC-MEDIA-005 | 静态代码检查 | 否                   |
| AC-MEDIA-006 | 静态代码检查 | 否                   |
