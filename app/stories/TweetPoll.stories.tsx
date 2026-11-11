import type { Meta, StoryObj } from '@storybook/react-vite'
import { PollCardView } from '~/components/tweet/PollCard'
import { imagePoll, textPoll } from './tweet.fixtures'

/**
 * 投票卡两态：纯文字结果条 / 带图 2×2 网格。
 * 数据与 `test/fixtures/poll/*.json` 同源（真实推文解析结果）。
 */
const meta = {
  title: 'Tweet/Poll',
  parameters: { layout: 'centered' },
  decorators: [
    Story => (
      <div className="w-full max-w-[420px] bg-card p-2">
        <Story />
      </div>
    ),
  ],
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const TextPoll: Story = {
  render: () => <PollCardView poll={textPoll} />,
}

export const ImagePoll: Story = {
  render: () => <PollCardView poll={imagePoll} />,
}

/** 进行中（未最终结果，显示固定时区的截止时间） */
export const OngoingPoll: Story = {
  render: () => (
    <PollCardView
      poll={{
        ...textPoll,
        countsAreFinal: false,
        endDatetime: '2026-11-20T08:05:00.000Z',
        choices: [
          { label: 'Yes', count: 120, percentage: 60 },
          { label: 'No', count: 80, percentage: 40 },
        ],
        totalVotes: 200,
      }}
    />
  ),
}
