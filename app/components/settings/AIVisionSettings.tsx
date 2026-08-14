import type { AIProvider, ThinkingLevel } from '~/lib/stores/appConfig'
import { useShallow } from 'zustand/react/shallow'
import { SettingsGroup, SettingsRow } from '~/components/settings/SettingsUI'
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
import { resolveVisionConfig } from '~/lib/ai-provider-config'
import { DEFAULT_GEMINI_BASE_URL, DEFAULT_OPENROUTER_BASE_URL, models } from '~/lib/constants'
import { useAppConfigStore } from '~/lib/stores/appConfig'

/** 模型下拉中的「自定义」哨兵项，用于切换到手写模型名的输入模式 */
const CUSTOM_MODEL_VALUE = '__custom__'

/** 「自定义」哨兵对象值（与 AITranslationSettings 一致，Select 用对象作为 value） */
const CUSTOM_MODEL_OPTION = { label: '自定义模型…', value: CUSTOM_MODEL_VALUE }

/**
 * 视觉 provider 只列支持图片输入的（DR-8）：Google Gemini / OpenRouter，
 * 不列 DeepSeek（纯文本）。已有 Gemini Key 的用户可「识图+翻译」共用一个 Key。
 */
const VISION_PROVIDER_OPTIONS: Array<{ label: string, value: AIProvider }> = [
  { label: 'Google Gemini', value: 'google' },
  { label: 'OpenRouter', value: 'openrouter' },
]

const THINKING_LABELS: Record<ThinkingLevel, string> = {
  minimal: '最低 (Minimal)',
  low: '较低 (Low)',
  medium: '中等 (Medium)',
  high: '高 (High)',
  max: '最高 (Max)',
}

