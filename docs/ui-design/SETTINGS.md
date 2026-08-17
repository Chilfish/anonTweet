# 设置页面设计模式（Settings Page Pattern）

> **级别：强制规范（Mandatory）**
>
> 本文档定义了设置页面、偏好面板、个人资料、配置列表的**唯一合法** UI 模式。
> AI 必须使用本规范中的组件。禁止自定义 `div` 列表或表格来实现此类界面。

---

## 1. 触发机制（When to Apply）

**遇到以下关键词/场景时，必须使用此模式：**

| 触发条件 | 示例                                                                                     |
| -------- | ---------------------------------------------------------------------------------------- |
| 关键词   | "设置"、"偏好"、"配置"、"个人资料"、"菜单"、"选项"、"Settings"、"Preferences"、"Profile" |
| 视觉意图 | "iOS 风格列表"、"分组列表"、"表单行"、"macOS 设置风格"                                   |
| 数据结构 | 键值对、开关、导航链接，以分组形式呈现                                                   |

**不适用场景：**

| 场景                  | 替代方案                 |
| --------------------- | ------------------------ |
| 数据表格（排序/筛选） | 使用 `DataTable`         |
| 营销/展示内容         | 使用 `Card` 或自定义布局 |
| 聊天/Feed 流          | 使用专用组件             |

---

## 2. 组件结构（Component Topology）

### 2.1 层级关系

```
设置页面
├── 标题区（页面标题 + 描述）
├── SettingsGroup（分组 1）
│   ├── SettingsItem（行 1）
│   ├── SettingsItem（行 2）
│   └── SettingsItem（行 3）
├── SettingsGroup（分组 2）
│   ├── SettingsItem（行 1）
│   └── SettingsItem（行 2）
└── ...
```

### 2.2 严禁模式

- ❌ 手动 `<hr />` 或 `border-b` 分割行 — `SettingsItem` 通过 `:not(:last-child):border-b` 自动处理
- ❌ 在 `SettingsGroup` 内嵌套 `Card` 组件
- ❌ 在 `SettingsItem` 内使用标准带边框的 `Input`（场景 C 有特殊处理）
- ❌ 使用 `table` 或 `div` 列表替代 SettingsGroup/SettingsItem

---

## 3. API 参考

导入路径：`~/components/ui/settings-layout`

### 3.1 SettingsGroup

```tsx
interface SettingsGroupProps {
  title?: string         // 分组标题（大写、letter-spacing 加宽）
  description?: string   // 标题下方的辅助说明
  variant?: 'default' | 'ghost'  // default: 卡片样式; ghost: 无边框透明
  className?: string
  children: React.ReactNode
}
```

**视觉细节：**

- `title` 渲染为 `text-sm font-medium text-muted-foreground uppercase tracking-wider`
- `description` 渲染为 `text-xs text-muted-foreground/70`
- 默认 variant 包含 `rounded-xl border bg-card shadow-xs`

### 3.2 SettingsItem

```tsx
interface SettingsItemProps {
  label: React.ReactNode       // 左侧主文字（必填）
  description?: React.ReactNode // 标签下方的辅助说明
  icon?: React.ReactElement    // 左侧图标（LucideIcon）
  destructive?: boolean        // 红色危险样式
  disabled?: boolean           // 禁用态（半透明 + 无指针事件）
  onClick?: () => void         // 使行可点击（自动添加 hover/active 态）
  id?: string                  // 作为 Label 的 htmlFor，关联表单控件
  className?: string
  children: React.ReactNode    // 右侧内容槽（Switch、Input、Select、Chevron 等）
}
```

**自动行为：**

- `destructive` 为 true → 文字 + 图标变红
- `onClick` 存在 → 自动 `cursor-pointer` + `active:bg-accent/80`
- `disabled` 为 true → `opacity-50` + `pointer-events-none`
- 最后一行不显示底部边框
- `id` 会被 clone 到 children 元素上（用于 Label-Input 关联）

---

## 4. 标准场景（Stories）

### 场景 A：布尔开关（Switch）

```tsx
import { BellIcon } from 'lucide-react'
import { SettingsGroup, SettingsItem } from '~/components/ui/settings-layout'
import { Switch } from '~/components/ui/switch'

<SettingsGroup title="通知">
  <SettingsItem
    label="推送通知"
    description="在移动设备上接收更新。"
    icon={<BellIcon />}
    id="push-notifs"
  >
    <Switch defaultChecked />
  </SettingsItem>
</SettingsGroup>
```

### 场景 B：导航/深入（ChevronRight）

