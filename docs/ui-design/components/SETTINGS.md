# Design Pattern: Settings Lists

> **Role:** Particle Specification (Pattern)
> **Context:** This document defines the **MANDATORY** UI pattern for **Settings Pages, Preference Panels, Profile Details, and Configuration Lists**.
> **Constraint:** AI MUST use these components. DO NOT build custom `div` lists or tables for these scenarios.

---

## 1. AI Recognition Rules (触发机制)

**When to use this pattern?**
If the user request involves:
1.  **Keywords:** "Settings", "Preferences", "Profile", "Config", "Menu", "Options".
2.  **Visual Intent:** "iOS/macOS style list", "Grouped list", "Form rows".
3.  **Data Structure:** Key-Value pairs, Toggles, or Navigation Links grouped in sections.

**When NOT to use?**
*   **Data Grids:** Use `DataTable` (for sorting/filtering).
*   **Marketing Content:** Use `Card` or custom layout.
*   **Chat/Feed:** Use specialized components.

---

## 2. Component Topology (组件拓扑)

The structure is strict. You must respect this hierarchy:

1.  **`SettingsGroup`**: The container. Handles the card look, borders, and section headers.
2.  **`SettingsItem`**: The row. Handles layout, icons, labels, and **automatic separators**.

### ❌ Forbidden Patterns
*   **NO** manual `<hr />` or `border-b` between items. `SettingsItem` handles this via `:not(:last-child)`.
*   **NO** nesting `Card` components inside `SettingsGroup`.
*   **NO** using standard bordered `Input` fields (see Scenario C).

---

## 3. Implementation Specs (API 契约)

Reference path: `~/components/ui/settings-layout`

### 3.1 `SettingsGroup`
Wraps a collection of related items.
*   **Props:**
    *   `title?` (string): Section header (uppercase, tracking-wider).
    *   `description?` (string): Helper text below the title.
    *   `variant?`: "default" (card style) | "ghost" (transparent).

### 3.2 `SettingsItem`
The atomic row component.
*   **Props:**
    *   `label` (ReactNode): Main text (Left).
    *   `description?` (ReactNode): Subtext below label.
    *   `icon?` (LucideIcon): Left-aligned icon.
    *   `destructive?` (boolean): Styles text red (for delete actions).
    *   `onClick?` (Fn): Makes the row interactive (hover/active states).
    *   `children` (ReactNode): **Right Content Slot** (Switch, Input, Select, Chevron).
    *   `id` (String): As HtmlFor in label in from-item

---

## 4. Standard Usage Scenarios (Stories)

**AI MUST match the user's intent to one of these scenarios.**

### Scenario A: Boolean Toggle (Switch)
*Use for: Notifications, Dark Mode, System Features.*

```tsx
import { SettingsGroup, SettingsItem } from "~/components/ui/settings-layout"
import { Switch } from "~/components/ui/switch"
import { BellIcon } from "lucide-react"

<SettingsGroup title="Notifications">
  <SettingsItem 
    label="Push Notifications" 
    description="Receive updates on your mobile device."
    icon={<BellIcon />}
    id="push-notifs" // Automatically wired to Label
  >
    <Switch defaultChecked />
  </SettingsItem>
</SettingsGroup>
```

### Scenario B: Navigation / Drill-down
*Use for: Sub-menus, Account Security, External Links.*
**Note:** Use `ChevronRight` manually in the children slot if it's a link.

```tsx
import { ChevronRight, ShieldIcon } from "lucide-react"

<SettingsGroup title="Account">
  <SettingsItem
    label="Security"
    icon={<ShieldIcon />}
    onClick={() => router.push('/security')} // Makes row interactive
  >
    <div className="flex items-center gap-2 text-muted-foreground">
      <span className="text-sm">Enabled</span>
      <ChevronRight className="size-4 opacity-50" />
    </div>
  </SettingsItem>
</SettingsGroup>
```

### Scenario C: Inline Editing (Seamless Input)
*Use for: Changing Name, Email, API Keys.*
**CRITICAL:** You MUST override Input styles to be borderless and right-aligned.

```tsx
import { Input } from "~/components/ui/input"
import { UserIcon } from "lucide-react"

<SettingsItem label="Display Name" icon={<UserIcon />}>
  {/* 
    KEY STYLING: 
    1. text-right: Aligns text to the end
    2. border-none shadow-none focus-visible:ring-0: Removes default Input styling
    3. bg-transparent: Blends with row background
  */}
  <Input 
    className="h-8 w-[200px] border-none bg-transparent px-0 text-right shadow-none focus-visible:ring-0" 
    defaultValue="Alice" 
    placeholder="Enter name"
  />
</SettingsItem>
```

### Scenario D: Select / Dropdown
*Use for: Theme, Language, Frequency.*
**CRITICAL:** Trigger must be styled to look like plain text.

```tsx
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "~/components/ui/select"

<SettingsItem label="Theme">
  <Select defaultValue="system">
    <SelectTrigger className="w-[140px] h-8 border-none shadow-none bg-transparent focus:ring-0 justify-end px-0 gap-1">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="light">Light</SelectItem>
      <SelectItem value="dark">Dark</SelectItem>
    </SelectContent>
  </Select>
</SettingsItem>
```

### Scenario E: Destructive Action
*Use for: Sign Out, Delete Account.*

```tsx
import { LogOutIcon } from "lucide-react"

<SettingsGroup>
  <SettingsItem 
    label="Sign Out" 
    icon={<LogOutIcon />} 
    destructive // Activates red styling
    className="justify-center font-medium" // Optional: Center align
    onClick={handleSignOut}
  />
</SettingsGroup>
```

---

## 5. Visual Constraints Checklist

Before generating code, verify:
1.  [ ] Are related items wrapped in **one** `SettingsGroup`?
2.  [ ] Did I remove all `border-b` or `<Separator />` components? (The Item handles it).
3.  [ ] If using an Input, is it `border-none` and `text-right`?
4.  [ ] If using `onClick`, is it attached to `SettingsItem` (not an inner div)?