export function AIVisionSettings() {
  const {
    enableAIVision,
    visionProvider,
    geminiApiKey,
    geminiModel,
    geminiBaseUrl,
    geminiThinkingLevel,
    openrouterApiKey,
    openrouterModel,
    openrouterBaseUrl,
    openrouterThinkingLevel,
    setEnableAIVision,
    setVisionProvider,
    setGeminiApiKey,
    setGeminiModel,
    setGeminiBaseUrl,
    setGeminiThinkingLevel,
    setOpenrouterApiKey,
    setOpenrouterModel,
    setOpenrouterBaseUrl,
    setOpenrouterThinkingLevel,
  } = useAppConfigStore(
    useShallow(state => ({
      enableAIVision: state.enableAIVision,
      visionProvider: state.visionProvider,
      geminiApiKey: state.geminiApiKey,
      geminiModel: state.geminiModel,
      geminiBaseUrl: state.geminiBaseUrl,
      geminiThinkingLevel: state.geminiThinkingLevel,
      openrouterApiKey: state.openrouterApiKey,
      openrouterModel: state.openrouterModel,
      openrouterBaseUrl: state.openrouterBaseUrl,
      openrouterThinkingLevel: state.openrouterThinkingLevel,
      setEnableAIVision: state.setEnableAIVision,
      setVisionProvider: state.setVisionProvider,
      setGeminiApiKey: state.setGeminiApiKey,
      setGeminiModel: state.setGeminiModel,
      setGeminiBaseUrl: state.setGeminiBaseUrl,
      setGeminiThinkingLevel: state.setGeminiThinkingLevel,
      setOpenrouterApiKey: state.setOpenrouterApiKey,
      setOpenrouterModel: state.setOpenrouterModel,
      setOpenrouterBaseUrl: state.setOpenrouterBaseUrl,
      setOpenrouterThinkingLevel: state.setOpenrouterThinkingLevel,
    })),
  )

  // resolveVisionConfig 会拒绝 deepseek（不支持图片输入），失败即抛错，保证下方 setter 必命中
  const currentConfig = resolveVisionConfig({
    visionProvider,
    geminiApiKey,
    geminiModel,
    geminiBaseUrl,
    geminiThinkingLevel,
    deepseekApiKey: '',
    deepseekModel: '',
    deepseekBaseUrl: '',
    deepseekThinkingLevel: 'minimal',
    openrouterApiKey,
    openrouterModel,
    openrouterBaseUrl,
    openrouterThinkingLevel,
  })

  /** 写侧：按 provider 索引 setter（deepseek 不可达，索引前已抛错） */
  const settersByProvider: Partial<Record<AIProvider, {
    setApiKey: (v: string) => void
    setModel: (v: string) => void
    setBaseUrl: (v: string) => void
    setThinkingLevel: (v: ThinkingLevel) => void
  }>> = {
    google: {
      setApiKey: setGeminiApiKey,
      setModel: setGeminiModel,
      setBaseUrl: setGeminiBaseUrl,
      setThinkingLevel: setGeminiThinkingLevel,
    },
    openrouter: {
      setApiKey: setOpenrouterApiKey,
      setModel: setOpenrouterModel,
      setBaseUrl: setOpenrouterBaseUrl,
      setThinkingLevel: setOpenrouterThinkingLevel,
    },
  }
  const setters = settersByProvider[visionProvider]!

  const providerModels = models.filter(m => m.provider === visionProvider)
  const currentModelConfig = models.find(m => m.name === currentConfig.model)

  const thinkingLevelOptions = (currentModelConfig?.supportedLevels || ['minimal', 'low', 'medium', 'high'])
    .map(level => ({ label: THINKING_LABELS[level], value: level }))

  const modelOptions = providerModels.map(m => ({ label: m.text, value: m.name }))
  const currentProviderOption = VISION_PROVIDER_OPTIONS.find(opt => opt.value === visionProvider)
  const currentModelOption = modelOptions.find(opt => opt.value === currentConfig.model)
  const currentThinkingLevelOption = thinkingLevelOptions.find(opt => opt.value === currentConfig.thinkingLevel)
  const isCustomModel = !currentModelOption

  const handleSelectModel = (val: string) => {
    setters.setModel(val)
    const nextModel = models.find(m => m.name === val)
    if (nextModel?.thinkingType === 'level' && nextModel.supportedLevels) {
      if (!nextModel.supportedLevels.includes(currentConfig.thinkingLevel)) {
        setters.setThinkingLevel(nextModel.supportedLevels[0]!)
      }
    }
  }

  return (
    <div className="space-y-6 p-1">
      <div className="space-y-2">
        <h4 className="px-1 text-sm font-medium text-muted-foreground">图片描述</h4>
        <SettingsGroup>
          <SettingsRow
            label="启用图片描述"
            description="为推文配图生成 AI 描述或 OCR 文字"
            id="enable-ai-vision"
          >
            <Switch
              checked={enableAIVision}
              onCheckedChange={setEnableAIVision}
            />
          </SettingsRow>

          {enableAIVision && (
            <SettingsRow
              label="视觉服务"
              description="支持图片输入的模型，可共用翻译侧的 Key"
              id="vision-provider"
            >
              <div className="flex-1 flex justify-end">
                <Select
                  value={currentProviderOption}
                  onValueChange={opt => opt && setVisionProvider(opt.value as AIProvider)}
                >
                  <SelectTrigger className="w-fit h-8 border-none transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VISION_PROVIDER_OPTIONS.map(opt => (
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

      {enableAIVision && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-400">
          <h4 className="px-1 text-sm font-medium text-muted-foreground">
            {currentConfig.providerName}
            {' '}
            配置
          </h4>
          <SettingsGroup>
            <SettingsRow
              label="API Key"
              description={(
                <a
                  href={
                    visionProvider === 'google'
                      ? 'https://aistudio.google.com/api-keys'
                      : 'https://openrouter.ai/settings/keys'
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-muted-foreground underline hover:text-primary transition-colors inline-flex items-center"
                >
                  获取
                  {' '}
                  {currentConfig.providerName}
                  {' '}
                  凭据
                </a>
              )}
              id="vision-api-key"
            >
              <Input
                type="password"
                autoComplete="off"
                value={currentConfig.apiKey}
                onChange={e => setters.setApiKey(e.target.value)}
                placeholder="输入密钥"
                className="text-right h-8 sm:min-w-64 bg-secondary/30 border-none focus-visible:ring-1 focus-visible:ring-primary/20"
              />
            </SettingsRow>

            <SettingsRow
              label="Base URL"
              description="可选，留空使用官方默认地址"
              id="vision-base-url"
            >
              <Input
                type="url"
                autoComplete="off"
                value={currentConfig.baseUrl}
                onChange={e => setters.setBaseUrl(e.target.value)}
                placeholder={
                  visionProvider === 'google'
                    ? DEFAULT_GEMINI_BASE_URL
                    : DEFAULT_OPENROUTER_BASE_URL
                }
                className="text-right h-8 sm:min-w-64 bg-secondary/30 border-none focus-visible:ring-1 focus-visible:ring-primary/20"
              />
            </SettingsRow>

            <SettingsRow
              label="模型"
              id="vision-model"
            >
              <div className="flex-1 flex justify-end">
                <Select
                  value={isCustomModel ? CUSTOM_MODEL_OPTION : currentModelOption}
                  onValueChange={(opt) => {
                    if (!opt)
                      return
                    if (opt.value === CUSTOM_MODEL_VALUE) {
                      setters.setModel('')
                      return
                    }
                    handleSelectModel(opt.value)
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

            {isCustomModel && (
              <SettingsRow
                label="自定义模型名称"
                description="输入完整的模型 ID，例如 xiaomi/mimo-v2.5"
                id="vision-custom-model"
              >
                <Input
                  autoComplete="off"
                  value={currentConfig.model}
                  onChange={e => setters.setModel(e.target.value)}
                  placeholder="输入模型 ID"
                  className="text-right h-8 sm:min-w-64 bg-secondary/30 border-none focus-visible:ring-1 focus-visible:ring-primary/20"
                />
              </SettingsRow>
            )}

            {currentModelConfig?.thinkingType !== 'none' && (
              <SettingsRow
                label="思考强度"
                description="感知任务默认最低即可"
              >
                <div className="flex-1 flex justify-end">
                  <Select
                    value={currentThinkingLevelOption}
                    onValueChange={opt => opt && setters.setThinkingLevel(opt.value as ThinkingLevel)}
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
          </SettingsGroup>
          <p className="px-4 text-[11px] text-muted-foreground/60 leading-tight">
            共用翻译侧的 API Key，识图与翻译无需分别配置。
          </p>
        </div>
      )}
    </div>
  )
}
