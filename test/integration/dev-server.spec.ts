/**
 * test/integration/dev-server.spec.ts
 *
 * L2 集成层 — dev server 启动健康（F1 / postmortem 011）：
 * AC-DEV-001（行为验收）。
 *
 * 回归背景：`react-router dev` 继承宿主 `NODE_ENV=production` 时，Vite SSR 仍按 dev
 * 产出 `import { jsxDEV } from 'react/jsx-dev-runtime'`，但 React 的 CJS shim 在
 * production 下返回不含 jsxDEV 的构建 → 根页 500
 * `TypeError: (0, ...jsxDEV) is not a function`。修复：dev script 经 cross-env 显式
 * 固定 NODE_ENV=development。本用例在任意宿主 NODE_ENV 下都要求根页健康。
 */
import { describe, expect, it } from 'vitest'
import { testEnv } from '../helpers/env'
import { getClient } from '../helpers/test-context'

describe.skipIf(!testEnv.hasServer)('AC-DEV-001 dev server health', () => {
  it('AC-DEV-001: root page responds 2xx despite inherited NODE_ENV', async () => {
    expect(await getClient().health()).toBe(true)
  })
})
