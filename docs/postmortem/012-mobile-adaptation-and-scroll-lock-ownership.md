# Postmortem 012: 断点列表冒充移动端适配，手写滚动锁与浮层原语抢归属

- **日期**: 2026-09-12
- **严重级别**: SEV-3
- **分类**: 流程
- **状态**: Active
- **根因归类**: 流程缺失

## 摘要

「快拍列表 → 网格相册 + 全屏查看器」实现完后，计划里写了响应式规则（网格 `sm`/`md` 断点、320/375/768/1024/1440 逐宽度核对列数与查看器表现），于是自认为覆盖了响应式。但手机真正需要的行为一条都没设计：主操作该在拇指区、刘海与 Home 指示条的安全区、横滑与纵向滚动抢手势、`dvh`，以及遮罩层打开时背景滚动由谁负责。同一批改动里还手写了 `document.body.style.overflow = 'hidden'` 锁背景，而 base-ui 的 `useScrollLock` 早已处理（含 iOS overlay-scrollbar、滚动位置还原、scrollbar-gutter），并且会先检测页面是否已被作者锁住、主动退让，再用 MutationObserver 等解锁后接管。自写 override 会让 base-ui 在关闭之后才上锁，把锁的生命周期搞乱。

状态为 Active：具体缺陷已删除，但触屏自查清单这条预防措施还没落地。

## 影响

- 返工：删除自写滚动锁；工具栏由一律贴顶改为手机贴底（`order-last` + `sticky bottom-0`）；查看器上下栏补 safe-area 内距与 `overscroll-contain`；功能文档补移动端小节与已知缺口。
- 生产影响：无，全部在提交前修正。`typecheck` / `lint` / `test` 看不到，因为这是运行时触屏行为。
- 隐藏风险（未发生但代价高）：若直接提交，移动端会出现「关闭查看器后页面滚不动 / 滚动位置跳到顶部」，且极难归因，表现为「有时锁死、有时正常」，取决于哪个锁先释放。
- 认知成本：计划与功能文档初稿把「响应式」记为已完成，不修正会污染后续判断。

## 时间线

| 日期 | 事件 |
| ---- | ---- |
| 2026-09-12 | 功能实现，离线 AC 全绿、`build-storybook` 通过，自认为响应式已覆盖 |
| 2026-09-12 | 维护者追问「手机端适配…为啥还是没想到呢」 |
| 2026-09-12 | 审计既有做法：`grep safe-area` 发现 `ui/drawer.tsx` 已用 `env(safe-area-inset-*)`；但 `app/root.tsx` 的 viewport meta 没有 `viewport-fit=cover`，安全区取值恒为 0 |
| 2026-09-12 | 读 `node_modules/@base-ui/utils/useScrollLock.js` 全文，确认滚动锁归属，删除自写锁 |
| 2026-09-12 | 补移动端行为 + SSR 双向冒烟 |

## 根因分析

1. 「响应式」被当成「断点列全」。计划里的移动端验证项是「多宽度看列数」，这类检查只能发现布局崩坏，发现不了行为缺失——拇指区、安全区、手势冲突、`dvh`、浮层滚动锁都不在任何宽度上「看起来坏」。
2. 浮层职责边界没查就补。仓库浮层统一走 `ui/dialog|sheet|drawer`，但「滚动锁 / 焦点 trap / 背景 inert 由原语负责」没有任何一处写明。凭直觉补 override，正好撞上 base-ui 的「作者已锁则退让」检测。
3. 没有触屏自查清单。`docs/ui-design/` 有组件与令牌规范，但没有「触屏 + 安全区 + 手势 + 浮层职责」这一组，自查只能靠记忆，赶进度时就会漏。
4. 默认桌面语境。设计输入按桌面推演，移动端只在最后被当成「缩一下」，而不是另一套交互。

一句话归纳：把移动端当成宽度问题而非触屏行为问题，且未确认浮层原语已负责滚动锁就手写 override。

## 触发条件

用真实手机操作浮层与横滑；viewport meta 缺 `viewport-fit=cover` 时安全区不生效。

## 检测

维护者追问发现。离线 AC 与 `build-storybook` 都发现不了，因为它是运行时触屏行为。

## 处置

删除自写 body 滚动锁，把约束内联进 `IGStoryViewer` 注释；工具栏手机贴底、`sm` 起贴顶；查看器补 safe-area、`dvh`、`overscroll-contain` 与横滑阈值；功能文档补移动端行为与已知缺口。

## 做得对的地方

被指出后没有辩解，先审计既有实现再动手。发现 `viewport-fit=cover` 缺失后，如实登记为已知缺口，而不是顺手改全站 viewport。依赖行为不明时读依赖源码而非猜，并把结论内联到使用点。骨架路由用 SSR 双向对照验证。

## 行动项

### 缓解

- [x] 删除自写 body 滚动锁，把「滚动锁归 base-ui Dialog」内联在 `IGStoryViewer` 注释（维护者）
- [x] 工具栏手机贴底（`order-last` + `sticky bottom-0`），`sm` 起贴顶；查看器补 safe-area 内距、`h-[100dvh]`、`overscroll-contain`、横滑阈值 `|Δx|>40 且 |Δx|>|Δy|`（维护者）
- [x] 功能文档补移动端行为，并标注「`viewport-fit=cover` 缺失 → safe-area 目前 no-op」的已知缺口（维护者）
- [x] 验证：离线 AC、SSR 双向冒烟、`build-storybook`（维护者）

### 预防

- [ ] 在 `docs/ui-design/README.md` 增「触屏 / 移动端自查清单」：拇指区主操作、`env(safe-area-inset-*)`（并确认 `viewport-fit=cover` 生效）、手势冲突、`dvh` vs `vh`、`pointer-coarse` 命中区、iOS 输入缩放；并在计划模板写明「移动端 = 触屏行为清单，不是断点列表」（维护者）
- [ ] 引入浮层原语时，把「滚动锁 / 焦点 trap / 背景 inert 由哪个原语负责」写进组件注释或 `ui-design` 文档（维护者）
- [ ] 评估补 `viewport-fit=cover`（需真机逐页确认 padding），单独任务、真机验收后再动（维护者）

## 教训

列了断点不等于做了移动端，移动端是一份触屏行为清单。浮层原语自带滚动锁、焦点和 inert，先查依赖是否已负责，不要手写 override。

## Changed Files

```
app/components/ins/IGStoryList.tsx
app/components/ins/IGStoryViewer.tsx
app/components/ins/IGStoryGrid.tsx
app/components/ins/IGStoryListSkeleton.tsx
app/lib/ig/storyViewer.ts
app/lib/url-detect.ts
app/routes/ins.tsx
test/acceptance/ac-ig-story.spec.ts
test/unit/ig-story-viewer.spec.ts
verify/acceptance-criteria/AC-ig-story.md
docs/features/instagram/instagram-integration.md
docs/archive/backlog-completed-2026-09-12-ig-story-gallery.md
docs/development-log/2026-09-12.md
```

## 关联报告

- #003 UI 样式与布局：同一类「靠直觉补细节、缺清单」
- #007 Instagram 集成：非功能性维度上的复发
- #005 媒体管线：同类「职责未收敛 / 重复实现抢归属」
