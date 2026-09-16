import type { Meta, StoryObj } from '@storybook/react-vite'
import { TweetSpaceCard } from '~/components/tweet/TweetSpaceCard'
import {
  tweetWithLiveSpace,
  tweetWithLongSpaceTitle,
  tweetWithNoReplaySpace,
  tweetWithSpace,
  tweetWithUnavailableSpace,
} from './tweet.fixtures'

/**
 * X Space（语音直播 / 录音回放）卡片五态：
 * 已结束可回放（真实数据）/ 进行中（无时长）/ 未开启回放 / 已删除 / 超长标题 + 大数字。
 * 视觉输入 = 真实 fixture（Space `1yoKMPnjEbOxQ` 与已删除的 `1DGLdvzVZmLGm`），对照官方渲染 DOM。
 */
const meta = {
  title: 'Tweet/SpaceCard',
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

/** 已结束 + 可回放（官方卡片：2,478 人收听/回放 · 9月17日 · 42:40） */
export const EndedWithReplay: Story = {
  render: () => <TweetSpaceCard tweet={tweetWithSpace} />,
}

/** 进行中：无结束时间 → 不显示时长，行动区为「直播中」 */
export const Live: Story = {
  render: () => <TweetSpaceCard tweet={tweetWithLiveSpace} />,
}

/** 已结束但未开启回放：不给播放入口（「录音不可回放」） */
export const ReplayDisabled: Story = {
  render: () => <TweetSpaceCard tweet={tweetWithNoReplaySpace} />,
}

/** Space 已删除 / 不可访问：中性墓碑条，不再只剩一个裸链接 */
export const Deleted: Story = {
  render: () => <TweetSpaceCard tweet={tweetWithUnavailableSpace} />,
}

/** 超长标题（line-clamp-2）+ 百万级人数（千分位） */
export const LongTitleLargeCount: Story = {
  render: () => <TweetSpaceCard tweet={tweetWithLongSpaceTitle} />,
}

/** 移动端窄屏（<360px）：标题换行、元信息换行不与按钮抢位 */
export const MobileNarrow: Story = {
  render: () => (
    <div className="w-[320px] bg-card p-2">
      <TweetSpaceCard tweet={tweetWithLongSpaceTitle} />
    </div>
  ),
}
