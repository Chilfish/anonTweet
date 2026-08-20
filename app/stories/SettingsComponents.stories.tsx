import type { Meta, StoryObj } from '@storybook/react-vite'
import { AITranslationSettings } from '~/components/settings/AITranslationSettings'
import { AIVisionSettings } from '~/components/settings/AIVisionSettings'
import { GeneralSettings } from '~/components/settings/GeneralSettings'
import { SettingsGroup, SettingsRow } from '~/components/settings/SettingsUI'
import { Switch } from '~/components/ui/switch'
import { seedApp, WithStoreState } from './story.store'

/**
 * settings 目录在用组件补全 story（review 阶段二 item 3）：
 * AITranslationSettings / AIVisionSettings / GeneralSettings / SettingsUI 原语演示。
 * SettingsPanel/ThemeSwitcher/SeparatorTemplateManager/TranslationDictionaryManager
 * 已由 Settings.stories.tsx 覆盖。
 */

const pageMeta = {
  title: 'Settings/Panels',
  parameters: { layout: 'centered' },
  decorators: [
    Story => (
      <div className="w-[680px] bg-card p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta

export default pageMeta

type PageStory = StoryObj<typeof pageMeta>

export const TranslationSettings: PageStory = {
  render: () => (
    <WithStoreState seed={() => seedApp({ enableAITranslation: true })}>
      <AITranslationSettings />
    </WithStoreState>
  ),
}

export const TranslationSettingsCollapsed: PageStory = {
  render: () => (
    <WithStoreState seed={() => seedApp({ enableAITranslation: false })}>
      <AITranslationSettings />
    </WithStoreState>
  ),
}

export const VisionSettings: PageStory = {
  render: () => (
    <WithStoreState seed={() => seedApp({ enableAIVision: true, visionProvider: 'google' })}>
      <AIVisionSettings />
    </WithStoreState>
  ),
}

export const General: PageStory = {
  render: () => (
    <WithStoreState
      seed={() => seedApp({
        enableMediaProxy: true,
        mediaProxyUrl: 'https://proxy.chilfish.top/',
        screenshotFormat: 'png',
      })}
    >
      <GeneralSettings />
    </WithStoreState>
  ),
}

export const SettingsRowGroup: PageStory = {
  render: () => (
    <SettingsGroup>
      <SettingsRow label="示例开关行" description="描述文本，说明行的用途">
        <Switch checked onCheckedChange={() => {}} />
      </SettingsRow>
      <SettingsRow label="第二行" id="row-2">
        <span className="text-sm text-muted-foreground">自定义控件区域</span>
      </SettingsRow>
    </SettingsGroup>
  ),
}
