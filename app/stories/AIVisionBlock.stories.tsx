import type { Meta, StoryObj } from '@storybook/react-vite'
import { AIVisionBlock } from '~/components/tweet/AIVisionBlock'
import { seedApp, WithStoreState } from './story.store'
import {
  tweetWithPhotos,
  tweetWithPhotosNoAlt,
  tweetWithVisionDone,
  tweetWithVisionError,
} from './tweet.fixtures'

/**
 * AIVisionBlock —— AI 图片描述展示块。
 * 场景矩阵（resolveVisionBlockState 纯函数驱动）：
 * 内容（全局开）/ 仅译文 / 折叠细条（全局关 + 有缓存）/ 空态 CTA（全局开 + 无内容）
 * / 错误态 / 截图隐藏 chrome / 无图空态。
 */
const meta = {
  title: 'Tweet/AIVisionBlock',
  parameters: { layout: 'centered' },
  decorators: [
    Story => (
      <div className="w-full max-w-[520px] bg-card p-3">
        <Story />
      </div>
    ),
  ],
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const ContentVisible: Story = {
  render: () => (
    <WithStoreState seed={() => seedApp({ enableAIVision: true, visionShowTranslatedOnly: false })}>
      <AIVisionBlock tweet={tweetWithVisionDone} />
    </WithStoreState>
  ),
}

export const TranslatedOnly: Story = {
  render: () => (
    <WithStoreState seed={() => seedApp({ enableAIVision: true, visionShowTranslatedOnly: true })}>
      <AIVisionBlock tweet={tweetWithVisionDone} />
    </WithStoreState>
  ),
}

/** 全局关 + 有缓存内容 → 折叠细条（点击展开的渐进披露入口） */
export const Collapsed: Story = {
  render: () => (
    <WithStoreState seed={() => seedApp({ enableAIVision: false })}>
      <AIVisionBlock tweet={tweetWithVisionDone} />
    </WithStoreState>
  ),
}

/** 全局开 + 无 AI 内容 → 空态 CTA（为配图生成 AI 描述） */
export const EmptyCta: Story = {
  render: () => (
    <WithStoreState seed={() => seedApp({ enableAIVision: true })}>
      <AIVisionBlock tweet={tweetWithPhotos} />
    </WithStoreState>
  ),
}

/** 单图失败 → 错误信息展示（其余图正常） */
export const WithError: Story = {
  render: () => (
    <WithStoreState seed={() => seedApp({ enableAIVision: true })}>
      <AIVisionBlock tweet={tweetWithVisionError} />
    </WithStoreState>
  ),
}

/** 截图场景（hideChrome）：隐藏交互按钮，只留描述内容 */
export const ScreenshotHideChrome: Story = {
  render: () => (
    <WithStoreState seed={() => seedApp({ enableAIVision: true })}>
      <AIVisionBlock tweet={tweetWithVisionDone} hideChrome />
    </WithStoreState>
  ),
}

/** 无配图 → 组件不渲染（空态） */
export const NoPhotos: Story = {
  render: () => (
    <WithStoreState seed={() => seedApp({ enableAIVision: true })}>
      <AIVisionBlock tweet={tweetWithPhotosNoAlt} />
    </WithStoreState>
  ),
}
