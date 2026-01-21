import type { EnrichedTweet, Entity } from '~/types'
import { BookA, Languages, LanguagesIcon, Save, Trash2Icon } from 'lucide-react'
import React, { useCallback, useMemo, useState } from 'react'
import { SettingsGroup, SettingsRow } from '~/components/settings/SettingsUI'
import { DictionaryViewer } from '~/components/translation/DictionaryViewer'
import { ToggleTransButton } from '~/components/translation/ToggleTransButton'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { Switch } from '~/components/ui/switch'
import { Textarea } from '~/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import { TweetBody } from '~/lib/react-tweet'
import { useShowTranslationButton, useTranslationActions } from '~/lib/stores/hooks'
import { useTranslationDictionaryStore } from '~/lib/stores/TranslationDictionary'
import { decodeHtmlEntities } from '~/lib/utils'

interface TranslationEditorProps {
  originalTweet: EnrichedTweet
  className?: string
}

// 辅助函数：判断是否跳过某些实体的翻译编辑（通常只编辑文本，URL/Mention 保持原样）
function shouldSkipEntity(entity: Entity, originalTweet?: EnrichedTweet) {
  if (entity.type === 'mention' || entity.type === 'media' || entity.type === 'url' || entity.type === 'separator' || entity.type === 'media_alt') {
    return true
  }

  if (entity.type === 'text') {
    // 优先基于原文判断：如果原文只是空白，则跳过
    // 这样避免“用户清空翻译后保存，导致该实体被跳过”的问题
    if (originalTweet?.entities?.[entity.index]) {
      const originalText = originalTweet.entities[entity.index]?.text
      return !originalText?.trim()
    }

    return (entity.text || entity.translation || '').trim() === ''
  }

  return false
}

// 辅助函数：获取显示文本（优先取 translation，没有则取 text）
function getEntityDisplayValue(entity: Entity) {
  return decodeHtmlEntities(entity.translation || entity.text)
}

