import type { Meta, StoryObj } from '@storybook/react-vite'
import type { AITransportError } from '~/lib/ai-error'
import { AIErrorDetail } from '~/components/translation/AIErrorDetail'
import { BackButton } from '~/components/translation/BackButton'
import { DictionaryViewer } from '~/components/translation/DictionaryViewer'
import { DownloadMedia } from '~/components/translation/DownloadMedia'
import { SaveAsImageButton } from '~/components/translation/SaveAsImageButton'
import { ToggleTransButton } from '~/components/translation/ToggleTransButton'
import { seedTranslation, WithStoreState } from './story.store'
import { tweetEnglish, tweetWithPhotos } from './tweet.fixtures'

/**
 * translation 在用轻量组件 story（review 阶段二 item 3）：
 * BackButton / ToggleTransButton / SaveAsImageButton / DownloadMedia /
 * AIErrorDetail / DictionaryViewer。Router 上下文由 preview.tsx 全局提供。
 * 编辑器/显示组件见 TranslationEditors.stories.tsx。
 */
const meta = {
  title: 'Translation/Actions',
  parameters: { layout: 'centered' },
  decorators: [
    Story => (
      <div className="flex min-h-32 w-[560px] flex-wrap items-center gap-3 bg-background p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Back: Story = {
  render: () => <BackButton />,
}

export const ToggleGlobal: Story = {
  render: () => <ToggleTransButton />,
}

export const TogglePerTweet: Story = {
  render: () => <ToggleTransButton tweetId={tweetEnglish.id_str} />,
}

export const SaveScreenshot: Story = {
  render: () => <SaveAsImageButton />,
}

export const DownloadMediaButton: Story = {
  render: () => (
    <WithStoreState seed={() => seedTranslation({ tweets: [tweetWithPhotos] })}>
      <DownloadMedia />
    </WithStoreState>
  ),
}

export const ErrorDetail: Story = {
  render: () => (
    <div className="w-full max-w-[420px]">
      <AIErrorDetail
        error={{
          type: 'APICallError',
          message: '请求失败',
          url: 'https://api.openrouter.ai/api/v1/chat/completions',
          statusCode: 401,
          responseBody: JSON.stringify({ error: { message: 'Invalid API key.' } }),
          providerMessage: 'Invalid API key.',
          isRetryable: false,
        } satisfies AITransportError}
      />
    </div>
  ),
}

export const ErrorDetailNoMeta: Story = {
  render: () => (
    <div className="w-full max-w-[420px]">
      <AIErrorDetail
        error={{
          type: 'Error',
          message: '网络异常',
          url: undefined,
        } satisfies AITransportError}
      />
    </div>
  ),
}

export const Dictionary: Story = {
  render: () => (
    <div className="w-[320px] rounded-xl border bg-card p-3">
      <DictionaryViewer />
    </div>
  ),
}
