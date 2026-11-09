import path from 'node:path'
/**
 * test/acceptance/ac-screenshot.spec.ts
 *
 * L3 AC 语义层 — 截图静态检查（自 verify/modules/screenshot.verifier.ts 静态 AC 迁移，Phase D）：
 * AC-SHOT-003（waitForRenderReady 使用）/ 004（font-display: swap）。
 * AC-SHOT-001/002（plain 端点）在 test/integration/api.screenshot.spec.ts。
 */
import { describe, expect, it } from 'vitest'
import { readProjectFile } from '../helpers/read-project-file'

const UTILS_REL = path.join('app', 'lib', 'utils.ts')
const TWEET_HOOK_REL = path.join('app', 'hooks', 'use-screenshot-action.ts')
const IG_HOOK_REL = path.join('app', 'hooks', 'use-ig-screenshot-action.ts')
const FONTS_CSS_REL = path.join('app', 'fonts.css')

describe('AC-SHOT screenshot static checks', () => {
  it('AC-SHOT-003: screenshot hooks wait for render-ready', () => {
    const utils = readProjectFile(UTILS_REL) ?? ''
    const tweetHook = readProjectFile(TWEET_HOOK_REL) ?? ''
    const igHook = readProjectFile(IG_HOOK_REL) ?? ''

    expect(utils).toContain('export async function waitForRenderReady')
    expect(tweetHook).toContain('waitForRenderReady')
    expect(igHook).toContain('waitForRenderReady')

    // 回归（2026-11-09）：截图态会重排 DOM（轮播 → 平铺），必须等渲染提交后
    // 再收集图片；并等 load/decode、MediaImage 的 data-status、opacity 淡入结束。
    expect(utils).toContain('img.decode()')
    expect(utils).toContain('img.dataset.status')
    expect(utils).toContain('\'transitionend\'')
  })

  it('AC-SHOT-004: font rendering non-blocking (font-display: swap)', () => {
    const css = readProjectFile(FONTS_CSS_REL) ?? ''
    expect(css).toContain('font-display: swap')
  })
})
