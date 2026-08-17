# UI 设计系统：总览与强制规范

> **目标：** 构建一个能在桌面端（macOS 原生感）与移动端（iOS PWA 原生感）之间无缝切换的响应式 Web 应用。
>
> **适用范围：** 本项目所有 UI 组件、页面、交互。AI 生成代码时必须逐条遵守。

---

## 0. AI 生成代码前的自检清单

每次在项目中编写 UI 代码之前，AI 必须确认以下事项：

- [ ] 优先检查 `~/components/ui/` 下是否已有现成组件，不要重复造轮子
- [ ] 所有颜色来自 CSS 变量（`bg-background`, `text-muted-foreground` 等），禁止硬编码颜色
- [ ] 所有组件同时考虑浅色/深色模式（项目使用 `.dark` 类切换）
- [ ] 交互元素同时处理桌面（hover）和移动端（active/press）状态
- [ ] 使用 `cn()` 工具函数合并类名，不要直接拼接字符串

---

## 1. 核心哲学（Core Philosophy）

### 1.1 原生优先（Native-First Aesthetic）

> **目标不是"看起来像个好看的网页"，而是"感觉像个原生应用"。**

- **桌面端** → 遵循 macOS Human Interface Guidelines（HIG）：半透明材质、精确鼠标交互、紧凑布局
- **移动端** → 遵循 iOS HIG：大触控区（≥44px）、手势操作、底部抽屉（Bottom Sheets）
- **不可见设计**：设计服务于内容。通过微妙的阴影、模糊和动效引导用户，不喧宾夺主

### 1.2 必须遵守的铁律

| 规则                   | 说明                                                                 |
| ---------------------- | -------------------------------------------------------------------- |
| **禁止自定义颜色**     | 使用项目 CSS 变量定义的颜色 Token，禁止 `bg-[#xxx]` 或 `text-[#xxx]` |
| **Dark Mode 一等公民** | 所有组件必须兼容 `.dark` 类，禁止只写浅色不写深色                    |
| **组件优先**           | 优先复用 `~/components/ui/` 下的组件，不要手写 div 模拟              |
| **移动端覆盖**         | 每个交互组件必须测试移动端（`<768px`）的表现                         |

---

## 2. 颜色系统（Color System）

### 2.1 Token 速查表

所有颜色均通过 Tailwind CSS v4 的 `@theme inline` 映射为 `color-*` Token。以下为完整列表及用途：

| Token                    | 用途                | 说明                                      |
| ------------------------ | ------------------- | ----------------------------------------- |
| `background`             | 页面最底层背景      | 浅色: `#f5f9fb`，深色: `oklch(0.145 0 0)` |
| `foreground`             | 页面正文文字        | 最高对比度，用于标题和正文                |
| `card`                   | 卡片/容器背景       | 白色（浅色）或深灰（深色）                |
| `card-foreground`        | 卡片内文字          | 与 `foreground` 对齐                      |
| `primary`                | 主色调，CTA、激活态 | Twitter/X 蓝 `rgb(29, 155, 240)`          |
| `primary-foreground`     | 主色上的文字        | 浅色用于按钮文字                          |
| `secondary`              | 次要按钮/区域       | 浅灰背景                                  |
| `secondary-foreground`   | 次色上的文字        | 深色文字                                  |
| `muted`                  | 极低强调背景        | hover 态、骨架屏                          |
| `muted-foreground`       | 辅助文字            | 描述、标签、占位符、图标色                |
| `accent`                 | 强调背景            | 选中态、hover 高亮                        |
| `accent-foreground`      | 强调文字            | 选中态文字                                |
| `destructive`            | 危险操作            | 删除、登出、错误                          |
| `destructive-foreground` | 危险操作文字        | 危险按钮文字/图标                         |
| `border`                 | 边框线              | 卡片边框、分割线                          |
| `input`                  | 输入框边框          | 表单控件边框                              |
| `ring`                   | Focus 环            | 聚焦态外发光                              |
| `info`                   | 信息提示            | 蓝色系                                    |
| `success`                | 成功提示            | 翠绿色系                                  |
| `warning`                | 警告提示            | 琥珀色系                                  |

### 2.2 使用规则

```tsx
// ✅ 正确：使用 Token
<div className="bg-background text-foreground">
  <p className="text-muted-foreground">辅助说明</p>
  <button className="bg-primary text-primary-foreground">确认</button>
</div>

// ❌ 错误：硬编码颜色
<div className="bg-white text-black">
  <p className="text-gray-500">辅助说明</p>
  <button className="bg-blue-500 text-white">确认</button>
</div>

// ❌ 错误：只写浅色不写深色
<div className="bg-white">...</div>  // dark 模式下是白色背景
```

