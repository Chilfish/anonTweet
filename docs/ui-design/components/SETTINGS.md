# Settings Components Design Pattern

此文档定义了用于构建“设置”、“偏好”或“详情列表”页面的组件规范。该设计模仿 iOS/macOS 的系统设置风格，强调分组、层级和清晰的视觉分隔。

---

## 1. 核心组件 (Core Components)

设置页面主要由两个核心组件构成：

1.  **`SettingsGroup`**: 一个圆角、带边框的容器，用于包裹一组相关的设置项。
2.  **`SettingsRow`**: 容器内的一行，通常包含标签、控件（开关、输入框）或导航指示。

### 1.1 视觉解构 (Visual Anatomy)

- **容器 (Group):**
  - `rounded-xl` (12px) 或 `rounded-2xl` (16px) 在移动端。
  - `border` (1px solid border-border)。
  - `bg-card` (背景色与底色区分)。
  - `overflow-hidden` (确保子元素背景不溢出)。
- **行 (Row):**
  - `min-h-14` (56px) 保证手指易触。
  - `border-b` (内部行之间的分隔线)，**最后一行无边框** (`not-last:border-b`)。
  - `px-4` (左右内边距)。
- **文本 (Typography):**
  - Label: `text-sm font-medium`.
  - Description: `text-xs text-muted-foreground`.
  - Value: `text-sm text-muted-foreground` (通常右对齐)。

---

## 2. 代码实现范式 (Implementation Patterns)

请直接复用 `~/components/settings/SettingsUI.tsx` 中的组件，或参考以下结构。

### 2.1 基础结构 (Basic Structure)

```tsx
import { SettingsGroup, SettingsRow } from '~/components/settings/SettingsUI'
import { Switch } from '~/components/ui/switch'

// ...

<div className="space-y-6">
  {/* Header Title */}
  <div className="space-y-2">
    <h4 className="px-1 text-sm font-medium text-muted-foreground">分组标题 (Header)</h4>

    <SettingsGroup>
      {/* Row 1: Simple Toggle */}
      <SettingsRow>
        <span className="text-sm font-medium">设置项名称</span>
        <Switch />
      </SettingsRow>

      {/* Row 2: With Description */}
      <SettingsRow>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">复杂设置项</span>
          <span className="text-xs text-muted-foreground">这里是详细的功能描述文本。</span>
        </div>
        <Switch />
      </SettingsRow>
    </SettingsGroup>
  </div>
</div>
```

### 2.2 输入与编辑 (Input & Editing)

对于需要输入文本的情况，我们追求“无框”或“融合”的视觉效果。

```tsx
<SettingsRow>
  <Label className="w-20 shrink-0 font-medium">昵称</Label>
  <Input
    className="text-right h-8 border-none shadow-none focus-visible:ring-0 px-0 bg-transparent"
    placeholder="输入昵称"
    value={name}
    onChange={e => setName(e.target.value)}
  />
</SettingsRow>
```

### 2.3 导航与动作 (Navigation & Actions)

用于跳转子页面或触发操作。

```tsx
import { ChevronRight } from 'lucide-react'

// ...

<SettingsRow
  className="cursor-pointer hover:bg-muted/50 transition-colors active:scale-[0.98]"
  onClick={() => navigate('/sub-page')}
>
  <span className="text-sm font-medium">账号安全</span>
  <div className="flex items-center gap-2 text-muted-foreground">
    <span className="text-sm">已保护</span>
    <ChevronRight className="size-4 opacity-50" />
  </div>
</SettingsRow>
```

### 2.4 破坏性操作 (Destructive Actions)

通常独立成组，或位于分组的最下方。

```tsx
<SettingsGroup>
  <SettingsRow
    className="justify-center cursor-pointer hover:bg-destructive/10 active:bg-destructive/20"
    onClick={handleDelete}
  >
    <span className="text-sm font-medium text-destructive">删除账户</span>
  </SettingsRow>
</SettingsGroup>
```

---

## 3. 响应式适配 (Responsive Adaptation)

- **Mobile (PWA):**
  - 分组的左右外边距应较小（如 `mx-4`）或者全宽（`rounded-none border-x-0`）。
  - 标题文字 (`h4`) 可适当增大。
- **Desktop:**
  - 保持定宽或限制最大宽度 (`max-w-2xl`)，避免在大屏幕上行过长导致阅读困难。

## 4. 常见错误 (Common Pitfalls)

- ❌ **Don't:** 在 `SettingsRow` 内部再嵌套 Card 组件。
- ❌ **Don't:** 使用默认带边框的 `Input` 组件，这会破坏列表的整体感（除非是在模态框表单中）。
- ❌ **Don't:** 忘记给可点击的行添加 Hover 和 Active 态反馈。
- ✅ **Do:** 始终保持分组标题 (Header) 与 分组容器 (Group) 的左对齐（通常都有 `px-1` 或 `px-4` 的缩进）。
