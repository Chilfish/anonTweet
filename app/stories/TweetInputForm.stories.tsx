import type { Meta, StoryObj } from '@storybook/react-vite'
import { TweetInputForm } from '~/components/tweet/TweetInputForm'

/**
 * TweetInputForm —— 首页 URL/ID 输入表单（跳转 Tweets/IG 详情）。
 * Router 上下文由 .storybook/preview.ts 全局提供（useNavigate 可用）。
 * 提交后跳转/报错为交互态，可在 Storybook 面板操作。
 */
const meta = {
  title: 'Tweet/InputForm',
  component: TweetInputForm,
  parameters: { layout: 'centered' },
  decorators: [
    Story => (
      <div className="bg-background p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TweetInputForm>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** 移动端宽度：表单随容器收缩 */
export const MobileNarrow: Story = {
  decorators: [
    () => (
      <div className="w-[320px] bg-background p-4">
        <TweetInputForm />
      </div>
    ),
  ],
}
