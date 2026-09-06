# PWA 能力盘点（DevTools 截图对照 → 场景裁决）

> 盘点文档 | 2026-09-06 | 触发：所有者提供 `Application > Service Workers` 截图（origin
> `https://anon-tweet.chilfish.top/`，SW #6900 activated & running）+ 一份「PWA 还能做什么」能力清单，
> 问：anonTweet 还有哪些未发掘的 PWA 场景？
> 关联：`verify/acceptance-criteria/AC-pwa.md`（AC-PWA-001/002/003）、`docs/features/pwa/web-share-target.md`、
> `docs/planning/backlog.md`「独立增量」条目。

---

## 1. 线上状态核查（2026-09-06 23:1x，直连 https://anon-tweet.chilfish.top/）

| 检查项 | 结果 |
| --- | --- |
| `GET /sw.js` | 200，993 B，与仓库 `public/sw.js` 同源（极简网络透传：install `skipWaiting` + activate `clients.claim` + 同源 GET `respondWith(fetch(request))`，无任何 Cache 写入） |
| `GET /manifest.webmanifest` | 200，`Content-Type: application/manifest+json`（`vercel.json` 规则生效）；内容含 `display: standalone` / `start_url`/`scope: "/"` / 192+512 any 图标 / `share_target`(GET `/`，url/text/title)，与仓库一致 |
| `/` HTML `<head>` | 有 `<link rel="manifest">` 与 `theme-color`；**缺** `apple-touch-icon` / `apple-mobile-web-app-*`（无 iOS meta） |
| manifest | **缺** `maskable` 图标 / `screenshots` / `shortcuts` / `display_override` |
| SW 生命周期 | 截图显示 #6900 activated & running，Update Cycle install→wait→activate 正常；网络透传 + `skipWaiting`+`clients.claim` ⇒ 部署更新无「旧 SW 滞留」风险 |

**结论**：线上部署与仓库同步、PWA 判定要素齐备、SW 健康。注册门禁 = `window.isSecureContext`
（生产 https / localhost / 本地 Caddy https LAN 注册；明文 http 不注册，见 `app/lib/pwa/register.ts`）。

## 2. 现状与约束（裁决依据）

**已实现的 PWA**：

- 可安装：standalone manifest + 192/512 图标 + 极简 SW + `register.ts` 安全上下文注册；
- **Web Share Target（收）**：系统分享 X/IG 链接 → 首页 GET 接收 → `TweetInputForm` 预填自动跳
  `/tweets/:id | /ins/:id`，不可识别留框报错（AC-PWA-001/002/003 已绿）；
- 通用 Web 能力（非 PWA 专属）：`navigator.clipboard` 写（文本/Markdown/词典）、截图
  `modern-screenshot` → `a[download]`、媒体 `a[download]` 下载。

**明确「无」的状态痕迹**（仓库级 grep + 盘点）：用户账号/登录、收藏书签、未读/badge、通知/push、
离线队列/后台轮询、`navigator.share` 外发、`showSaveFilePicker`、Wake Lock、MediaSession、
beforeinstallprompt、`onLine` 处理。

**硬约束**：

- SSR（React Router v8）/ serverless：HTML 每次回源，SW 铁律 **零缓存**（AC-PWA-002）——有意为之，
  防部署后旧 SW / 旧 HTML 滞留；
- 匿名只读工具：无账号、无关注/未读/站内事件，**没有可推给用户的「事件源」**；
- 无自有常驻后端 Worker（serverless 函数为主）→ 推送/订阅类需额外常驻基建；
- 客户端持久化全部 localStorage（app-config-store / translation-store 仅 settings+mode /
  translation-dictionary-storage / bili cookie-store），无 IndexedDB；推文正文只走服务端缓存链。

## 3. 能力清单逐项裁决

