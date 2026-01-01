import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { SettingsGroup, SettingsRow } from '~/components/settings/SettingsUI'
import { Button } from '~/components/ui/button'
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
import { Textarea } from '~/components/ui/textarea'
import { toastManager } from '~/components/ui/toast'
import { fetcher } from '~/lib/fetcher'
import { useAppConfigStore } from '~/lib/stores/appConfig'

export function AITranslationSettings() {
  const {
    enableAITranslation,
    geminiApiKey,
    geminiModel,
    translationGlossary,
    setEnableAITranslation,
    setGeminiApiKey,
    setGeminiModel,
    setTranslationGlossary,
  } = useAppConfigStore()

  const [isTesting, setIsTesting] = useState(false)

  const handleTestConnection = async () => {
    if (!geminiApiKey) {
      toastManager.add({
        title: 'API Key 为空',
        description: '请先输入 Gemini API Key',
        type: 'error',
      })
      return
    }

    setIsTesting(true)
    try {
      const { data } = await fetcher.post('/api/ai-test', {
        apiKey: geminiApiKey,
        model: geminiModel,
        tweetId: '1',
        enableAITranslation: true,
        translationGlossary: '1',
      })

      if (data.success) {
        toastManager.add({
          title: '连接成功',
          description: 'API Key 有效，模型连接正常',
          type: 'success',
        })
      }
      else {
        console.error('Failed to connect to Gemini API:', data)
        toastManager.add({
          title: '连接失败',
          description: `无法连接到 Gemini API.\n原因：${data.cause}`,
          type: 'error',
        })
      }
    }
    catch {
      toastManager.add({
        title: '连接失败',
        description: '无法连接到 Gemini API',
        type: 'error',
      })
    }
    finally {
      setIsTesting(false)
    }
  }

  return (
    <form className="space-y-6 p-1" onSubmit={e => e.preventDefault()}>
      <div className="space-y-2">
        <h4 className="px-1 text-sm font-medium text-muted-foreground">Gemini API 配置</h4>
        <SettingsGroup>
          <SettingsRow>
            <div className="flex flex-col gap-1">
              <Label htmlFor="enable-ai-translation" className="text-sm font-medium">
                启用 AI 翻译
              </Label>
              <span className="text-xs text-muted-foreground">
                使用 Google Gemini 模型自动翻译推文
              </span>
            </div>
            <Switch
              id="enable-ai-translation"
              checked={enableAITranslation}
              onCheckedChange={setEnableAITranslation}
            />
          </SettingsRow>

          {enableAITranslation && (
            <>
              <SettingsRow>
                <Label htmlFor="gemini-api-key" className="w-24 shrink-0 font-medium">
                  API Key
                </Label>
                <Input
                  id="gemini-api-key"
                  type="password"
                  autoComplete="off"
                  value={geminiApiKey}
                  onChange={e => setGeminiApiKey(e.target.value)}
                  placeholder="输入 Gemini API Key"
                  className="text-right h-8"
                />
              </SettingsRow>

              <SettingsRow>
                <Label htmlFor="gemini-model" className="w-24 shrink-0 font-medium">
                  模型选择
                </Label>
                <div className="flex-1 flex justify-end">
                  <Select value={geminiModel} onValueChange={val => val && setGeminiModel(val)}>
                    <SelectTrigger className="w-fit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="models/gemini-3-flash-preview">Gemini 3 Flash</SelectItem>
                      <SelectItem value="models/gemini-3-pro-preview">Gemini 3 Pro</SelectItem>
                      <SelectItem value="models/gemini-2.5-flash">Gemini 2.5 flash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </SettingsRow>

              <SettingsRow>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">连通性测试</span>
                  <span className="text-xs text-muted-foreground">验证 API Key 和网络连接</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="mr-2 size-3 animate-spin" />
                      测试中
                    </>
                  ) : (
                    '测试连接'
                  )}
                </Button>
              </SettingsRow>
            </>
          )}
        </SettingsGroup>
      </div>

      {enableAITranslation && (
        <div className="space-y-2">
          <h4 className="px-1 text-sm font-medium text-muted-foreground">翻译术语表</h4>
          <SettingsGroup>
            <SettingsRow className="border-b-0">
              <div className="flex flex-col gap-1 w-full">
                <Label htmlFor="translation-glossary" className="text-sm font-medium">
                  术语定义与提示词
                </Label>
                <span className="text-xs text-muted-foreground">
                  在此输入给 AI 的额外提示词或术语对照，有助于提高翻译准确性。
                </span>
              </div>
            </SettingsRow>
            <Textarea
              id="translation-glossary"
              value={translationGlossary}
              onChange={e => setTranslationGlossary(e.target.value)}
              placeholder="例如：请将所有 'Tweet' 翻译为 '推文'，保持 emoji 原样..."
              className="min-h-30 leading-relaxed"
            />
          </SettingsGroup>
        </div>
      )}
    </form>
  )
}