### 2.3 Dark Mode

- 浅色/深色切换通过 `<html>` 上的 `.dark` 类控制
- 所有 CSS 变量在 `.dark {}` 块中有对应定义
- 半透明边框：浅色用 `oklch` 不透明色，深色用 `oklch(1 0 0 / 10%)`（白色半透明）
- 不要在组件中写 `dark:` 前缀来覆盖颜色 — CSS 变量已自动完成切换

---

## 3. 排版系统（Typography）

### 3.1 字体栈

```
-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI',
'Noto Sans Variable', sans-serif
```

通过 `font-sans` 使用。优先级：系统字体 > SF Pro > Segoe > Noto Sans（中日韩回退）。

### 3.2 层级体系

| 层级     | Tailwind 类名                            | 用途                       |
| -------- | ---------------------------------------- | -------------------------- |
| 页面标题 | `text-2xl font-bold`                     | 页面主标题                 |
| 区块标题 | `text-lg font-semibold`                  | Section 标题               |
| 卡片标题 | `text-base font-medium`                  | Card/Frame 标题            |
| 正文     | `text-sm`                                | 默认正文（13px/0.8125rem） |
| 辅助文字 | `text-xs text-muted-foreground`          | 描述、时间戳               |
| 微文字   | `text-[0.6875rem] text-muted-foreground` | 极小的元数据               |

**重要：** 通过字重（`font-medium`, `font-semibold`）和颜色（`text-muted-foreground`）区分层级，而非仅靠字号变化。

---

## 4. 间距与圆角系统（Spacing & Radius）

### 4.1 间距

基准单位 **4px**（Tailwind 的 `1` = 0.25rem = 4px）。

| Tailwind 值 | 实际像素   | 使用场景                |
| ----------- | ---------- | ----------------------- |
| `1` (4px)   | 最紧密间距 | 图标与文字间隙          |
| `2` (8px)   | 紧密间距   | 列表项内边距、标签间    |
| `3` (12px)  | 标准内边距 | SettingsItem 垂直内边距 |
| `4` (16px)  | 标准外边距 | 卡片内边距、内容区      |
| `6` (24px)  | 宽松间距   | Section 间距            |

### 4.2 圆角

基于 `--radius` CSS 变量（默认 `0.625rem` = 10px）。

| Token          | Tailwind 类名 | 使用场景           |
| -------------- | ------------- | ------------------ |
| `--radius-sm`  | `rounded-sm`  | 小徽章             |
| `--radius-md`  | `rounded-md`  | 输入框、小按钮     |
| `--radius-lg`  | `rounded-lg`  | 默认按钮、菜单弹出 |
| `--radius-xl`  | `rounded-xl`  | 卡片、模态框       |
| `--radius-2xl` | `rounded-2xl` | 大面板             |

---

## 5. 交互物理学（Interaction Physics）

### 5.1 反馈类型

| 状态             | 桌面端                                         | 移动端                                 |
| ---------------- | ---------------------------------------------- | -------------------------------------- |
| **Hover**        | `hover:bg-accent/50` 或 `hover:bg-muted/50`    | 不适用（移动端无 hover）               |
| **Press/Active** | `active:scale-[0.98]`（可选）                  | `active:scale-95` 必须（模拟物理按压） |
| **Focus**        | `focus-visible:ring-2 focus-visible:ring-ring` | 同桌面                                 |
| **Disabled**     | `opacity-50 pointer-events-none`               | 同桌面                                 |

### 5.2 动画预设

| 名称            | 缓动函数           | 时长      | 使用场景                       |
| --------------- | ------------------ | --------- | ------------------------------ |
| **快速反馈**    | `ease-out`         | 150ms     | hover 颜色变化、Focus 环       |
| **标准过渡**    | `--ease-apple`     | 200-250ms | 展开/折叠、淡入淡出            |
| **Spring 弹性** | `--ease-spring`    | 300-350ms | 抽屉弹出、模态框出现、页面切换 |
| **骨骼屏**      | `animate-skeleton` | 2s 循环   | Skeleton 加载占位              |

```tsx
// ✅ 标准过渡写法
<div className="transition-all duration-200 ease-out hover:bg-accent/50">
  可交互元素
</div>

// ✅ 弹性动画（抽屉/弹窗）
<div className="transition-transform duration-300" style={{ transitionTimingFunction: 'var(--ease-spring)' }}>
  弹窗内容
</div>

// ❌ 避免
<div className="transition-all duration-500 ease-in-out">
  过长的 500ms 会让交互感觉迟缓
</div>
```

