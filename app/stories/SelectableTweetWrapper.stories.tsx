import type { Meta, StoryObj } from '@storybook/react-vite'
import { SelectableTweetWrapper } from '~/components/tweet/SelectableTweetWrapper'
import { seedUI, WithStoreState } from './story.store'
import { tweetWithCard } from './tweet.fixtures'

/**
 * SelectableTweetWrapper —— 推文选择包装（截图选择模式核心）。
 * 场景：普通模式（透传）/ 选择模式（勾选框 + 点击整区选中）/ show=false 直通。
 */
const meta = {
  title: 'Tweet/SelectableWrapper',
  parameters: { layout: 'centered' },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

const box = (
  <div className="w-[520px] rounded-md border border-border/60 bg-card p-4 text-sm">
    推文内容占位：
    <strong>{tweetWithCard.text.slice(0, 40)}</strong>
  </div>
)

export const NormalMode: Story = {
  render: () => (
    <SelectableTweetWrapper tweetId={tweetWithCard.id_str}>{box}</SelectableTweetWrapper>
  ),
}

export const SelectionMode: Story = {
  render: () => (
    <WithStoreState seed={() => seedUI({ isSelectionMode: true, selectedTweetIds: [] })}>
      <SelectableTweetWrapper tweetId={tweetWithCard.id_str}>{box}</SelectableTweetWrapper>
    </WithStoreState>
  ),
}

export const SelectionModeChecked: Story = {
  render: () => (
    <WithStoreState
      seed={() => seedUI({ isSelectionMode: true, selectedTweetIds: [tweetWithCard.id_str] })}
    >
      <SelectableTweetWrapper tweetId={tweetWithCard.id_str}>{box}</SelectableTweetWrapper>
    </WithStoreState>
  ),
}

/** show=false：截取仅选中推文时，未选中的非顶层节点直接透传 children（保持可见性判断由上层负责） */
export const Passthrough: Story = {
  render: () => (
    <SelectableTweetWrapper tweetId={tweetWithCard.id_str} show={false}>
      {box}
    </SelectableTweetWrapper>
  ),
}