```tsx
import { ChevronRight, ShieldIcon } from 'lucide-react'

<SettingsGroup title="账户">
  <SettingsItem
    label="安全设置"
    icon={<ShieldIcon />}
    onClick={() => router.push('/security')}
  >
    <div className="flex items-center gap-2 text-muted-foreground">
      <span className="text-sm">已启用</span>
      <ChevronRight className="size-4 opacity-50" />
    </div>
  </SettingsItem>
</SettingsGroup>
```

**注意：** `ChevronRight` 必须手动放在 children 中。`onClick` 加在 `SettingsItem` 上而非内部 div。

### 场景 C：行内编辑（无边框输入框）

```tsx
import { UserIcon } from 'lucide-react'
import { Input } from '~/components/ui/input'

<SettingsItem label="显示名称" icon={<UserIcon />} id="display-name">
  <Input
    id="display-name"
    className="h-8 w-[200px] border-none bg-transparent px-0 text-right shadow-none focus-visible:ring-0"
    defaultValue="Alice"
    placeholder="输入名称"
  />
</SettingsItem>
```

**强制样式规则：**

1. `text-right` — 右对齐
2. `border-none shadow-none focus-visible:ring-0` — 移除所有默认 Input 外观
3. `bg-transparent` — 与行背景融合
4. `h-8` — 行内紧凑高度

### 场景 D：选择器（Select/Dropdown）

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'

<SettingsItem label="主题" id="theme-select">
  <Select defaultValue="system">
    <SelectTrigger className="w-[140px] h-8 border-none shadow-none bg-transparent focus:ring-0 justify-end px-0 gap-1">
      <SelectValue placeholder="选择主题" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="light">浅色</SelectItem>
      <SelectItem value="dark">深色</SelectItem>
      <SelectItem value="system">跟随系统</SelectItem>
    </SelectContent>
  </Select>
</SettingsItem>
```

**强制样式规则：**

1. `border-none shadow-none bg-transparent focus:ring-0` — 无边框透明
2. `justify-end` — 内容右对齐
3. `h-8` — 紧凑高度

### 场景 E：危险操作

```tsx
import { LogOutIcon } from 'lucide-react'

<SettingsGroup>
  <SettingsItem
    label="退出登录"
    icon={<LogOutIcon />}
    destructive
    onClick={handleSignOut}
  />
</SettingsGroup>
```

**说明：** `destructive` 属性自动将文字和图标变为红色（`text-destructive`），hover 时背景变红（`hover:bg-destructive/10`）。

---

## 5. 强制检查清单（Mandatory Checklist）

在生成任何设置页面代码之前，AI 必须逐项确认：

1. [ ] 相关的行是否包裹在**同一个** `SettingsGroup` 中？
2. [ ] 是否移除了所有手动 `border-b`、`<hr />`、`<Separator />`？（SettingsItem 自动处理）
3. [ ] 如果使用了 `Input`，是否添加了 `border-none` 和 `text-right`？
4. [ ] 如果使用了 `onClick`，是否加在 `SettingsItem` 上（而非内部元素）？
5. [ ] `id` 是否正确设置以实现 Label-Input 关联？
6. [ ] 是否有 `ChevronRight` 图标放在导航行的 children 末尾？
7. [ ] `destructive` 属性是否仅用于不可逆的危险操作？

---

## 6. 完整示例：设置页面

```tsx
import { BellIcon, UserIcon, ShieldIcon, LogOutIcon } from 'lucide-react'
import { SettingsGroup, SettingsItem } from '~/components/ui/settings-layout'
import { Switch } from '~/components/ui/switch'
import { Input } from '~/components/ui/input'

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto p-4">
      <div>
        <h1 className="text-2xl font-bold">设置</h1>
        <p className="text-sm text-muted-foreground mt-1">管理你的账户和应用偏好。</p>
      </div>

      <SettingsGroup title="个人资料">
        <SettingsItem label="显示名称" icon={<UserIcon />} id="name">
          <Input
            id="name"
            className="h-8 w-[200px] border-none bg-transparent px-0 text-right shadow-none focus-visible:ring-0"
            defaultValue="Alice"
          />
        </SettingsItem>
      </SettingsGroup>

      <SettingsGroup title="通知">
        <SettingsItem
          label="推送通知"
          description="接收移动设备上的更新。"
          icon={<BellIcon />}
          id="push"
        >
          <Switch id="push" defaultChecked />
        </SettingsItem>
      </SettingsGroup>

      <SettingsGroup>
        <SettingsItem
          label="退出登录"
          icon={<LogOutIcon />}
          destructive
          onClick={() => console.log('sign out')}
        />
      </SettingsGroup>
    </div>
  )
}
```
