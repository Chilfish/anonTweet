# Postmortem 012: 断点列表冒充移动端适配；手写 body 滚动锁与浮层原语抢归属

- **日期**: 2026-09-12
- **严重级别**: 低（无生产影响，未提交即修正；但两项都是高复发模式）
- **状态**: Mitigated
- **根因归类**: 流程缺失（缺触屏自查清单）+ 设计建模（依赖职责边界未查）

## 摘要

把「快拍列表 → 网格相册 + 全屏查看器」实现完后，计划里写了响应式规则（网格 `sm/md` 断点、
「320/375/768/1024/1440 逐宽度核对列数与查看器表现」），于是自认为覆盖了响应式——但**手机真正需要
的行为一条都没设计**：主操作该在拇指区、刘海/Home 指示条的安全区、横滑与纵向滚动抢手势、`dvh`、
以及遮罩层打开时的背景滚动该由谁负责。所有者一句「手机端适配…为啥还是没想到呢」点出。

同一批改动里还**手写了 `document.body.style.overflow = 'hidden'`** 来锁背景滚动。读依赖源码后发现
base-ui 的 `useScrollLock` 早已处理（含 iOS overlay-scrollbar、滚动位置还原、scrollbar-gutter），
且它会先 `isPageScrollLocked()` 检测——**页面已被作者锁住时主动退让**并用 MutationObserver 等其解锁
后再接管，于是自写 override 会让 base-ui 在**关闭之后**才上锁，把锁的生命周期搞乱。

## 影响

- **返工**：自写滚动锁删除；工具栏由「一律贴顶」改为手机贴底（`order-last` + `sticky bottom-0`）；
  查看器上下栏补 safe-area 内距与 `overscroll-contain`；功能文档补移动端小节与已知缺口。
- **生产影响**：无——都在提交前修正（`typecheck`/`lint`/`test` 未观察到该问题，因为它是**运行时触屏
  行为**，离线层看不见）。
- **隐藏风险（未发生但很贵）**：若直接提交，移动端会出现「关闭查看器后页面滚不动 / 滚动位置跳到
  顶部」的诡异现象，且**极难归因**（表现为「有时锁死、有时正常」，取决于哪个锁先释放）。
- **隐性认知成本**：`docs/planning` 的计划与功能文档初稿把「响应式」记为已完成，若不修正会污染后续判断。

## 时间线

| commit / 事件 | 说明                                                                                  |
| ------------- | ------------------------------------------------------------------------------------- |
| 2026-09-12    | 功能实现 + 离线 AC 全绿、`build-storybook` 通过 → 自认为「响应式已覆盖」              |
| 2026-09-12    | 所有者追问「手机端适配…为啥还是没想到呢」                                             |
| 2026-09-12    | 审计既有做法：`grep safe-area` → `ui/drawer.tsx` 已有 `env(safe-area-inset-*)` 用法； |
|               | 但 `app/root.tsx` 的 viewport meta 没有 `viewport-fit=cover` → 该安全区取值恒为 0     |
| 2026-09-12    | 读 `node_modules/@base-ui/utils/useScrollLock.js` 全文，确认滚动锁归属 → 删除自写锁   |
| 2026-09-12    | 补移动端行为 + SSR 双向冒烟（story URL 出网格骨架 / post URL 仍出帖子骨架）           |

## 根因分析（blameless）

- **贡献因素 1：「响应式」被当成「断点列全」。** 计划里的移动端验证项是「多宽度看列数」，
  这类检查**只能发现布局崩坏，发现不了行为缺失**——拇指区、安全区、手势冲突、软键盘/地址栏、
  浮层滚动锁都不在任何宽度上「看起来坏」。
- **贡献因素 2：浮层职责边界没查就补。** 仓库浮层统一走 `ui/dialog|sheet|drawer`，但"滚动锁/焦点/
  背景 inert 由原语负责"这件事没有任何一处写明；凭直觉补一个 override，正好撞上 base-ui 的
  「作者已锁则退让」反向检测。**不知道依赖已经负责该职责时，多写的代码会主动制造 bug。**
