import { afterEach, describe, expect, it } from 'vitest'
import { getAIRequestMode } from '~/lib/ai/request'
import { useAppConfigStore } from '~/lib/stores/appConfig'

describe('AC-TRANS-009: AI 请求路径默认服务端中继，可切换浏览器直连', () => {
  afterEach(() => {
    useAppConfigStore.getState().setAIRequestMode('server')
  })

  it('默认走服务端 CF Worker 中继', () => {
    expect(useAppConfigStore.getState().aiRequestMode).toBe('server')
    expect(getAIRequestMode()).toBe('server')
  })

  it('切换后 dispatcher 读取到 browser', () => {
    useAppConfigStore.getState().setAIRequestMode('browser')
    expect(getAIRequestMode()).toBe('browser')
  })
})
