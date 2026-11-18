import { describe, expect, it } from 'vitest'
import { useAppConfigStore } from '~/lib/stores/appConfig'

describe('AC-TRANS-008: 默认 AI 引擎为 DeepSeek Flash', () => {
  it('翻译与视觉 provider 默认都是 deepseek，模型为官方别名 deepseek-flash', () => {
    const state = useAppConfigStore.getState()
    expect(state.aiProvider).toBe('deepseek')
    expect(state.visionProvider).toBe('deepseek')
    expect(state.deepseekModel).toBe('deepseek-flash')
  })
})
