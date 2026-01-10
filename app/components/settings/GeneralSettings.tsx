import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Switch } from '~/components/ui/switch'
import { useAppConfigStore } from '~/lib/stores/appConfig'

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
  } = useAppConfigStore()

  return (
    <div className="space-y-6 p-1">
      <div className="space-y-2">
        <h4 className="px-1 text-sm font-medium text-muted-foreground">外观</h4>
        <SettingsGroup>
          <SettingsRow>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">主题模式</span>
            </div>
            <ThemeSelector />
          </SettingsRow>
          <SettingsRow>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">截图格式</span>
              <span className="text-xs text-muted-foreground">
                JPEG 体积小，PNG 支持圆角边框
              </span>
            </div>
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
        </SettingsGroup>
      </div>

      <div className="space-y-2">
        <h4 className="px-1 text-sm font-medium text-muted-foreground">网络</h4>
        <SettingsGroup>
          <SettingsRow>
            <div className="flex flex-col gap-1">
              <Label htmlFor="media-proxy-mode" className="text-sm font-medium">媒体代理</Label>
              <span className="text-xs text-muted-foreground">
                代理图片和视频请求
              </span>
            </div>
            <Switch
              id="media-proxy-mode"
              checked={enableMediaProxy}
              onCheckedChange={setEnableMediaProxy}
            />
          </SettingsRow>

          {enableMediaProxy && (
            <SettingsRow>
              <Label htmlFor="media-proxy-url" className="shrink-0 text-sm font-medium">代理地址</Label>
              <div className="flex-1 max-w-[70%]">
                <Input
                  id="media-proxy-url"
                  value={mediaProxyUrl}
                  onChange={e => setMediaProxyUrl(e.target.value)}
                  placeholder="https://proxy.example.com/"
                  className="h-8"
                />
              </div>
            </SettingsRow>
          )}
        </SettingsGroup>
      </div>
    </div>
  )
}