- **贡献因素 3：没有触屏自查清单。** `docs/ui-design/` 有组件/令牌规范，但没有「触屏 + 安全区 +
  手势 + 浮层职责」这一组；于是自查只能靠记忆，而记忆在赶进度时会漏。
- **贡献因素 4：默认桌面语境。** 设计输入（网格列数、工具栏、查看器）天然按桌面推演，
  移动端只在最后被当成「缩一下」而不是「另一套交互」。

## 做得对的地方

- 被指出后**没有辩解**，先去审计既有实现（`grep` 出 `drawer.tsx` 的既有安全区写法）再动手；
- 发现 `viewport-fit=cover` 缺失后，**如实登记为已知缺口**而不是顺手改全站 viewport——
  那是全站布局变更、需真机逐页验收，改动半径与本任务不匹配；
- 依赖行为不明时**读依赖源码**（`useScrollLock.js` 全文）而不是猜，并把结论内联到
  `IGStoryViewer` 的注释里（约束贴着使用点，避免下次再犯）；
- 骨架路由用 **SSR 双向对照**验证（story URL 出网格骨架；**反证** post URL 仍出帖子骨架），
  而不是只测正向——这是「绿要可失败」的延续。

## 行动项

### 缓解（针对已发生的具体缺口）

- [x] 删除自写 `body` 滚动锁；把「滚动锁归 base-ui Dialog」的约束内联在 `IGStoryViewer` 注释（2026-09-12）
- [x] 工具栏手机贴底（`order-last` + `sticky bottom-0`）而 `sm` 起贴顶；查看器上下栏 safe-area 内距、
      `h-[100dvh]`、`overscroll-contain`；横滑阈值 `|Δx|>40 且 |Δx|>|Δy|` 避免与纵向滚动抢手势（2026-09-12）
- [x] 功能文档补「移动端」行为与「`viewport-fit=cover` 缺失 → safe-area 目前 no-op」的已知缺口（2026-09-12）
- [x] 验证：离线 AC（19 + 5）+ SSR 双向冒烟 + `build-storybook`（2026-09-12）

### 预防（针对整类问题）

- [ ] 在 `docs/ui-design/README.md` 增「触屏 / 移动端自查清单」：拇指区主操作、`env(safe-area-inset-*)`
      （并确认 `viewport-fit=cover` 生效）、手势冲突（横滑 vs 滚动）、`dvh` vs `vh`、`pointer-coarse` 命中区、
      iOS 输入缩放；并在计划模板里写明「**移动端 = 触屏行为清单，不是断点列表**」
- [ ] 引入/使用浮层原语（`ui/dialog|sheet|drawer`）时，把「滚动锁 / 焦点 trap / 背景 inert 由哪个原语负责」
      写进组件注释或 `ui-design` 文档——避免再次手写 override 撞上原语的反向检测
- [ ] 评估补 `viewport-fit=cover`（需真机逐页确认 padding），单独任务、真机验收后再动

## 教训

- **「列了断点」不等于「做了移动端」。** 移动端是一份**触屏行为清单**——拇指区、安全区、手势冲突、
  `dvh`、浮层滚动锁、命中区——宽度截图上永远看不出这些缺失，必须逐条对照。
- **浮层原语自带滚动锁 / 焦点 / inert。** 用 Dialog/Sheet/Drawer 时先查依赖是否已负责该职责，
  **不要手写 override**：成熟原语常会检测「页面已被作者锁住」并退让，多写的代码反而制造难查的锁生命周期 bug。

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
docs/postmortem/012-mobile-adaptation-and-scroll-lock-ownership.md
docs/postmortem/README.md
test/acceptance/ac-postmortem.spec.ts
```

## 关联 Postmortem

- #003（无 design token 的 20 次单行 CSS fix）— 同一类「靠直觉补细节、缺清单」的下游表现
- #007（新功能无验收清单）— 「验证先行」缺失；本篇是其在**非功能性维度（移动端）**上的复发
- #005（媒体 URL 四套重复逻辑）— 同类「职责未收敛 / 重复实现抢归属」
