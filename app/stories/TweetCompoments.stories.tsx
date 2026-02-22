import type { Meta, StoryObj } from '@storybook/react-vite'
import { TweetSkeleton } from '~/lib/react-tweet'

const meta = {
  title: 'Tweetss',
  parameters: {
    layout: 'centered',
  },

} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const tweetSkeleton: Story = {
  render: () => <TweetSkeleton />,
}
