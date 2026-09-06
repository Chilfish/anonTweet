# PWA 安装 + Web Share Target 验收标准

> 版本：1.3 | 日期：2026-09-06（v1.0 新增 AC-PWA-001/002/003；v1.1 增 AC-PWA-004/005/006：
> iOS 安装外壳 head meta、manifest shortcuts + screenshots、Web Share 出向分享；
> v1.2 增 AC-PWA-007：截图卡片以文件形式系统分享（Web Share Level 2 files）；
> v1.3 增 AC-PWA-008：已安装用户优雅版本更新（新版本探测 → 提示刷新，不自动打断））
> 对应规范：[MDN share_target](https://developer.mozilla.org/en-US/docs/Web/Manifest/share_target)、
> [MDN Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API)、
> [MDN Navigator.canShare](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/canShare)、
> [MDN Service Worker 更新](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers)、
> [MDN manifest screenshots/shortcuts](https://developer.mozilla.org/en-US/docs/Web/Manifest)
> 关联 Verifier：`test/acceptance/ac-pwa.spec.ts`（AC-PWA-001/002/004/005/008 静态检查）+
> `test/unit/share.spec.ts`（AC-PWA-003/006/007 语义）+ `test/unit/pwa-update.spec.ts`（AC-PWA-008 语义）
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

## AC-PWA-004：iOS 安装外壳（root `<head>` 补 apple 系 meta 与图标）

- **验证方法**：`bun verify --ac AC-PWA-004`（`test/acceptance/ac-pwa.spec.ts`）
- **Pass 条件**：
  - `app/root.tsx` 的 `<head>` 含 `<link rel="apple-touch-icon">`（`/icons/apple-touch-icon.png`）与
    `apple-mobile-web-app-capable`、`apple-mobile-web-app-status-bar-style` meta（iOS Safari 忽略多数
    manifest 字段，仅认这些 head 声明，缺则「添加到主屏幕」不进入全屏 App 形态）
  - `public/icons/apple-touch-icon.png`（180x180，不透明底）实际存在

## AC-PWA-005：manifest shortcuts + screenshots（安装对话框与快捷方式）

- **验证方法**：`bun verify --ac AC-PWA-005`（`test/acceptance/ac-pwa.spec.ts`）
- **Pass 条件**：
  - `public/manifest.webmanifest` `shortcuts` 含指向 `/search` 的入口（name/url 合法、复用安装图标）
  - `screenshots` 含 ≥2 条：`src` 指向真实存在文件、`sizes` 合法、`form_factor` 覆盖 `wide` 与 `narrow`、
    `type` 为 `image/png`（Chrome 安装对话框展示；尺寸至少 320px 一边、真实 App 页面截图）

## AC-PWA-006：Web Share 出向（把正在看的推文/IG 分享出去）

- **验证方法**：`bun verify --ac AC-PWA-006`（`test/unit/share.spec.ts`）
- **Pass 条件**（`app/lib/share.ts` 出向纯函数）：
  - `buildTweetSharePayload`：`url` 取 `tweet.url` 或回退 `https://x.com/{screen_name}/status/{id_str}`；
    `title` 含作者名与 handle；`text` 优先译文（entities 含 translation/aiTranslation）否则原文
  - `buildIGSharePayload`：`url` = `post.url`；`title` 含 `@username`；`text` 优先 `captionTranslation`
    否则 `description`
  - `canNativeShare()`：无 `navigator.share`（Node / 旧浏览器）返回 `false`，供调用方降级复制链接

---

## AC-PWA-007：截图卡片以文件系统分享（Web Share Level 2 files）

- **验证方法**：`bun verify --ac AC-PWA-007`（`test/unit/share.spec.ts`）
- **背景**：现有「截图」管线已产出卡片 PNG/JPEG（modern-screenshot dataURL），本 AC 把产物作为
  `File` 走系统分享（`navigator.share({ files })`），减少「先下载再转发」；无能力环境回退下载保存。
- **Pass 条件**（`app/lib/share.ts` 出向图片辅助 + 两处 OptionsMenu）：
  - `dataUrlToFile(dataUrl, filename)`：正确解析 `data:image/png;base64,…`（含 `,` 负载）为 `File`，
    类型/文件名正确、字节与 base64 一致
  - `canShareFiles(file)`：无 `navigator.canShare`（Node / 旧浏览器 / Firefox）返回 `false`
  - `shareImageOut(file, title, text?)`：`canShareFiles` 为 false 返回 `'unsupported'`；支持时调
    `navigator.share({ files, title, text })`，用户取消（AbortError）返回 `'aborted'` 不报错
  - 推文与 IG 三点菜单均含「分享截图」项：能分享时 `navigator.share({files})`；`'unsupported'` /
    分享失败时回退 `a[download]` 保存并 toast 提示

---

## AC-PWA-008：已安装用户优雅版本更新（探测 → 提示刷新，不自动打断）

- **验证方法**：`bun verify --ac AC-PWA-008`（`test/acceptance/ac-pwa.spec.ts` 静态 +
  `test/unit/pwa-update.spec.ts` 语义）
- **背景**：SW 网络透传、零缓存（AC-PWA-002），无「旧 HTML 滞留」问题；已打开窗口跑旧 bundle 的
  唯一解法是 reload。本 AC 不自动刷新（避免打断翻译/阅读），改为**检测到新版本后提示用户刷新**。
- **Pass 条件**：
  - `app/lib/pwa/update.ts`：可见/聚焦时**节流**调 `registration.update()`；监听 `updatefound` →
    `reg.installing` 的 `statechange`；判定函数 `shouldOfferUpdate(hasController, state)` ——
    **无 controller（首次访问/纯初次安装）不提示**；`installed/activating/activated` 且受控才提示
    （`test/unit/pwa-update.spec.ts`）
  - `app/components/pwa/UpdateNotice.tsx` 挂载于 root：提示横幅「发现新版本」+「立即刷新」按钮，
    reload 前若存在 `waiting` worker 先 `postMessage({ type: 'SKIP_WAITING' })`；可「稍后」隐藏（单会话）
  - `public/sw.js` 支持 `SKIP_WAITING` message（`self.skipWaiting()`），保留零缓存铁律
  - root `<body>` 已挂载 `<UpdateNotice />`（静态断言，`test/acceptance/ac-pwa.spec.ts`）

---

## 真机验证（沙箱无设备，提交后由部署者在真机执行）

前置：https://anon-tweet.chilfish.top/ 已部署本特性并 HTTPS 可达。

1. Android Chrome 打开首页 → 菜单「安装应用 / 添加到主屏幕」→ 装为 PWA。
   （可安装性检查：地址栏若出现安装提示即满足；否则查 `Application > Manifest` 与 SW 状态。）
2. 用另一 App（如浏览器/X/IG 官方或任意有分享按钮的 App）打开一条推文 → 点「分享」→
   系统分享面板应出现 **Anon Tweet**。
3. 选中后应自动跳转并加载该推文 / IG 帖子（首页自动预填并提交，效果等同手动粘贴）。
4. 分享一条非链接文本 → 应落在首页，输入框已填内容并显示「无法识别…」错误待手动改。
5. iOS Safari 打开首页 → 「分享 → 添加到主屏幕」→ 以全屏独立形态打开（无浏览器栏）；
   iOS 上 share_target 不受支持属已知限制（手动粘贴路径仍可用）。
6. 出向分享：Android/iOS/桌面 Chrome 打开一条推文或 IG 帖子 → 三点菜单「分享」→ 系统分享面板出现
   文本 + 原文链接；无 `navigator.share` 的环境（或取消分享）不报错，回退复制原文链接并提示。
7. 安装对话框（Android Chrome 安装应用时）应展示 `screenshots` 中的真实页面截图；长按图标快捷方式
   含「搜索推文」直达 `/search`。
8. 分享截图：Android Chrome / 桌面 Chrome 打开推文或 IG → 三点菜单「分享截图」→ 系统分享面板出现
   卡片图片（可发送到聊天/相册）；在不支持 files 分享的环境（如 Firefox）应回退下载保存并提示。
9. 版本更新：部署新版（改 sw.js 字节）后，保持一个已打开窗口不刷新 → 回到页面（可见/聚焦）应出现
   「发现新版本」横幅 → 点「立即刷新」后页面加载新版本；首次访问不弹横幅。Android 安装应用在后台
   被更新后，下次启动也应直接是新版本。

> 图标为从 `public/icon.webp` 生成的方形 PNG（透明背景）。**图标美术 / `theme_color` /
> maskable 变体属视觉项，最终观感需所有者验收微调**（本仓库历史惯例）；`apple-touch-icon.png`
> 为白底 180x180（iOS 要求不透明），生成命令见开发日志，观感不喜可换底色重生成。

---

## 变更约定

新增/调整分享接收/出向语义或 PWA 基建时同步：`public/manifest.webmanifest`、`public/sw.js`、
`app/root.tsx`（head meta + UpdateNotice 挂载）、`app/lib/share.ts`（入向 + 出向纯函数 + 图片文件
分享辅助）、`app/lib/pwa/update.ts`（版本更新探测）、`app/components/pwa/UpdateNotice.tsx`、
`app/components/tweet/TweetInputForm.tsx`、`app/hooks/use-tweet-operations.ts`、
`app/hooks/use-ig-operations.ts`、`app/hooks/use-screenshot-action.ts`、
`app/hooks/use-ig-screenshot-action.ts`、`app/components/tweet/TweetOptionsMenu.tsx`、
`app/components/ins/IGOptionsMenu.tsx` 与对应 spec。