### 5.3 防误触

- 所有可点击元素必须有 `cursor-pointer`
- 输入框、按钮必须去除 WebKit tap 高亮：项目已在全局 CSS 中设置 `-webkit-tap-highlight-color: transparent`

---

## 6. 响应式断点（Responsive Breakpoints）

使用 Tailwind 默认断点：

| 断点   | 宽度    | 目标设备           |
| ------ | ------- | ------------------ |
| 无前缀 | 0px+    | 移动端优先基础样式 |
| `sm`   | ≥640px  | 大屏手机/小平板    |
| `md`   | ≥768px  | 平板               |
| `lg`   | ≥1024px | 小桌面             |
| `xl`   | ≥1280px | 桌面               |
| `2xl`  | ≥1536px | 大桌面             |

**原则：** 移动端优先。先写移动端样式，再用 `sm:` / `md:` / `lg:` 逐步增强。

---

## 7. 组件文件索引（Component Index）

所有 UI 组件位于 `~/components/ui/`（即 `app/components/ui/`）。

### 布局与导航

- `sidebar.tsx` — 完整侧边栏系统
- `breadcrumb.tsx` — 面包屑导航
- `tabs.tsx` — 标签页（default / underline 变体）
- `scroll-area.tsx` — 自定义滚动条

### 表单与输入

- `button.tsx` — 按钮（6 种 variant、8 种 size）
- `input.tsx` — 输入框（sm / default / lg 尺寸）
- `input-group.tsx` — 带前缀/后缀的输入组
- `textarea.tsx` — 文本域
- `select.tsx` — 下拉选择器（Select / SelectContent / SelectItem）
- `combobox.tsx` — 组合框（多选支持）
- `autocomplete.tsx` — 自动完成
- `checkbox.tsx` / `checkbox-group.tsx` — 复选框
- `radio-group.tsx` — 单选组
- `switch.tsx` — 开关
- `slider.tsx` — 滑块
- `number-field.tsx` — 数字输入
- `otp-field.tsx` — OTP 验证码输入
- `toggle.tsx` / `toggle-group.tsx` — 切换按钮
- `calendar.tsx` — 日期选择器
- `field.tsx` / `fieldset.tsx` / `form.tsx` — 表单结构
- `label.tsx` — 标签（Label-Input 关联，基于 useRender）
- `search-input.tsx` — 搜索输入框（防抖 + 中文 IME composition 支持）
- `item-multi-select.tsx` — 项多选（批量操作场景，含搜索/全选/反选）

### 浮层与反馈

- `dialog.tsx` — 模态对话框（带 backdrop-blur）
- `drawer.tsx` — 抽屉（4 方向 + 手势关闭）
- `sheet.tsx` — 侧面板
- `alert-dialog.tsx` — 确认对话框
- `toast.tsx` — Toast 通知系统
- `tooltip.tsx` — 工具提示
- `popover.tsx` — 弹出框
- `preview-card.tsx` — 悬停预览卡
- `dropdown-menu.tsx` — 下拉菜单
- `menu.tsx` — 菜单（基于 Base UI Menu，含 createHandle 复合件）
- `context-menu.tsx` — 右键菜单
- `command.tsx` — 命令面板
- `spinner.tsx` — 加载指示器（animate-spin）
- `toolbar.tsx` — 工具栏（Toolbar / ToolbarButton）

### 数据展示

- `card.tsx` — 卡片容器
- `table.tsx` — 表格
- `badge.tsx` — 徽章
- `avatar.tsx` — 头像
- `kbd.tsx` — 键盘快捷键
- `progress.tsx` — 进度条
- `meter.tsx` — 计量表
- `skeleton.tsx` — 骨架屏
- `empty.tsx` — 空状态
- `alert.tsx` — 提示横幅
- `pagination.tsx` — 分页

### 特殊组件

- `settings-layout.tsx` — **设置页面专用**（SettingsGroup + SettingsItem）
- `chart.tsx` — 图表容器（recharts 封装，ChartConfig 配置）
- `media.tsx` — 媒体加载状态
- `frame.tsx` — 通用面板布局
- `group.tsx` — 按钮组
- `separator.tsx` — 分割线
- `collapsible.tsx` — 折叠面板
- `accordion.tsx` — 手风琴

> **具体组件的使用规范请参考：**
>
> - **[GENERAL.md](./components/GENERAL.md)** — 按钮、输入框、卡片等通用原子组件规范
> - **[SETTINGS.md](./components/SETTINGS.md)** — 设置页面的强制布局模式
