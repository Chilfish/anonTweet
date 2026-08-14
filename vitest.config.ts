import path from 'node:path'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

/**
 * Vitest 三层架构（docs/planning/testing-infra-refactor.md Phase A~E）
 *
 * - unit:        L1 纯函数/解析器单测（test/unit/**，node 环境，快）
 * - acceptance:  L3 AC 语义层（test/acceptance/**，fixture 回归 + 仓库级静态检查）— Phase B 启用
 * - integration: L2 BFF API 集成（test/integration/**，globalSetup 起 TestServer）— Phase C 启用
 *
 * 注意：projects 模式下顶层 resolve/plugins 与 test 选项（testTimeout/maxWorkers 等）
 * 均不被项目继承，必须通过共享对象展开到每个项目（见下方 sharedProjectConfig /
 * sharedProjectTest）——实测遗漏 testTimeout 会退回默认 5000ms 导致冷加载超时。
 */
const sharedProjectConfig = {
  plugins: [
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './app'),
    },
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
    ],
  },
})
