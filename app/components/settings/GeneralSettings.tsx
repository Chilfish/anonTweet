import type { DownloadImageSize } from '~/lib/stores/appConfig'
import { useShallow } from 'zustand/react/shallow'
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

const downloadImageSizeOptions: { label: string, value: DownloadImageSize }[] = [
  { label: '默认 JPG', value: 'large' },
  { label: '原图最大', value: 'orig' },
]

export function GeneralSettings() {
  const {
    enableMediaProxy,
    mediaProxyUrl,
    setEnableMediaProxy,
    setMediaProxyUrl,
    screenshotFormat,
    setScreenshotFormat,
    downloadImageSize,
    setDownloadImageSize,
    downloadCardImages,
    setDownloadCardImages,
  } = useAppConfigStore(
    useShallow(state => ({
      enableMediaProxy: state.enableMediaProxy,
      mediaProxyUrl: state.mediaProxyUrl,
      setEnableMediaProxy: state.setEnableMediaProxy,
      setMediaProxyUrl: state.setMediaProxyUrl,
      screenshotFormat: state.screenshotFormat,
      setScreenshotFormat: state.setScreenshotFormat,
      downloadImageSize: state.downloadImageSize,
      setDownloadImageSize: state.setDownloadImageSize,
      downloadCardImages: state.downloadCardImages,
      setDownloadCardImages: state.setDownloadCardImages,
    })),
  )

  const { filterUnrelated } = useTranslationSettings()
  const { updateSettings } = useTranslationActions()

  const currentDownloadImageSizeOption = downloadImageSizeOptions.find(
    opt => opt.value === downloadImageSize,
  )

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

      <div className="space-y-2">
        <h4 className="px-1 text-sm font-medium text-muted-foreground">下载</h4>
        <SettingsGroup>
          <SettingsRow
            label="图片分辨率"
            description="原图保留最大分辨率，体积更大；默认 JPG 长边封顶 2048px"
          >
            <Select
              value={currentDownloadImageSizeOption}
              onValueChange={(opt) => {
                if (!opt)
                  return
                setDownloadImageSize(opt.value)
              }}
            >
              <SelectTrigger className="h-8 w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {downloadImageSizeOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingsRow>

          <SettingsRow
            label="下载链接卡片图片"
            description="一并下载推文链接卡片（link card）中的图片"
            id="download-card-images"
          >
            <Switch
              checked={downloadCardImages}
              onCheckedChange={setDownloadCardImages}
            />
          </SettingsRow>
        </SettingsGroup>
      </div>
    </div>
  )
}
