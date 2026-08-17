# 代码规范

**项目**: Anon Tweet | **最后更新**: 2026-08-09

## TypeScript 代码风格

本项目遵循 [@antfu/eslint-config](https://github.com/antfu/eslint-config)（ESLint 自动检查 + autofix）。运行 `bun run lint`。

### 命名约定

| 类型          | 风格                     | 示例                                         |
| ------------- | ------------------------ | -------------------------------------------- |
| 组件（React） | PascalCase               | `InstagramPostCard`, `PlainIGPost`           |
| 函数/方法     | camelCase                | `formatIGTime()`, `resolveTranslationView()` |
| 常量          | camelCase 或 UPPER_SNAKE | `maxRetries` / `DEFAULT_TEMPLATES`           |
| 类型/接口     | PascalCase               | `EnrichedTweet`, `IGPost`                    |
| Zustand Store | `useXxxStore`            | `useAppConfigStore`, `useTranslationStore`   |
| 选择器 Hooks  | `useXxx()`               | `useAIConfig()`, `useTranslationSettings()`  |
| 文件命名      | kebab-case               | `resolve-translation-view.ts`, `ig-post.tsx` |

### 文件组织

```ts
// 1. Imports（排序由 ESLint 自动处理，不用手动整理）
import { useShallow } from 'zustand/react/shallow'
import { cn } from '~/lib/utils'

// 2. 类型定义
export interface IGPost {
  id: string
  // ...
}

// 3. 工具函数 / 纯逻辑（可导出、可单测）
export function formatIGTime(iso: string, mode: 'card' | 'plain'): string {
  // ...
}

// 4. 组件（PascalCase 命名，default export 或命名 export 视目录约定）
export function InstagramPostCard({ post }: { post: IGPost }) {
  // ...
}
```

### React 约定

- **函数组件 + TypeScript**；不用 class 组件
- **Barrel export**：3+ 文件的目录必须有 `index.ts`（参考 `app/components/ins/index.ts`）
- 截图组件必须隔离在独立路由 + 使用 `waitForRenderReady`（Twitter: `plain.tsx` / IG: `plain-ig.tsx`）
- 图标用 `lucide-react`；样式用 Tailwind v4 + `cn()` 工具

### Zustand 约定（CRITICAL，源自 postmortem #006）

```ts
// ✅ 正确：双括号定义 + selector 订阅
export const useAppConfigStore = create<AppConfigState>()((set, get) => ({ /* ... */ }))

// ✅ 正确：永远用 selector，避免整 store 订阅
const theme = useAppConfigStore(s => s.theme)

// ❌ 错误：直接解构，触发多余重渲染
const { theme } = useAppConfigStore()

// ✅ 多字段：useShallow
const { theme, fontScale } = useAppConfigStore(useShallow(s => ({ theme: s.theme, fontScale: s.fontScale })))
```

- **persist store** 必须用 `_hasHydrated` 模式防止 SSR mismatch
- 存储迁移（`partialize` 版本变化）必须类型化，禁止静默丢数据

### 类型安全

- catch 子句用 `unknown`，用 `instanceof Error` 窄化；**禁用 `catch (error: any)`**
- 深拷贝用 `structuredClone()`，**不用** `JSON.parse(JSON.stringify())`
- API 返回数据用 Zod schema 校验（`getTweetSchema` 等）

### 禁止事项

| 禁止                                   | 替代方案                                             |
| -------------------------------------- | ---------------------------------------------------- |
| `catch (error: any)`                   | `catch (error: unknown)` + `instanceof Error`        |
| 直接 `useStore()` 解构                 | selector + `useShallow`                              |
| `JSON.parse(JSON.stringify(x))` 深拷贝 | `structuredClone(x)`                                 |
| 硬编码 Twitter/IG CDN URL              | `createMediaUrl()` 统一代理（postmortem #005）       |
| 硬编码字符串（UI 文案）                | 常量 / i18n（规划中）                                |
| 直接修改 `tweet.entities`              | 只写 `entities[].aiTranslation` / `TranslationStore` |
| 内联 `formatTime()` 格式化 IG 时间     | `formatIGTime()`（`~/lib/utils`）                    |

## 测试规范

- **框架**: Vitest（`bun run test` = unit + acceptance；`bun run test:integration` = 集成层）
- **命名**: `*.spec.ts`；`test/unit/`（纯函数）、`test/acceptance/`（AC 语义层）、`test/integration/`（BFF API）
- **AC 编号 = test 名**：`it('AC-TWEET-001: ...')`，与 `verify/acceptance-criteria/` 文档 1:1 可追溯
- **纯函数优先**：解析器 / resolver / materialize / placeholder 逻辑必须单测（postmortem #001/#002）
- **集成测试**：BFF API 端点用 `test/support` 的 AnonTweetClient + TestServer（globalSetup 自动启停），外部凭据缺省 `describe.skipIf`
- **共享工具**：fixture 加载用 `test/helpers/load-fixture.ts`，源码扫描用 `test/helpers/read-project-file.ts`，禁止复制 helper
- **去重原则**：每个行为恰好一个测试文件；AC 与 spec 冲突时 spec 为准，AC 编号保留在 `it` 名

## 组件规范

样式细节见 [docs/ui-design/README.md](../ui-design/README.md)：

- **Color**: `bg-background` / `bg-card` / `text-muted-foreground` 语义 token
- **Spacing**: 4px 基准，核心间距 8/16/24px
- **Radius**: `rounded-xl`(12px) / `rounded-2xl`(16px)
- **Dark mode**: 一等公民，所有颜色必须有 Dark 变体
- **Motion**: 短动画 150-200ms，长动画 300-350ms，`ease-out`
