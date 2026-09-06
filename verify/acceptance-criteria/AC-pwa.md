# PWA 安装 + Web Share Target 验收标准

> 版本：1.0 | 日期：2026-09-06（新增 AC-PWA-001/002/003）
> 对应规范：[MDN share_target](https://developer.mozilla.org/en-US/docs/Web/Manifest/share_target)
> 关联 Verifier：`test/acceptance/ac-pwa.spec.ts`（AC-PWA-001/002 静态检查）+ `test/unit/share.spec.ts`（AC-PWA-003 语义）
> 执行命令：`bun verify --module pwa`

---

## 背景

anonTweet 以**首页 "/" 作为 Web Share Target 的 GET 接收点**：Chrome Android 将站点
安装为 PWA 后，其它 App 通过系统分享转发链接时，anonTweet 会出现在分享面板；选中后
Chrome 带 `title/text/url` query 重新打开首页，首页 `TweetInputForm` 一次性预填 + 自动提交
（可识别 X/IG 链接 → 跳 `/tweets/:id | /ins/:id`；不可识别 → 留框报错待手动，与手动粘贴一致）。

service worker 为**极简网络透传**：不缓存、不做离线，仅用于满足 Chrome「可安装 PWA」判定
并保持 SSR/serverless 导航每次回源。

---

## AC-PWA-001：manifest 声明可安装 PWA 且配置了首页 GET 的 share_target

- **验证方法**：`bun verify --ac AC-PWA-001`（`test/acceptance/ac-pwa.spec.ts`）
- **Pass 条件**：
  - `public/manifest.webmanifest` 为合法 JSON，含 `display: standalone`、`start_url: "/"`、`scope: "/"`
  - `share_target.method === "GET"`、`action === "/"`、`params` 含 `url/text/title` 三字段
  - manifest `icons` 声明 192x192 与 512x512，且 `public/icons/pwa-192x192.png` /
    `public/icons/pwa-512x512.png` 实际存在
  - `app/root.tsx` 通过 `links()` 输出 `<link rel="manifest" href="/manifest.webmanifest">`

---

## AC-PWA-002：service worker 为网络透传且仅生产注册（零缓存、零离线回归）

- **验证方法**：`bun verify --ac AC-PWA-002`（`test/acceptance/ac-pwa.spec.ts`）
- **Pass 条件**：
  - `public/sw.js` 注册 `install`/`activate`/`fetch`，含 `skipWaiting()` 与 `clients.claim()`
  - **绝不写入 CacheStorage**：源码无 `caches.open` / `cache.add` / `cache.put`
  - fetch 仅对**同源 GET** `respondWith(fetch(request))` 网络透传；异源（googleapis / CDN）与非
    GET 不设 handler（交给浏览器默认，绝不接管 SSR HTML 导航与 `/api/*`）
  - `app/lib/pwa/register.ts` 仅在**安全上下文**（`window.isSecureContext`）下注册 `/sw.js`
    （含 `'serviceWorker' in navigator` 守卫；明文 http 局域网不注册），且被 `app/root.tsx`
    的 root 组件 `useEffect` 调用

---

## AC-PWA-003：接收决策与首页手动提交同语义（可识别自动打开 / 不可识别留框报错）

- **验证方法**：`bun verify --ac AC-PWA-003`（`test/unit/share.spec.ts`）
- **Pass 条件**（`app/lib/share.ts`）：
  - `pickSharedInput` 优先级 url → text → title
  - `resolveShareTarget`：X/twitter.com/mobile 链接或纯数字 id → `/tweets/{id}`；
    IG p/reel → `/ins/{shortcode}`、stories → `/ins/{user}/{id}`；混在正文里的 X 链接也能识别；
    空串/不可识别文本 → `{ ok:false, error }`（调用方留框报错，不自动跳转）

---

## 真机验证（沙箱无设备，提交后由部署者在真机执行）

前置：https://anon-tweet.chilfish.top/ 已部署本特性并 HTTPS 可达。

1. Android Chrome 打开首页 → 菜单「安装应用 / 添加到主屏幕」→ 装为 PWA。
   （可安装性检查：地址栏若出现安装提示即满足；否则查 `Application > Manifest` 与 SW 状态。）
2. 用另一 App（如浏览器/X/IG 官方或任意有分享按钮的 App）打开一条推文 → 点「分享」→
   系统分享面板应出现 **Anon Tweet**。
3. 选中后应自动跳转并加载该推文 / IG 帖子（首页自动预填并提交，效果等同手动粘贴）。
4. 分享一条非链接文本 → 应落在首页，输入框已填内容并显示「无法识别…」错误待手动改。

> 图标为从 `public/icon.webp` 生成的方形 PNG（透明背景）。**图标美术 / `theme_color` /
> maskable 变体属视觉项，最终观感需所有者验收微调**（本仓库历史惯例）。

---

## 变更约定

新增/调整分享接收语义或 PWA 基建时同步：`public/manifest.webmanifest`、`public/sw.js`、
`app/lib/share.ts`、`app/components/tweet/TweetInputForm.tsx` 与对应 spec。
