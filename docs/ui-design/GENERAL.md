# 通用组件设计规范（General Components）

> **原则：** 所有基础 UI 元素优先使用 `~/components/ui/` 下的 coss-ui 组件。不要手写裸 `<div>` 或 `<button>` 来模拟已有组件。
>
> **coss-ui 基础：** 基于 Base UI（无头无障碍原语） + Tailwind CSS + CVA（变体管理）。组件已内置可访问性、Focus 管理和默认样式。
>
> **参考文档：** https://coss.com/ui/llms.txt

---

## 0. 全局规则

### 0.1 导入路径

所有 UI 组件从 `~/components/ui/<name>` 导入。不要从 node_modules 直接导入。

```tsx
// ✅ 正确
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Card, CardHeader, CardContent } from '~/components/ui/card'

// ❌ 错误
import { Button } from '@/components/ui/button'  // 不要用 @/
import { Input } from '../components/ui/input'   // 不要用相对路径
```

### 0.2 类名工具

使用 `cn()` 合并类名（封装了 `clsx` + `tailwind-merge`）：

```tsx
import { cn } from '~/lib/utils'

<div className={cn('base-class', condition && 'conditional-class', className)} />
```

### 0.3 不要在 coss-ui 组件外层擅自添加 padding

Base UI 组件已处理好整体结构。额外的 padding 会被坏组件内部的对齐。

---

## 1. 按钮（Button）

导入路径：`~/components/ui/button`

### 1.1 Variant 使用指南

| Variant               | 类名绑定                                    | 使用场景                               |
| --------------------- | ------------------------------------------- | -------------------------------------- |
| `default`             | `bg-primary text-primary-foreground` + 阴影 | 页面唯一的首要操作（提交、确认、保存） |
| `secondary`           | `bg-secondary text-secondary-foreground`    | 次要操作（取消、返回、重置）           |
| `outline`             | `border-input bg-popover text-foreground`   | 带边框的中性操作（导出、预览）         |
| `ghost`               | `border-transparent hover:bg-accent`        | 工具栏图标按钮、行内操作               |
| `destructive`         | `bg-destructive text-white`                 | 不可逆的危险操作（删除、清空）         |
| `link`                | `underline-offset-4 hover:underline`        | 文字链接式按钮                         |
| `destructive-outline` | 边框 + 红色文字                             | 次要危险操作（取消订阅）               |

### 1.2 Size 使用指南

| Size                  | 高度                 | 使用场景                         |
| --------------------- | -------------------- | -------------------------------- |
| `xs`                  | `h-7`                | 紧凑表格内、批量操作栏           |
| `sm`                  | `h-8`                | 工具栏、卡片 footer              |
| `default`             | `h-9`                | **最常用**，表单提交、对话框确认 |
| `lg`                  | `h-10`               | 大卡片 CTA                       |
| `xl`                  | `h-11`               | 登录页、落地页主按钮             |
| `icon-xs` ~ `icon-xl` | `size-7` ~ `size-11` | 纯图标按钮                       |

### 1.3 交互增强

```tsx
// ✅ 标准按钮
<Button variant="default">提交</Button>
<Button variant="ghost" size="icon-sm"><SettingsIcon /></Button>

// ✅ 加载态
<Button loading>保存中...</Button>

// ✅ 移动端按压反馈（在主要操作上）
<Button className="active:scale-[0.97]">确认支付</Button>

// ❌ 禁止：手动拼凑按钮样式
<button className="bg-blue-500 text-white rounded px-4 py-2">确认</button>
```

---

## 2. 输入框（Input）

导入路径：`~/components/ui/input`

### 2.1 标准用法

```tsx
import { Input } from '~/components/ui/input'

<Input
  placeholder="请输入用户名"
  size="default"  // 可选: "sm" | "default" | "lg"
/>

// 禁用态
<Input disabled placeholder="不可编辑" />

// 文件选择
<Input type="file" />
```

### 2.2 InputGroup（带图标/标签）

**必须使用 InputGroup**，禁止手动 absolute 定位图标：

```tsx
import { InputGroup, InputGroupAddon, InputGroupInput } from '~/components/ui/input-group'
import { SearchIcon } from 'lucide-react'

// ✅ 带前缀图标
<InputGroup>
  <InputGroupAddon align="inline-start">
    <SearchIcon className="size-4" />
  </InputGroupAddon>
  <InputGroupInput placeholder="搜索..." />
</InputGroup>

// ❌ 禁止
<div className="relative">
  <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2" />
  <Input className="pl-8" />
</div>
```

**规则：**

- 图标使用 `size-4`（16px）
- 图标颜色：`text-muted-foreground`
- `InputGroupAddon` 的 `align` 只能是 `"inline-start"` 或 `"inline-end"`

### 2.3 设置页面中的无边框 Input

在 SettingsItem 中使用时，必须覆盖为无边框样式：

