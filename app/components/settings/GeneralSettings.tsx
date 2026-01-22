import { Input } from '~/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Switch } from '~/components/ui/switch'
import { useAppConfigStore } from '~/lib/stores/appConfig'

import { useTranslationActions, useTranslationSettings } from '~/lib/stores/hooks'
import { SettingsGroup, SettingsRow } from './SettingsUI'
import { ThemeSelector } from './ThemeSwitcher'

export function GeneralSettings() {
  const {
    enableMediaProxy,
    mediaProxyUrl,
    setEnableMediaProxy,
    setMediaProxyUrl,
    screenshotFormat,
    setScreenshotFormat,
    isInlineMedia,
    setIsInlineMedia,
  } = useAppConfigStore()

  const { filterUnrelated } = useTranslationSettings()
  const { updateSettings } = useTranslationActions()

  return (
    <div className="space-y-6 p-1">
      <div className="space-y-2">
        <h4 className="px-1 text-sm font-medium text-muted-foreground">外观</h4>
        <SettingsGroup>
          <SettingsRow
            label="主题模式"
          >
            <ThemeSelector />
          </SettingsRow>
          <SettingsRow
            label="截图格式"
            description="JPEG 体积小，PNG 支持圆角边框"
          >
            <Select
              value={screenshotFormat}
              onValueChange={(val: any) => setScreenshotFormat(val)}
            >
              <SelectTrigger className="h-8 w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                <SelectItem value="png">PNG</SelectItem>
                <SelectItem value="jpeg">JPEG</SelectItem>
              </SelectContent>
            </Select>
          </SettingsRow>

          <SettingsRow
            label="默认过滤无关评论"
            description="过滤与博主无互动的评论"
            id="filter-unrelated"
          >
            <Switch
              checked={filterUnrelated}
              onCheckedChange={value => updateSettings({ filterUnrelated: value })}
            />
          </SettingsRow>
        </SettingsGroup>
      </div>

      <div className="space-y-2">
        <h4 className="px-1 text-sm font-medium text-muted-foreground">网络</h4>
        <SettingsGroup>
          <SettingsRow
            label="媒体代理"
            description="代理图片和视频请求"
            id="media-proxy-mode"
          >
            <Switch
              checked={enableMediaProxy}
              onCheckedChange={setEnableMediaProxy}
            />
          </SettingsRow>

          {enableMediaProxy && (
            <SettingsRow
              label="代理地址"
              id="media-proxy-url"
            >
              <Input
                value={mediaProxyUrl}
                onChange={e => setMediaProxyUrl(e.target.value)}
                placeholder="https://proxy.example.com/"
                className="h-8 min-w-64"
              />
            </SettingsRow>
          )}
        </SettingsGroup>
      </div>
    </div>
  )
}
