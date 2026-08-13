import type { ThinkingLevel } from '~/lib/stores/appConfig'
import { Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { SettingsGroup, SettingsRow } from '~/components/settings/SettingsUI'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Switch } from '~/components/ui/switch'
import { Textarea } from '~/components/ui/textarea'
import { toastManager } from '~/components/ui/toast'
import { toastAIError } from '~/lib/ai-error-toast'
import { DEFAULT_DEEPSEEK_BASE_URL, DEFAULT_GEMINI_BASE_URL, models } from '~/lib/constants'
import { fetcher } from '~/lib/fetcher'
import { useAppConfigStore } from '~/lib/stores/appConfig'
import { useTranslationDictionaryStore } from '~/lib/stores/TranslationDictionary'

/** 模型下拉中的「自定义」哨兵项，用于切换到手写模型名的输入模式 */
const CUSTOM_MODEL_VALUE = '__custom__'
const CUSTOM_MODEL_OPTION = { label: '自定义模型…', value: CUSTOM_MODEL_VALUE }

export function AITranslationSettings() {
  const {
    enableAITranslation,
    aiProvider,
    geminiApiKey,
    geminiModel,
    geminiBaseUrl,
    geminiThinkingLevel,
    deepseekApiKey,
    deepseekModel,
    deepseekBaseUrl,
    deepseekThinkingLevel,
    translationGlossary,
    setEnableAITranslation,
    setAIProvider,
    setGeminiApiKey,
    setGeminiModel,
    setGeminiBaseUrl,
    setGeminiThinkingLevel,
    setDeepseekApiKey,
    setDeepseekModel,
    setDeepseekBaseUrl,
    setDeepseekThinkingLevel,
    setTranslationGlossary,
  } = useAppConfigStore(
    useShallow(state => ({
      enableAITranslation: state.enableAITranslation,
      aiProvider: state.aiProvider,
      geminiApiKey: state.geminiApiKey,
      geminiModel: state.geminiModel,
      geminiBaseUrl: state.geminiBaseUrl,
      geminiThinkingLevel: state.geminiThinkingLevel,
      deepseekApiKey: state.deepseekApiKey,
      deepseekModel: state.deepseekModel,
      deepseekBaseUrl: state.deepseekBaseUrl,
      deepseekThinkingLevel: state.deepseekThinkingLevel,
      translationGlossary: state.translationGlossary,
      setEnableAITranslation: state.setEnableAITranslation,
      setAIProvider: state.setAIProvider,
      setGeminiApiKey: state.setGeminiApiKey,
      setGeminiModel: state.setGeminiModel,
      setGeminiBaseUrl: state.setGeminiBaseUrl,
      setGeminiThinkingLevel: state.setGeminiThinkingLevel,
      setDeepseekApiKey: state.setDeepseekApiKey,
      setDeepseekModel: state.setDeepseekModel,
      setDeepseekBaseUrl: state.setDeepseekBaseUrl,
      setDeepseekThinkingLevel: state.setDeepseekThinkingLevel,
      setTranslationGlossary: state.setTranslationGlossary,
    })),
  )

  const entries = useTranslationDictionaryStore(state => state.entries)
  const [isTesting, setIsTesting] = useState(false)

  const currentProviderConfig = {
    apiKey: aiProvider === 'google' ? geminiApiKey : deepseekApiKey,
    model: aiProvider === 'google' ? geminiModel : deepseekModel,
    baseUrl: aiProvider === 'google' ? geminiBaseUrl : deepseekBaseUrl,
    thinkingLevel: aiProvider === 'google' ? geminiThinkingLevel : deepseekThinkingLevel,
    providerName: aiProvider === 'google' ? 'Gemini' : 'DeepSeek',
  }

  const handleTestConnection = async () => {
    if (!currentProviderConfig.apiKey) {
      toastManager.add({
        title: 'API Key 为空',
        description: `请先输入 ${currentProviderConfig.providerName} API Key`,
        type: 'error',
      })
      return
    }

    setIsTesting(true)
    try {
      const { data } = await fetcher.post('/api/ai-test', {
        apiKey: currentProviderConfig.apiKey,
        model: currentProviderConfig.model,
        provider: aiProvider,
        baseUrl: currentProviderConfig.baseUrl,
        thinkingLevel: currentProviderConfig.thinkingLevel,
        tweetId: '1',
        enableAITranslation: true,
        translationGlossary: '1',
      })

      if (data.success) {
        toastManager.add({
          title: '连接成功',
          description: `${currentProviderConfig.providerName} API 连接正常`,
          type: 'success',
        })
      }
      else {
        // 失败响应带 status，会被 fetcher 拦截器 reject 到下方 catch，这里基本不会走到
        toastManager.add({
          title: '连接失败',
          description: `无法连接到 ${currentProviderConfig.providerName} API`,
          type: 'error',
        })
      }
    }
    catch (error: unknown) {
      toastAIError(error, {
        providerName: currentProviderConfig.providerName,
        fallbackTitle: `${currentProviderConfig.providerName} 连接失败`,
      })
    }
    setIsTesting(false)
  }

  const providerModels = models.filter(m => m.provider === aiProvider)
  const currentModelConfig = models.find(m => m.name === currentProviderConfig.model)

  const thinkingLevelOptions = useMemo(() => {
    const supported = currentModelConfig?.supportedLevels || ['minimal', 'low', 'medium', 'high']
    return supported.map((level) => {
      let label = ''
      switch (level) {
        case 'minimal':
          label = aiProvider === 'deepseek' ? '不开启 (None)' : '最低 (Minimal)'
          break
        case 'low':
          label = '较低 (Low)'
          break
        case 'medium':
          label = '中等 (Medium)'
          break
        case 'high':
          label = aiProvider === 'deepseek' ? '标准 (High)' : '高 (High)'
          break
        case 'max':
          label = aiProvider === 'deepseek' ? '深度 (Max)' : '最高 (Max)'
          break
      }
      return { label, value: level }
    })
  }, [currentModelConfig, aiProvider])

  const currentThinkingLevelOption = thinkingLevelOptions.find(
    opt => opt.value === (aiProvider === 'google' ? geminiThinkingLevel : deepseekThinkingLevel),
  )

  const providerOptions = [
    { label: 'Google Gemini', value: 'google' },
    { label: 'DeepSeek', value: 'deepseek' },
  ]
  const currentProviderOption = providerOptions.find(opt => opt.value === aiProvider)

  const modelOptions = providerModels.map(m => ({ label: m.text, value: m.name }))
  const currentModelOption = modelOptions.find(opt => opt.value === currentProviderConfig.model)
  const isCustomModel = !currentModelOption

  return (
    <div className="space-y-6 p-1">
      {/* Main Engine Selection */}
      <div className="space-y-2">
        <h4 className="px-1 text-sm font-medium text-muted-foreground">AI 翻译引擎</h4>
        <SettingsGroup>
          <SettingsRow
            label="启用 AI 翻译"
            description="自动识别语境并提供高质量的本地化翻译"
            id="enable-ai-translation"
          >
            <Switch
              checked={enableAITranslation}
              onCheckedChange={setEnableAITranslation}
            />
          </SettingsRow>

          {enableAITranslation && (
            <SettingsRow
              label="服务提供商"
              description="选择翻译任务的驱动引擎"
              id="ai-provider"
            >
              <div className="flex-1 flex justify-end">
                <Select
                  value={currentProviderOption}
                  onValueChange={opt => opt && setAIProvider(opt.value as any)}
                >
                  <SelectTrigger className="w-fit h-8 border-none transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {providerOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </SettingsRow>
          )}
        </SettingsGroup>
      </div>

      {enableAITranslation && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-400">
          <h4 className="px-1 text-sm font-medium text-muted-foreground capitalize">
            {aiProvider}
            {' '}
            详情配置
          </h4>
          <SettingsGroup>
            {/* API Key Input */}
            <SettingsRow
              label="API Key"
              description={(
                <a
                  href={aiProvider === 'google' ? 'https://aistudio.google.com/api-keys' : 'https://platform.deepseek.com/api_keys'}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-muted-foreground underline hover:text-primary transition-colors inline-flex items-center"
                >
                  获取
                  {' '}
                  {currentProviderConfig.providerName}
                  {' '}
                  凭据
                </a>
              )}
              id="ai-api-key"
            >
              <Input
                type="password"
                autoComplete="off"
                value={aiProvider === 'google' ? geminiApiKey : deepseekApiKey}
                onChange={e => aiProvider === 'google' ? setGeminiApiKey(e.target.value) : setDeepseekApiKey(e.target.value)}
                placeholder="输入密钥"
                className="text-right h-8 sm:min-w-64 bg-secondary/30 border-none focus-visible:ring-1 focus-visible:ring-primary/20"
              />
            </SettingsRow>

            {/* Base URL Input */}
            <SettingsRow
              label="Base URL"
              description="可选，留空使用官方默认地址"
              id="ai-base-url"
            >
              <Input
                type="url"
                autoComplete="off"
                value={aiProvider === 'google' ? geminiBaseUrl : deepseekBaseUrl}
                onChange={e => aiProvider === 'google' ? setGeminiBaseUrl(e.target.value) : setDeepseekBaseUrl(e.target.value)}
                placeholder={aiProvider === 'google' ? DEFAULT_GEMINI_BASE_URL : DEFAULT_DEEPSEEK_BASE_URL}
                className="text-right h-8 sm:min-w-64 bg-secondary/30 border-none focus-visible:ring-1 focus-visible:ring-primary/20"
              />
            </SettingsRow>

            {/* Model Selection */}
            <SettingsRow
              label="模型"
              id="ai-model"
            >
              <div className="flex-1 flex justify-end">
                <Select
                  value={isCustomModel ? CUSTOM_MODEL_OPTION : currentModelOption}
                  onValueChange={(opt) => {
                    if (!opt)
                      return
                    if (opt.value === CUSTOM_MODEL_VALUE) {
                      // 进入自定义模式：清空预设，显示手写模型名输入框
                      if (aiProvider === 'google')
                        setGeminiModel('')
                      else setDeepseekModel('')
                      return
                    }
                    const val = opt.value
                    if (aiProvider === 'google') {
                      setGeminiModel(val)
                      const nextModel = models.find(m => m.name === val)
                      if (nextModel?.thinkingType === 'level' && nextModel.supportedLevels) {
                        if (!nextModel.supportedLevels.includes(geminiThinkingLevel)) {
                          setGeminiThinkingLevel(nextModel.supportedLevels[0]!)
                        }
                      }
                    }
                    else {
                      setDeepseekModel(val)
                      const nextModel = models.find(m => m.name === val)
                      if (nextModel?.thinkingType === 'level' && nextModel.supportedLevels) {
                        if (!nextModel.supportedLevels.includes(deepseekThinkingLevel)) {
                          setDeepseekThinkingLevel(nextModel.supportedLevels[0]!)
                        }
                      }
                    }
                  }}
                >
                  <SelectTrigger className="w-fit h-8 border-none transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {modelOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt}>
                        {opt.label}
                      </SelectItem>
                    ))}
                    <SelectSeparator />
                    <SelectItem value={CUSTOM_MODEL_OPTION}>
                      {CUSTOM_MODEL_OPTION.label}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </SettingsRow>

            {/* Custom Model Name Input */}
            {isCustomModel && (
              <SettingsRow
                label="自定义模型名称"
                description="输入完整的模型 ID，例如 models/gemini-3-pro-preview"
                id="ai-custom-model"
              >
                <Input
                  autoComplete="off"
                  value={currentProviderConfig.model}
                  onChange={e => aiProvider === 'google' ? setGeminiModel(e.target.value) : setDeepseekModel(e.target.value)}
                  placeholder="输入模型 ID"
                  className="text-right h-8 sm:min-w-64 bg-secondary/30 border-none focus-visible:ring-1 focus-visible:ring-primary/20"
                />
              </SettingsRow>
            )}

            {/* Thinking Level */}
            {currentModelConfig?.thinkingType !== 'none' && (
              <SettingsRow
                label="思考强度"
                description={aiProvider === 'deepseek' ? 'DeepSeek 思考模式下的推理强度' : '控制翻译时的思考预算或深度'}
              >
                <div className="flex-1 flex justify-end">
                  <Select
                    value={currentThinkingLevelOption}
                    onValueChange={(opt) => {
                      if (!opt)
                        return
                      const val = opt.value as ThinkingLevel
                      if (aiProvider === 'google')
                        setGeminiThinkingLevel(val)
                      else setDeepseekThinkingLevel(val)
                    }}
                  >
                    <SelectTrigger className="w-fit h-8 border-none transition-colors">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {thinkingLevelOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </SettingsRow>
            )}

            <SettingsRow
              label="测试连接"
              description="验证 API 配置的有效性"
            >
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="h-8 transition-all active:scale-95 border-none"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="mr-2 size-3 animate-spin" />
                    验证中
                  </>
                ) : (
                  '立即测试'
                )}
              </Button>
            </SettingsRow>
          </SettingsGroup>
          <p className="px-4 text-[10px] text-muted-foreground/50 leading-tight">
            隐私提示：API Key 仅本地加密存储，仅在发起翻译请求时经由应用服务器安全透传。
          </p>
        </div>
      )}

      {enableAITranslation && (
        <div className="space-y-2">
          <h4 className="px-1 text-sm font-medium text-muted-foreground">翻译辅助</h4>
          <SettingsGroup>
            <SettingsRow
              label="提示词与术语表"
              description="引导 AI 遵循特定的翻译风格或术语对应关系"
              id="translation-glossary"
              className="border-b-0"
            />
            <div>
              <Textarea
                value={translationGlossary}
                onChange={e => setTranslationGlossary(e.target.value)}
                placeholder="例如：\nひなぴよ -> Hinapiyo"
                className="min-h-32 leading-relaxed bg-secondary/20 border-none focus-visible:ring-1 focus-visible:ring-primary/20 resize-none rounded-lg text-sm"
              />
              {entries.length > 0 && (
                <p className="mt-2 text-[10px] text-muted-foreground/40 font-medium">
                  • 已联动词典中的
                  {' '}
                  {entries.length}
                  {' '}
                  个本地词条
                </p>
              )}
            </div>
          </SettingsGroup>
        </div>
      )}
    </div>
  )
}
