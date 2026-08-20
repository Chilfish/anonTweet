import type { TestProjectConfiguration } from 'vitest/config'
import path from 'node:path'
import storybookTest from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

/**
 * Vitest 三层架构 + Storybook 视觉测试（docs/archive/testing-infra-refactor.md Phase A~E）
 *
 * - unit:        L1 纯函数/解析器单测（test/unit/**，node 环境，快）
 * - acceptance:  L3 AC 语义层（test/acceptance/**，fixture 回归 + 仓库级静态检查）
 * - integration: L2 BFF API 集成（test/integration/**，setupFiles 起 TestServer，串行）
 * - storybook:   视觉测试（app/stories/**，真实 Chromium 浏览器渲染 story）
 *                仅随 addon-vitest 面板（Storybook Test）或显式
 *                `vitest run --project 'storybook:*'` 启动；`bun run test` 用
 *                `--project unit --project acceptance` 并不包含它。
 *
 * 注意：projects 模式下顶层 resolve/plugins 与 test 选项（testTimeout/maxWorkers 等）
 * 均不被项目继承，必须通过共享对象展开到每个项目（见下方 sharedProjectConfig /
 * sharedProjectTest）——实测遗漏 testTimeout 会退回默认 5000ms 导致冷加载超时。
 */
const sharedProjectConfig: TestProjectConfiguration = {
  plugins: [
  ],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './app'),
    },
    tsconfigPaths: true,
  },
}

const sharedProjectTest = {
  environment: 'node',
  // 16 核机器默认 worker 数 = CPU 核数，并行冷 transform 大依赖图（routes → AI SDK 等）
  // 导致单文件 4s 的冷加载在全量下 >30s（失败集漂移的超时）；限到 2 个 worker（对齐 CI 4 核行为）
  maxWorkers: 2,
  // 服务端路由/模块动态 import 冷加载在并行下可达 10s+（实测单文件 import 13.4s），
  // 默认 5000ms 导致失败集漂移的偶发超时；放宽到 30s 兜底
  testTimeout: 30_000,
  hookTimeout: 30_000,
  clearMocks: true,
  restoreMocks: true,
}

// storybookTest() 需在配置加载期 await（返回 Promise<Plugin[]>）。
// 依赖 @vitest/browser + @vitest/browser-playwright + playwright chromium（已装）。
// 设置文件复用 .storybook/vitest.setup.ts（projectAnnotations + a11y addon）。
const storybookConfigDir = path.resolve(__dirname, '.storybook').replace(/\\/g, '/')
const storybookPlugins = await storybookTest({ configDir: '.storybook' })

export default defineConfig({
  test: {
    projects: [
      {
        ...sharedProjectConfig,
        test: {
          name: 'unit',
          include: ['test/unit/**/*.spec.ts'],
          ...sharedProjectTest,
        },
      },
      {
        ...sharedProjectConfig,
        test: {
          name: 'acceptance',
          include: ['test/acceptance/**/*.spec.ts'],
          ...sharedProjectTest,
        },
      },
      {
        ...sharedProjectConfig,
        test: {
          name: 'integration',
          include: ['test/integration/**/*.spec.ts'],
          globalSetup: ['./test/integration/global-setup.ts'],
          ...sharedProjectTest,
          // 单 TestServer 单 worker：串行，避免每 worker 各起一个 dev server
          maxWorkers: 1,
          fileParallelism: false,
        },
      },
      {
        ...sharedProjectConfig,
        plugins: [...storybookPlugins],
        test: {
          // 项目名必须为 `storybook:<configDir 绝对前向路径>`：addon-vitest 面板以
          // `--project storybook:<STORYBOOK_CONFIG_DIR>` 过滤，Vitest 按
          // wildcardPatternToRegExp 精确匹配该项名（name 或 browser instance 名）。
          // 直接跑用 `vitest run --project 'storybook:*'`（通配前缀）。
          name: `storybook:${storybookConfigDir}`,
          setupFiles: ['./.storybook/vitest.setup.ts'],
          // 真实浏览器渲染每个 story；axe（a11y addon）随 story 测试执行
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: 'chromium', name: 'chromium' }],
            headless: true,
          },
          // 浏览器冷启动 + 全量 story 渲染较慢
          testTimeout: 60_000,
          hookTimeout: 60_000,
        },
      },
    ],
  },
})
