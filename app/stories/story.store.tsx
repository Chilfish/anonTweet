import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { useAppConfigStore } from '~/lib/stores/appConfig'
import { useTranslationStore } from '~/lib/stores/translation'
import { useTranslationUIStore } from '~/lib/stores/translationUI'

/**
 * app/stories/story.store.tsx —— Storybook 场景用 store 种子助手
 *
 * 需要特定 store 状态的 story（翻译可见、选择模式、评论开关、AI 视觉开关等），
 * 用 <WithStoreState seed={...}> 包裹：挂载后 seed，zustand 通知订阅组件重渲染，
 * 避免在渲染函数体内直接 setState（React 渲染期副作用）。
 */

type AppPartial = Partial<ReturnType<typeof useAppConfigStore.getState>>
type TranslationPartial = Partial<ReturnType<typeof useTranslationStore.getState>>
type UIPartial = Partial<ReturnType<typeof useTranslationUIStore.getState>>

export function seedApp(partial: AppPartial) {
  useAppConfigStore.setState(partial)
}

export function seedTranslation(partial: TranslationPartial) {
  useTranslationStore.setState(partial)
}

export function seedUI(partial: UIPartial) {
  useTranslationUIStore.setState(partial)
}

/** 挂载后执行 seed 的包装组件（post-mount seed，触发订阅者重渲染） */
export function WithStoreState({ seed, children }: { seed: () => void, children: ReactNode }) {
  useEffect(() => {
    seed()
  }, [seed])

  return <>{children}</>
}
