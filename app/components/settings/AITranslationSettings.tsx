import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { SettingsGroup, SettingsRow } from '~/components/settings/SettingsUI'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
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
    geminiThinkingLevel,
    translationGlossary,
    setEnableAITranslation,
    setGeminiApiKey,
    setGeminiModel,
    setGeminiThinkingLevel,
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
        thinkingLevel: geminiThinkingLevel,
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
    setIsTesting(false)
  }

  return (
    <div className="space-y-6 p-1">
      <div className="space-y-2">
        <h4 className="px-1 text-sm font-medium text-muted-foreground">Gemini API 配置</h4>
        <SettingsGroup>
          <SettingsRow
            label="启用 AI 翻译"
            description="使用 Google Gemini 模型自动翻译推文"
            id="enable-ai-translation"
          >
            <Switch
              checked={enableAITranslation}
              onCheckedChange={setEnableAITranslation}
            />
          </SettingsRow>

          {enableAITranslation && (
            <>
              <SettingsRow
                label="API Key"
                description={(
                  <a
                    href="https://aistudio.google.com/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-muted-foreground underline hover:text-primary"
                  >
                    获取 API Key
                  </a>
                )}
                id="gemini-api-key"
              >
                <Input
                  type="password"
                  autoComplete="off"
                  value={geminiApiKey}
                  onChange={e => setGeminiApiKey(e.target.value)}
                  placeholder="输入 Gemini API Key"
                  className="text-right h-8 sm:min-w-64"
                />
              </SettingsRow>

              <SettingsRow
                label="模型选择"
                id="gemini-model"
              >
                <div className="flex-1 flex justify-end">
                  <Select
                    value={geminiModel}
                    onValueChange={(val) => {
                      if (!val)
                        return
                      setGeminiModel(val)
                      // 切换模型时，如果当前思考程度不被支持，重置为第一个可用选项或 minimal
                      const nextModel = models.find(m => m.name === val)
                      if (nextModel?.thinkingType === 'level' && nextModel.supportedLevels) {
                        if (!nextModel.supportedLevels.includes(geminiThinkingLevel)) {
                          setGeminiThinkingLevel(nextModel.supportedLevels[0]!)
                        }
                      }
                      else if (nextModel?.thinkingType === 'budget') {
                        // Gemini 2.5 统一映射，不需要重置，除非需要
                      }
                    }}
                  >
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

              {models.find(m => m.name === geminiModel)?.thinkingType !== 'none' && (
                <SettingsRow
                  label="思考程度"
                  description="控制模型翻译时的思考深度，影响翻译耗时"
                >
                  <div className="flex-1 flex justify-end">
                    <Select
                      value={geminiThinkingLevel}
                      onValueChange={val => val && setGeminiThinkingLevel(val as any)}
                    >
                      <SelectTrigger className="w-fit h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(() => {
                          const currentModel = models.find(m => m.name === geminiModel)
                          if (currentModel?.thinkingType === 'level' && currentModel.supportedLevels) {
                            return (
                              <>
                                {currentModel.supportedLevels.includes('minimal') && <SelectItem value="minimal">最低 (Minimal)</SelectItem>}
                                {currentModel.supportedLevels.includes('low') && <SelectItem value="low">较低 (Low)</SelectItem>}
                                {currentModel.supportedLevels.includes('medium') && <SelectItem value="medium">中等 (Medium)</SelectItem>}
                                {currentModel.supportedLevels.includes('high') && <SelectItem value="high">最高 (High)</SelectItem>}
                              </>
                            )
                          }
                          // 默认显示所有（针对 budget 类型或 fallback）
                          return (
                            <>
                              <SelectItem value="minimal">最低 (Minimal)</SelectItem>
                              <SelectItem value="low">较低 (Low)</SelectItem>
                              <SelectItem value="medium">中等 (Medium)</SelectItem>
                              <SelectItem value="high">最高 (High)</SelectItem>
                            </>
                          )
                        })()}
                      </SelectContent>
                    </Select>
                  </div>
                </SettingsRow>
              )}

              <SettingsRow
                label="连通性测试"
                description="验证 API Key 和网络连接"
              >
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
            <SettingsRow
              label="术语定义与提示词"
              description="在此输入给 AI 的额外提示词或术语对照，有助于提高翻译准确性。"
              id="translation-glossary"
              className="border-b-0"
            >
            </SettingsRow>
            <Textarea
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
    </div>
  )
}
