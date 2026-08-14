import path from 'node:path'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './app'),
    },
  },
  test: {
    environment: 'node',
    clearMocks: true,
    restoreMocks: true,
    // 16 核机器默认 worker 数 = CPU 核数，并行冷 transform 大依赖图（routes → AI SDK 等）
    // 导致单文件 4s 的冷加载在全量下 >30s（失败集漂移的超时）；限到 2 个 worker（对齐 CI 4 核行为）
    maxWorkers: 2,
    // 服务端路由/模块动态 import 冷加载在并行下可达 10s+（实测单文件 import 13.4s），
    // 默认 5000ms 导致失败集漂移的偶发超时；放宽到 30s 兜底
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
})