| # | 能力（来源清单） | 现状 | 裁决 | 理由 / 备注 |
| --- | --- | --- | --- | --- |
| 1 | A2HS 可安装 | ✅ 已实现 | 收尾 | standalone/图标/SW/theme-color 齐备；**真机安装验证仍待 owner**（backlog） |
| 2 | iOS PWA 外壳元数据 | ❌ 缺 | **P0 做** | iOS Safari 忽略多数 manifest，认 `<head>` meta/图标：补 `apple-touch-icon` + `apple-mobile-web-app-capable` + `apple-mobile-web-app-status-bar-style`——与 ui-design「iOS PWA 原生感」目标直接相关；纯 `<head>` 小改、零风险 |
| 3 | maskable 图标 | ❌ 缺 | P0（资产，待 owner） | Android 会把图标裁成圆/自适应，现方形透明 any 图标会被裁难观；需生成含 80% 安全区的 maskable PNG 并声明 `purpose: "any maskable"`；backlog 已记「视觉遗留」 |
| 4 | manifest `screenshots` / `shortcuts` | ❌ 缺 | P1 候选 | Chrome 安装对话框更丰富 + 右键/长按快捷方式直达 `/search`；素材可复用 `public/images/ui-*.png` |
| 5 | `display_override` / WCO | ❌ | 不做（延后） | 桌面目标 macOS 原生感、WCO 仅 Chromium 桌面有意义，收益低 |
| 6 | 离线 App 内容 / SW 缓存 / IndexedDB 内容缓存 | ❌ 有意为零 | **不做** | 匿名只读「即看即取」无离线必读诉求；数据来自私有 API + AI，回源铁律（AC-PWA-002）与 serverless 导航冲突；推文无客户端草稿可缓存 |
| 7 | 静态资源网络优先缓存（弱网壳加速） | ❌ | 延后（需 ADR） | 有微弱价值（hash 静态 JS/CSS precache），但需修订 AC-PWA-002 铁律 + 更新/rollout 策略评审；**现阶段不动** |
| 8 | Background Fetch 大文件后台 | ❌ | 不做 | 素材小图/短视频，下载即时完成，无「关页继续下」场景 |
| 9 | Background Sync | ❌ | 不做 | 无离线写队列模型；手动翻译/AI 落库在服务端即时完成 |
| 10 | Periodic Background Sync | ❌ | 不做 | 无周期跟新数据需求（非订阅型产品） |
| 11 | Web Push | ❌ | **不做** | 无账号/关注/未读 ⇒ 无推送事件源；VAPID+订阅管理+常驻后端与匿名模型冲突（明列不做清单） |
| 12 | Badging / Notification Triggers | ❌ | 不做 | 无未读/预约语义 |
| 13 | Payment Handler | ❌ | 不做 | 无支付 |
| 14 | File System Access（另存为） | ❌ | P2 候选 | 桌面导出截图/媒体的「保存到…」增强；现 `a[download]` 已可用，价值中低 |
| 15 | Share Target 接收 | ✅ 已实现 | 真机验证 | 移动端系统分享 → 直达；**待 owner 真机验证**（AC-pwa.md「真机验证」清单） |
| 16 | Share Target L2（POST 收文件/图） | ❌ | 不做 | 收图后无下游管线（无反向检索/导入） |
| 17 | **对外分享 `navigator.share`** | ❌ 无 | **P1 候选（推荐）** | 现只有「收」没有「出」：推文/IG 详情 OptionsMenu 加「分享」（title+text+url），与 share_target 成对闭环「进/出」；无 `navigator.share` 环境降级为复制链接。安装用户从「看」到「传」的天然下一步 |
| 18 | BT / USB / Serial / Contacts / WebRTC | ❌ | 不做 | 无硬件/音视频/通讯录业务场景 |
| 19 | Screen Wake Lock | ❌ | 不做 | 截图/翻译/阅读均秒级，无常亮诉求 |
| 20 | Clipboard | ✅ 已用 | — | 写文本/Markdown/词典；无读剪贴板场景 |
| 21 | Speculative prefetch | ❌ | P2 候选 | 无历史/预测源收益低；若做「最近查看」后可配合 `<Link prefetch>` 预热 |
| 22 | Media Session | ❌ | 延后 | `media.tsx` 有 `<video>`（preload=metadata）；仅解锁播放时锁屏控制有价值，收益低 |
| 23 | 「最近查看 / 本地历史」 | ❌（弱 PWA 关联） | P2 候选 | 无账号下解决「回访同一推文/IG」痛点：localStorage 记最近 N 条 → 首页快捷入口；与词典同思路，成本低 |

## 4. 建议下一步（待 owner 裁决）

**P0（收尾，可与真机验证同批）**

1. root `<head>` 补 iOS meta + `apple-touch-icon`（引 `/icons/pwa-192x192.png` 或新 180 图标）；
2. maskable 图标资产 + manifest `icons[].purpose` 扩展（视觉项，owner 出图）；
3. owner 真机验证安装 + 系统分享（backlog 待办收口）。

**P1（新体验）**

4. 「分享」外发（Web Share API + 复制链接降级）——与现有 share_target 对称；
5. manifest `shortcuts` + `screenshots`（安装对话框增强）。

**P2（可选 / 延后）**

6. `showSaveFilePicker` 桌面导出另存为；7. 「最近查看」本地历史；8. 静态资源缓存（先 ADR）。

**不做（明列，理由见 §3）**：离线 App 内容 / IndexedDB 内容缓存 / Background Sync / Periodic Sync /
Web Push / Badging / Payment / BT-USB-Serial / Wake Lock / 分享收文件。

## 5. 变更约定（若实施）

- **iOS meta / maskable / shortcuts / screenshots**：`app/root.tsx`、`public/manifest.webmanifest` +
  图标资产；AC-PWA-001 静态检查需同步扩展（manifest `purpose`、head 断言）。
- **share 外发**：OptionsMenu（tweet/IG）加按钮 → `app/lib/share.ts` 补「出方向」纯函数（title/text/url
  组装 + 降级复制），配 unit（`share.spec.ts` 扩展，AC-PWA-004 可挂）；无 `navigator.share` 时隐藏或降级。
- **动离线策略前**：先写 ADR（SSR/serverless 回源铁律修订），再改 AC-PWA-002 与 `sw.js`，**当前不建议**。

## 6. 关联文档

- 方案：`docs/features/pwa/web-share-target.md`；验收：`verify/acceptance-criteria/AC-pwa.md`
- 基建：`public/sw.js`、`public/manifest.webmanifest`、`app/lib/pwa/register.ts`、`app/lib/share.ts`
- 规划：`docs/planning/backlog.md`（独立增量）；日志：`docs/development-log/2026-09-06.md`
