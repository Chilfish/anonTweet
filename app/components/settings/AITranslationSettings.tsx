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
import { models } from '~/lib/constants'
import { fetcher } from '~/lib/fetcher'
import { useAppConfigStore } from '~/lib/stores/appConfig'
import { useTranslationDictionaryStore } from '~/lib/stores/TranslationDictionary'

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

  const { entries } = useTranslationDictionaryStore()

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
                <div className="flex flex-col gap-1">
                  <Label htmlFor="gemini-api-key" className="font-medium">
                    API Key
                  </Label>
                  <a
                    href="https://aistudio.google.com/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-muted-foreground underline hover:text-primary"
                  >
                    获取 API Key
                  </a>
                </div>
                <Input
                  id="gemini-api-key"
                  type="password"
                  autoComplete="off"
                  value={geminiApiKey}
                  onChange={e => setGeminiApiKey(e.target.value)}
                  placeholder="输入 Gemini API Key"
                  className="text-right h-8 w-1/2 min-w-40"
                />
              </SettingsRow>

              <SettingsRow>
                <Label htmlFor="gemini-model" className="w-24 shrink-0 font-medium">
                  模型选择
                </Label>
                <div className="flex-1 flex justify-end">
                  <Select value={geminiModel} onValueChange={val => val && setGeminiModel(val)}>
                    <SelectTrigger className="w-fit">
                      <SelectValue>
                        {models.find(model => model.name === geminiModel)?.text || '选择模型'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {
                        models.map(model => (
                          <SelectItem key={model.name} value={model.name}>
                            {model.text}
                          </SelectItem>
                        ))
                      }
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
        {enableAITranslation && (
          <p className="px-4 text-[10px] text-muted-foreground/60 leading-tight">
            您的 API Key 仅存储在浏览器本地，经由服务器直接用于与 Google Gemini API 通信，不会经过/发送/存储给第三方。
          </p>
        )}
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
              placeholder="例如：ひなぴよ -> Hinapiyo..."
              className="min-h-30 leading-relaxed"
            />
            {entries.length > 0 && (
              <p className="px-4 text-[10px] text-muted-foreground/60 leading-tight py-1">
                已自动包含翻译词汇表中的
                {' '}
                {entries.length}
                {' '}
                条词条。
              </p>
            )}
          </SettingsGroup>
        </div>
      )}
    </form>
  )
}
