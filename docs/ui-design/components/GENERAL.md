# General Components Design Pattern

此文档定义了项目中通用的原子级 UI 组件规范。本项目采用 **coss-ui** (基于 **Base UI** 和 **Tailwind CSS**) 作为组件库基础。这意味着大多数基础组件（如 Button, Input, Dialog）已经具备了良好的可访问性和默认样式。

**核心原则：** 优先复用 `~/components/ui/` 下的既有组件，而非手动编写 Tailwind 类名。仅在为了匹配特殊的 Apple 风格（如设置列表）时进行必要的样式覆盖。特别地，不要过多地给baseui组件外层擅自添加 padding，Base UI 会处理好整体结构。

使用前请参考文档 https://coss.com/ui/llms.txt

---

## 1. 按钮 (Buttons)

复用 `~/components/ui/button.tsx`。

### 1.1 变体 (Variants)

coss-ui 已预设以下变体，开发时请直接使用 `variant` 属性：

- **Primary (`default`):** 页面中最主要的单一操作。
  - 已内置 `shadow-sm` 和高对比度配色。
  - 交互：默认已包含 Hover 态。如需增强移动端按压反馈，可叠加 `active:scale-[0.98]`。
- **Secondary:** 次要操作。
  - `bg-secondary text-secondary-foreground`。
- **Outline:** 带边框的次要操作。
- **Ghost:** 无背景，仅 Hover 显示背景。常用于工具栏图标。
- **Destructive:** 危险操作。

### 1.2 尺寸 (Sizes)

通过 `size` 属性控制：

- **Default:** `h-10 px-4 py-2`。
- **Sm:** `h-9 rounded-md px-3` (用于 Header, Table)。
- **Xs:** 需要自行扩展或使用 `h-8` 类名 (常用于 Setting Row 内部)。
- **Icon:** `size-10` (icon variant)。

### 1.3 交互增强

虽然 coss-ui 提供了基础交互，但为了极致的原生感：

- **Mobile:** 建议在主要操作按钮上添加 `active:scale-[0.97]` 或 `active:scale-95` 以模拟物理按压。

---

## 2. 输入框 (Inputs)

复用 `~/components/ui/input.tsx`。coss-ui 的 Input 基于 Base UI 的 Input Primitive，处理了复杂的 Focus 状态。

### 2.1 标准输入框 (Standard Input)

- **默认外观:** 组件库默认已配置为 `rounded-lg`，`border-input` 和 `shadow-sm`。
- **Focus:** 组件库默认处理了 `ring` 效果，无需手动添加 `focus:ring` 类名，除非需要覆盖颜色。
- **Placeholder:**
  - `text-muted-foreground`，确保对比度足够但不过分抢眼。

### 2.2 输入组 (Input Group)

当输入框带有前缀/后缀图标或标签时，请严格遵循以下写法，使用 `InputGroup` 及其子组件。

```tsx
<InputGroup>
  <InputGroupAddon align="inline-start">
    <SearchIcon className="size-4" />
  </InputGroupAddon>
  <InputGroupInput
    placeholder="搜索..."
    className="pl-8 h-9"
  />
</InputGroup>
```

- **关键点:** 不要手动通过 absolute 定位图标
- **图标色:** `text-muted-foreground`.

### 2.3 文本域 (Textarea)

- 通常用于长文本输入。
- `min-h-[80px]`.
- 样式与 Input 保持一致。

---

## 3. 浮层与反馈 (Overlays & Feedback)

### 3.1 模态框 (Dialog)

coss-ui 的 `Dialog` 组件 (`components/ui/dialog.tsx`) 基于 Base UI 构建，默认包含了 `backdrop-blur` 和进出动画。

- **设计建议:**
  - 直接使用 `<Dialog>` 及其子组件 (`DialogContent`, `DialogHeader` 等)。
  - **背景模糊:** 默认已包含 `bg-background/80 backdrop-blur-sm`，无需额外添加。
  - **圆角:** 默认通常为 `rounded-lg` 或 `rounded-xl`。

### 3.2 移动端抽屉 (Drawer/Sheet)

为了实现移动端适配，通常使用 Drawer 或 Sheet 替代 Dialog。目前 coss-ui 可能提供 `Sheet` 或 `Drawer` 组件。

- **Mobile 优先:** 在移动端视图下，优先展示为底部抽屉，支持拖拽关闭。
- **视觉细节:** 确保顶部有 "Grabber" (灰色短横线) 指示可拖拽。

### 3.3 Toast 通知

- **位置:**
  - **Desktop:** 右下角或顶部居中。
  - **Mobile:** 顶部居中 (避免遮挡底部键盘或操作栏)。
- **样式:**
  - `bg-background border border-border shadow-lg rounded-xl`.
  - 使用图标区分类型 (Success, Error, Info)。

---

## 4. 结构容器 (Structure)

### 4.1 卡片 (Card)

复用 `~/components/ui/card.tsx`。

- **默认样式:** 组件已预设 `rounded-xl border bg-card text-card-foreground shadow-sm`。
- **使用方式:** 组合使用 `Card`, `CardHeader`, `CardContent`, `CardFooter`。
- **注意:** 对于**设置列表**，请使用专用组件 (SettingsGroup) 而非通用 Card，因为 Card 的 Padding (`p-6`) 通常对列表来说太大了。

### 4.2 分隔符 (Separator)

复用 `~/components/ui/separator.tsx` (基于 Base UI Separator)。

- **用途:** 区分内容区块。
- **样式:** 默认已适配 `bg-border`。

---

## 5. 图标 (Icons)

- **库:** 使用 `lucide-react`.
- **大小:**
  - 默认: `size-4` (16px) 配合文字使用。
  - 按钮内: `size-4` (sm) 或 `size-5` (default).
  - 极小: `size-3.5` (14px) 用于辅助文本或 metadata.
- **颜色:**
  - 默认跟随文字颜色 (`currentColor`).
  - 辅助图标: `text-muted-foreground`.
  - **切勿**给图标使用纯黑或纯白，除非是在深色/浅色背景的高对比场景。
