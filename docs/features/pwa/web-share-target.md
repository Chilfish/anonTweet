# 可安装 PWA + Web Share Target（系统分享直达推文/IG）

> 方案文档 | 2026-09-06 | 关联 AC：`verify/acceptance-criteria/AC-pwa.md`（AC-PWA-001/002/003）

## 1 目标

让 anonTweet 在 Chrome Android 上**可安装为 PWA**，且其它 App 通过**系统分享**转发 X / IG
链接时能直达内容：分享 → 选 Anon Tweet → 首页自动预填该链接并提交 → 加载对应推文 / IG 帖子。
对不可识别文本则落在首页留框报错，与手动粘贴体验一致。

## 2 非目标（明确不做）

- **不做离线缓存 / 离线可用**：本应用是 SSR + Vercel serverless，页面与 `/api/*` 每次必须回源。
  service worker 只用于满足 Chrome「可安装」判定，绝不缓存任何响应。
- 不做 iOS Safari 专项适配（用户场景为 Chrome Android）。
- 不做 `POST`/文件接收（本需求只需链接/文本，GET 足够且无需 SW 拦截）。

## 3 设计

### 3.1 接收点 = 首页 "/"

`share_target` 用 **GET** 指向首页 `/`（`public/manifest.webmanifest`）。系统分享命中后 Chrome
带 `title/text/url` query 重开首页。不单独造接收中转页——直接复用首页 `TweetInputForm` 的提交
逻辑，保证与手动粘贴的校验、报错、跳转完全一致（见 `app/lib/share.ts`）。

流程：

```
系统分享 → Chrome 打开 https://anon-tweet.chilfish.top/?url=..&text=..&title=..
  → 首页 TweetInputForm 一次性 readOnce：
      content = pickSharedInput(url|text|title)   // url 优先
      setInput(content)
      resolveShareTarget(content)
        ok    → navigate(result.to)               // /tweets/:id | /ins/:id
        !ok   → setError(result.error)            // 留框报错待手动
```

### 3.2 纯函数分层

- `app/lib/url-detect.ts`（新增，纯）：`extractTweetId / extractIGId / detectInputType`，
  自 `utils.ts` 抽离（utils 顶层 import UI/toast，纯单测与 SSR 不该为它牵连 DOM 链）。`utils.ts`
  以 re-export 保持既有调用点不变。
- `app/lib/share.ts`（新增，纯）：`pickSharedInput / resolveShareTarget / hasSharedContent`。
- `TweetInputForm.tsx`：提交改为经 `resolveShareTarget`；新增一次性分享落地 effect（ref 守卫）。

### 3.3 PWA 基建（极简，无新运行时依赖）

| 文件                                               | 作用                                                                    |
| -------------------------------------------------- | ----------------------------------------------------------------------- |
| `public/manifest.webmanifest`                      | manifest：`display: standalone`、图标、`share_target`（GET → `/`）      |
| `public/icons/pwa-192x192.png` / `pwa-512x512.png` | 由 `public/icon.webp` 生成的方形 PNG（magick extent 透明补齐）          |
| `public/sw.js`                                     | 极简 SW：同源 GET 网络透传、绝不写 Cache、`skipWaiting`/`clients.claim` |
| `app/lib/pwa/register.ts`                          | 仅生产注册 `/sw.js`（`import.meta.env.PROD` + feature detect）          |
| `app/root.tsx`                                     | `<link rel="manifest">` + `theme-color` meta + root 组件注册 SW         |
| `vercel.json`                                      | 为 `/manifest.webmanifest` 补 `application/manifest+json` Content-Type  |

### 3.4 SW 为什么这样写

Chrome Android 的可安装判定需要一个**控制页面的 service worker**；但我们不要离线与 precache
（serverless SSR 导航必须回源）。因此 `sw.js` 只做同源 GET 的网络透传，`fetch` 里明确：
非 GET 与异源一律 `return` 交给浏览器默认，绝不接管 HTML 导航 / `/api/*`，规避部署后旧 SW 滞留与
离线快照问题。变更用 `skipWaiting + clients.claim`，配合零缓存实现即时新 SW 接管。

## 4 关键取舍

- **复用首页而非中转页**：跳转/报错与手动提交一致，无第二套解析逻辑可漂移。
- **GET 而非 POST**：接收文本/链接不需要文件与副作用；GET 落地是普通页面加载，SW 不必拦截。
- **不用 vite-plugin-pwa/Workbox**：SSR 的 HTML 由运行时产出，其「注入 HTML」的自动装配不适用；
  离线 precache 与 serverless 导航冲突。以手写极简 SW（~15 行）满足判定，零依赖、零构建集成风险。

## 5 真机验证

见 `AC-pwa.md`「真机验证」。前置：https://anon-tweet.chilfish.top/ 部署本特性。
图标美术 / `theme_color` / maskable 为视觉项，最终观感由所有者验收（本仓库惯例）。
