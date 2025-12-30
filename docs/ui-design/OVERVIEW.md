# UI Design System: Overview & Principles

> **Project Goal:** Build a responsive web application that morphs seamlessly between a native macOS desktop experience and a high-fidelity iOS mobile PWA.

---

## 1. 核心哲学 (Core Philosophy)

- **Native-First Aesthetic:** 我们的目标不是让它“看起来像个好看的网页”，而是“感觉像个原生应用”。
- **Platform Adaptability:**
  - **Desktop:** 遵循 macOS Human Interface Guidelines (HIG)。强调半透明材质、精确的鼠标交互、紧凑的布局。
  - **Mobile:** 遵循 iOS HIG。强调大触控区、手势操作、底板抽屉 (Bottom Sheets) 和沉浸式体验。
- **Invisible Design:** 也就是“设计不可见”。设计应服务于内容，通过微妙的阴影、模糊和动效引导用户，而非喧宾夺主。

---

## 2. 通用设计规范 (Universal Specifications)

无论是在桌面还是移动端，以下规范必须严格遵守：

### 2.1 视觉基石 (Visual Foundations)

- **Color System:**
  - **Base:** 深度依赖 `bg-background` (纯净底层) 和 `bg-card` (分组容器)。
  - **Grays:** 使用 System Gray 调色板 (`slate` or `zinc` in Tailwind) 处理边框、分割线和辅助文本。
  - **Primary:** 仅用于高优先级的 CTA (Call to Action) 和激活状态。
  - **Dark Mode:** 必须是一等公民。所有颜色定义必须包含 Dark Mode 变体。

- **Typography:**
  - **Font Stack:** `-apple-system, BlinkMacSystemFont, "Segoe UI", ...` (优先 SF Pro).
  - **Hierarchy:** 通过字重 (`font-medium`, `font-semibold`) 和颜色 (`text-muted-foreground`) 区分层级，而非仅仅通过字号。

- **Spacing & Grid:**
  - 基准单位: **4px** (Tailwind `1` = 4px).
  - 核心间距: `2` (8px), `4` (16px), `6` (24px).
  - 容器圆角: 标准卡片 `rounded-xl` (12px) 或 `rounded-2xl` (16px)。

### 2.2 交互物理学 (Interaction Physics)

- **Instant Feedback:**
  - **Desktop:** Hover 态必须明显但柔和 (`hover:bg-muted/50`)。
  - **Mobile:** Active (Press) 态必须模拟物理按压，元素应有缩放 (`active:scale-95`) 或亮度变化。

- **Motion:**
  - 所有状态改变（显隐、位置移动）必须有过渡。
  - **Duration:** 短动画 150-200ms，长动画（如抽屉弹出）300-350ms。
  - **Easing:** 使用 `ease-out` 给人“响应快”的感觉。

---

## 3. 组件分类索引 (Component Index)

具体的组件实现范式请参考以下文档：

- **[SETTINGS.md](./components/SETTINGS.md):** 设置页面布局、分组、开关行、选择器等。
  - _适用于：用户设置、配置面板、表单列表。_
- **[GENERAL.md](./components/GENERAL.md):** 按钮、输入框、卡片、分隔符等通用原子组件。
  - _适用于：全局通用的基础 UI 元素。_

_(更多组件规范将随项目发展陆续添加)_