```tsx
<Input
  className="h-8 w-[200px] border-none bg-transparent px-0 text-right shadow-none focus-visible:ring-0"
  defaultValue="Alice"
/>
```

---

## 3. 卡片（Card）

导入路径：`~/components/ui/card`

### 3.1 使用规则

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '~/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>标题</CardTitle>
    <CardDescription>描述文字</CardDescription>
  </CardHeader>
  <CardContent>
    {/* 主要内容 */}
  </CardContent>
  <CardFooter>
    <Button variant="outline">取消</Button>
    <Button>确认</Button>
  </CardFooter>
</Card>
```

### 3.2 禁止事项

- **禁止在 SettingsGroup 内嵌套 Card** — 设置列表使用 SettingsGroup
- **禁止在 CardContent 内再嵌套独立 Card** — 如需分区，使用 `Frame` 或多 Card 并列

---

## 4. 浮层（Overlays）

### 4.1 Dialog（模态框）

导入路径：`~/components/ui/dialog`

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '~/components/ui/dialog'

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>确认删除</DialogTitle>
      <DialogDescription>此操作不可撤销。</DialogDescription>
    </DialogHeader>
    {/* 内容 */}
  </DialogContent>
</Dialog>
```

**特性：**

- 默认已含 `backdrop-blur-sm` 背景模糊
- 默认已含进出动画
- 移动端可使用 `bottomStickOnMobile` 属性使其固定在底部

### 4.2 Drawer / Sheet（移动端底部面板）

导入路径：`~/components/ui/drawer` 或 `~/components/ui/sheet`

- **移动端优先：** 在 `<768px` 下自动展示为底部抽屉，支持拖拽关闭
- **Grabber：** 顶部有灰色短横线指示可拖拽

### 4.3 Toast（通知）

导入路径：`~/components/ui/toast`

应用已在 `root.tsx` 中全局挂载 `<ToastProvider>` 和 `<AnchoredToastProvider>`，组件内直接使用 hook 即可。

- **桌面端：** 默认右下角
- **移动端：** 顶部居中（避免遮挡键盘）
- **样式预设：** `bg-background border shadow-lg rounded-xl`

---

## 5. 图标（Icons）

### 5.1 规则

- **库：** `lucide-react`
- **默认大小：** `size-4`（16px）
- **按钮内图标：** `size-4`（sm）、`size-5`（default）、自动适配
- **极小图标：** `size-3.5`（14px）元数据/辅助文字
- **颜色：**
  - 默认跟随文字（`currentColor`，无需额外设置）
  - 辅助图标：`text-muted-foreground`
  - **禁止** 使用纯黑 `#000` 或纯白 `#fff`

```tsx
// ✅ 正确
<SearchIcon className="size-4 text-muted-foreground" />
<SettingsIcon className="size-5" />  // 继承父级文字颜色

// ❌ 错误
<SearchIcon className="size-4 text-black dark:text-white" />
```

---

## 6. 工具函数

### 6.1 cn() — 类名合并

```tsx
import { cn } from '~/lib/utils'

// 条件类名、合并覆盖
<div className={cn(
  'base-style',
  variant === 'primary' && 'text-primary',
  className,
)} />
```

### 6.2 useMediaQuery — 响应式检测

```tsx
import { useMediaQuery } from '~/hooks/use-media-query'

const isMobile = useMediaQuery('(max-width: 767px)')
// 或使用命名断点
const isDesktop = useMediaQuery('lg')
```

### 6.3 useMediaQuery / useIsMobile — 响应式检测

```tsx
import { useMediaQuery, useIsMobile } from '~/hooks/use-media-query'

const isMobile = useIsMobile()            // < 800px
const isDesktop = useMediaQuery('lg')     // >= 1024px
const isTouch = useMediaQuery({ pointer: 'coarse' })  // 触摸设备
```

---

## 7. 常见错误速查（Anti-Patterns）

| 错误                                                            | 正确做法                                                               |
| --------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `<button className="bg-blue-500 text-white rounded px-4 py-2">` | `<Button>`                                                             |
| `<div className="absolute left-2 top-1/2"><Icon /></div>`       | `<InputGroup><InputGroupAddon><Icon /></InputGroupAddon></InputGroup>` |
| `<div className="bg-white rounded-xl shadow p-6">`              | `<Card><CardContent>...</CardContent></Card>`                          |
| `className="border-b border-gray-200"` 在设置列表               | 使用 `SettingsItem`，自动处理分割线                                    |
| `text-black dark:text-white`                                    | `text-foreground`                                                      |
| `bg-white dark:bg-gray-900`                                     | `bg-background` 或 `bg-card`                                           |
| `<hr />` 分割两个区域                                           | `<Separator />` 来自 `~/components/ui/separator`                       |
| 导入 `@/components/ui/button`                                   | 导入 `~/components/ui/button`                                          |