export const TranslationEditor: React.FC<TranslationEditorProps> = ({
  originalTweet,
  className,
}) => {
  const tweetId = originalTweet.id_str
  const [isOpen, setIsOpen] = useState(false)

  const [editingEntities, setEditingEntities] = useState<Entity[]>([])
  const [enablePrepend, setEnablePrepend] = useState(false)
  const [prependText, setPrependText] = useState('')

  const showTranslationButton = useShowTranslationButton()
  const {
    getTranslation,
    setTranslation,
    setTranslationVisibility,
    resetTranslation,
    hasTextContent,
    deleteTranslation,
  } = useTranslationActions()

  const isVisible = useMemo(() => {
    return hasTextContent(originalTweet.text) && showTranslationButton
  }, [originalTweet.text, showTranslationButton, hasTextContent])

  const handleOpen = useCallback(() => {
    const dictionaryEntries = useTranslationDictionaryStore.getState().entries
    const existing = getTranslation(tweetId)
    const tweetWithAuto = originalTweet as EnrichedTweet

    // 1. 始终以原始实体作为结构基础，确保原文 (.text) 字段存在
    let baseEntities: Entity[] = JSON.parse(JSON.stringify(originalTweet.entities || []))

    if (existing && existing.length > 0) {
      // 情况 A: 命中本地保存的“人工精修”翻译
      // 我们将保存的 translation 合并到原始实体中
      baseEntities = baseEntities.map((original) => {
        const found = existing.find(e => e.index === original.index)
        return found ? { ...original, translation: found.translation } : original
      })

      // 恢复特殊的句首补充 (index -1)
      const prepend = existing.find(e => e.index === -1)
      if (prepend)
        baseEntities.push(JSON.parse(JSON.stringify(prepend)))
    }
    else if (tweetWithAuto.autoTranslationEntities && tweetWithAuto.autoTranslationEntities.length > 0) {
      // 情况 B: 命中服务端 AI 翻译
      // AI 结果可能缺失 text (原文)，或者 text 存放的是译文。我们只取其译文部分。
      baseEntities = baseEntities.map((original) => {
        const found = tweetWithAuto.autoTranslationEntities?.find(e => e.index === original.index)
        const translation = found?.translation || found?.text
        return found ? { ...original, translation } : original
      })
    }

    // 2. 统一应用本地字典增强（针对 Hashtag 等）
    baseEntities = baseEntities.map((entity) => {
      if (entity.type === 'hashtag') {
        const match = dictionaryEntries.find(d => d.original === entity.text.replace('#', ''))
        if (match && !entity.translation) {
          entity.translation = `#${match.translated}`
        }
      }
      return entity
    })

    // 处理句首补充逻辑 (index 为 -1 的特殊实体)
    const prependIndex = baseEntities.findIndex(e => e.index === -1)
    if (prependIndex !== -1) {
      const prependEntity = baseEntities[prependIndex]!
      setEnablePrepend(true)
      setPrependText(prependEntity.text || prependEntity.translation || '')
      baseEntities.splice(prependIndex, 1) // 从编辑列表中移除，单独用 Textarea 管理
    }
    else {
      setEnablePrepend(false)
      setPrependText('')
    }

    setEditingEntities(baseEntities)
    setIsOpen(true)
  }, [tweetId, getTranslation, originalTweet])

  const handleSave = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const finalTranslations: Entity[] = editingEntities.map((entity) => {
      const inputName = `entity-${entity.index}`
      const inputValue = formData.get(inputName) as string

      // 将表单输入的译文存入 translation 字段，保持原文 .text 不变
      return {
        ...entity,
        translation: inputValue !== null ? (inputValue as string) : entity.translation,
      }
    })

    if (enablePrepend) {
      const currentPrependText = formData.get('prepend-text') as string
      if (currentPrependText?.trim()) {
        const prependEntity: Entity = {
          type: 'text',
          text: currentPrependText,
          index: -1,
          translation: currentPrependText,
        }
        finalTranslations.unshift(prependEntity)
      }
    }

    setTranslation(tweetId, finalTranslations)
    setTranslationVisibility(tweetId, { body: true })
    setIsOpen(false)
  }, [editingEntities, enablePrepend, setTranslation, tweetId, setTranslationVisibility])

  const handleDelete = useCallback(() => {
    deleteTranslation(tweetId)
    setIsOpen(false)
  }, [deleteTranslation, tweetId])

  const handleReset = useCallback(() => {
    resetTranslation(tweetId)
    setIsOpen(false)
  }, [resetTranslation, tweetId])

  if (!isVisible)
    return null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen} dismissible={false}>
      <DialogTrigger render={(
        <Button
          variant="secondary"
          size="icon-sm"
          onClick={handleOpen}
          className={`${className} ml-auto bg-transparent`}
          data-testid="translation-editor-button"
        />
      )}
      >
        <LanguagesIcon className="size-3.5 text-muted-foreground" />
      </DialogTrigger>

      {isOpen && (
        <DialogContent render={<form onSubmit={handleSave} />} className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Languages className="size-5" />
              翻译推文
            </DialogTitle>
          </DialogHeader>

          <DialogPanel className="space-y-6">
            {/* 原文预览：始终显示最原始的推文，供对照 */}
            <div className="space-y-2">
              <Label className="px-1 text-xs font-medium text-muted-foreground">原文对照</Label>
              <SettingsGroup className="bg-muted/30 border-dashed">
                <div className="p-4">
                  <TweetBody tweet={originalTweet} isTranslated={false} />
                </div>
              </SettingsGroup>
            </div>

            {/* 句首补充 */}
            <div className="space-y-2">
              <Label className="px-1 text-xs font-medium text-muted-foreground">句首补充</Label>
              <SettingsGroup>
                <SettingsRow>
                  <div className="flex flex-col gap-0.5">
                    <Label htmlFor="enable-prepend" className="text-sm font-medium">
                      启用句首补充
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      用于调整语序或补充上下文
                    </span>
                  </div>
                  <Switch
                    id="enable-prepend"
                    checked={enablePrepend}
                    onCheckedChange={setEnablePrepend}
                  />
                </SettingsRow>
                {enablePrepend && (
                  <div className="border-t bg-card animate-in fade-in slide-in-from-top-1 duration-200">
                    <Textarea
                      id="prepend-text"
                      name="prepend-text"
                      defaultValue={prependText}
                      placeholder="输入句首补充内容..."
                      className="min-h-12 border-none shadow-none rounded-none bg-transparent resize-none text-sm"
                    />
                  </div>
                )}
              </SettingsGroup>
            </div>

            {/* 译文编辑 */}
            <div className="space-y-2">
              <Label className="px-1 text-xs font-medium text-muted-foreground">
                {/* 动态提示当前编辑的基础内容来源 */}
                {(originalTweet as EnrichedTweet).autoTranslationEntities?.length && !getTranslation(tweetId)
                  ? '编辑 AI 翻译结果'
                  : '译文编辑'}
              </Label>
              <SettingsGroup>
                {editingEntities.map((entity) => {
                  if (shouldSkipEntity(entity, originalTweet))
                    return null

                  const inputId = `entity-${entity.index}`
                  const isText = entity.type === 'text'
                  // 这里很关键：如果是 AI 结果，entity.text 已经是中文，所以 defaultValue 会直接显示中文
                  const displayValue = getEntityDisplayValue(entity)

                  return (
                    <div key={inputId} className="flex flex-col border-b last:border-0 bg-card">
                      <div className="flex items-center justify-between px-4 py-2 bg-muted/20 border-b border-border/40">
                        <Label htmlFor={inputId} className="text-[10px] uppercase font-mono text-muted-foreground flex items-center gap-2">
                          {entity.type}
                        </Label>
                      </div>
                      {isText ? (
                        <Textarea
                          id={inputId}
                          name={inputId}
                          defaultValue={displayValue}
                          className="min-h-8 border-none shadow-none rounded-none bg-transparent resize-none text-sm leading-relaxed"
                        />
                      ) : (
                        <div className="p-2">
                          <Input
                            id={inputId}
                            name={inputId}
                            defaultValue={displayValue}
                            className="border-none shadow-none focus-visible:ring-0 bg-muted/30 h-9"
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </SettingsGroup>
            </div>
          </DialogPanel>

          <DialogFooter className="flex-row items-center justify-between gap-2 sm:justify-between">
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger render={(
                  <Button
                    variant="ghost"
                    className="text-muted-foreground hover:text-foreground"
                    title="查看词汇表"
                  />
                )}
                >
                  <BookA className="size-4" />
                  词汇表
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start" side="top">
                  <DictionaryViewer />
                </PopoverContent>
              </Popover>

              <ToggleTransButton
                tweetId={tweetId}
                variant="ghost"
                className="text-muted-foreground hover:text-foreground px-2"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* {getTranslation(tweetId) !== null && (
              <Tooltip>
                <TooltipTrigger render={(
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                  />
                )}
                >
                  <RotateCcw className="size-4" />
                  重置
                </TooltipTrigger>
                <TooltipContent>
                  重置为默认状态（移除人工翻译或取消隐藏）
                </TooltipContent>
              </Tooltip>
            )} */}

              {getTranslation(tweetId) !== null && (
                <Tooltip>
                  <TooltipTrigger render={(
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleDelete}
                    />
                  )}
                  >
                    <Trash2Icon className="size-4" />
                    删除
                  </TooltipTrigger>
                  <TooltipContent>
                    删除此推文的翻译
                  </TooltipContent>
                </Tooltip>
              )}

              <Button type="submit" size="sm">
                <Save className="size-4" />
                保存
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  )
}

TranslationEditor.displayName = 'TranslationEditor'
