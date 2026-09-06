import { describe, expect, it } from 'vitest'
import { shouldOfferUpdate } from '~/lib/pwa/update'

/**
 * AC-PWA-008 单元验证：版本更新判定（app/lib/pwa/update.ts 纯函数）。
 *
 * 语义：仅当页面已被 SW 控制（hasController）且新 worker 到达
 * installed/activating/activated 才算一次真实版本更新；首次访问（初次安装/无 controller）
 * 与 installing/waiting 等中间态不打扰用户。
 */
describe('AC-PWA-008: shouldOfferUpdate（受控 + 可应用状态才提示刷新）', () => {
  it('无 controller（首次访问/初次安装）一律不提示', () => {
    for (const state of ['parsed', 'installing', 'installed', 'activating', 'activated', null]) {
      expect(shouldOfferUpdate({ hasController: false, state })).toBe(false)
    }
  })

  it('受控后 installing/waiting 等未接管状态不提示', () => {
    expect(shouldOfferUpdate({ hasController: true, state: 'installing' })).toBe(false)
    expect(shouldOfferUpdate({ hasController: true, state: 'waiting' })).toBe(false)
    expect(shouldOfferUpdate({ hasController: true, state: null })).toBe(false)
  })

  it('受控且新 worker 已 installed/activating/activated 才提示', () => {
    expect(shouldOfferUpdate({ hasController: true, state: 'installed' })).toBe(true)
    expect(shouldOfferUpdate({ hasController: true, state: 'activating' })).toBe(true)
    expect(shouldOfferUpdate({ hasController: true, state: 'activated' })).toBe(true)
  })
})
