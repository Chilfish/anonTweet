import type { EnrichedTweet, Entity } from '~/lib/react-tweet'
import { BookA, Languages, LanguagesIcon, Save, Trash2 } from 'lucide-react'
import React, { useCallback, useMemo, useState } from 'react'
import { SettingsGroup, SettingsRow } from '~/components/settings/SettingsUI'
import { DictionaryViewer } from '~/components/translation/DictionaryViewer'
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
import { TweetBody } from '~/lib/react-tweet'
import { useTranslationStore } from '~/lib/stores/translation'
import { useTranslationDictionaryStore } from '~/lib/stores/TranslationDictionary'
import { decodeHtmlEntities } from '~/lib/utils'

interface TranslationEditorProps {
  originalTweet: EnrichedTweet
  className?: string
}

// 辅助函数：判断是否跳过某些实体的翻译
function shouldSkipEntity(entity: Entity) {
  return (
    entity.text === ' '
    || entity.type === 'url'
    || entity.type === 'mention'
    || entity.type === 'media'
    // || (entity.text?.trim() === '' && entity.text !== '')
  )
}

// 辅助函数：获取显示文本
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

  const {
    showTranslationButton,
    getTranslation,
    setTranslation,
    deleteTranslation,
    hasTextContent,
  } = useTranslationStore()

  const dictionaryEntries = useTranslationDictionaryStore(state => state.entries)

  const isVisible = useMemo(() => {
    return hasTextContent(originalTweet.text) && showTranslationButton
  }, [originalTweet.text, showTranslationButton, hasTextContent])

  const handleOpen = useCallback(() => {
    const existing = getTranslation(tweetId)
    let baseEntities: Entity[] = []

    if (existing && existing.length > 0) {
      baseEntities = JSON.parse(JSON.stringify(existing))
    }
    else {
      baseEntities = (originalTweet.entities || []).map((e, i) => {
        const entity = { ...e, index: i }
        if (entity.type === 'hashtag') {
          const match = dictionaryEntries.find(d => d.original === entity.text.replace('#', ''))
          if (match) {
            entity.translation = `#${match.translated}`
          }
        }
        return entity
      })
    }

    const prependIndex = baseEntities.findIndex(e => e.index === -1)

    if (prependIndex !== -1) {
      const prependEntity = baseEntities[prependIndex]!
      setEnablePrepend(true)
      setPrependText(prependEntity.text || prependEntity.translation || '')

      baseEntities.splice(prependIndex, 1)
    }
    else {
      setEnablePrepend(false)
      setPrependText('')
    }

    setEditingEntities(baseEntities)
    setIsOpen(true)
  }, [tweetId, getTranslation, originalTweet.entities, dictionaryEntries])

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const finalTranslations: Entity[] = editingEntities.map((entity) => {
      const inputName = `entity-${entity.index}`
      const inputValue = formData.get(inputName) as string

      return {
        ...entity,
        translation: inputValue !== null ? inputValue : entity.translation,
      }
    })

    if (enablePrepend) {
      const currentPrependText = formData.get('prepend-text') as string

      if (currentPrependText?.trim()) {
        const prependEntity: Entity = {
          type: 'text',
          text: currentPrependText,
          indices: [-1, 0],
          index: -1,
          translation: currentPrependText,
        }

        finalTranslations.unshift(prependEntity)
      }
    }

    setTranslation(tweetId, finalTranslations)
    setIsOpen(false)
  }

  const handleDelete = () => {
    deleteTranslation(tweetId)
    setIsOpen(false)
  }

  if (!isVisible)
    return null

  return (
    <Dialog
      open={isOpen}
      onOpenChange={setIsOpen}
      dismissible={false}
    >
      <DialogTrigger render={(
        <Button
          variant="secondary"
          size="icon"
          onClick={handleOpen}
          className={`${className} ml-auto`}
          data-testid="translation-editor-button"
        />
      )}
      >
        <LanguagesIcon className="size-4" />
      </DialogTrigger>

      <DialogContent render={<form onSubmit={handleSave} />} className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Languages className="size-5" />
            翻译推文
          </DialogTitle>
        </DialogHeader>

        <DialogPanel className="space-y-6">
          {/* 原文预览 */}
          <div className="space-y-2">
            <Label className="px-1 text-xs font-medium text-muted-foreground">原文</Label>
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
                    也许你需要调整翻译语序或补充上下文
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

          {/* 翻译内容编辑器 */}
          <div className="space-y-2">
            <Label className="px-1 text-xs font-medium text-muted-foreground">译文编辑</Label>
            <SettingsGroup>
              {editingEntities.map((entity) => {
                if (shouldSkipEntity(entity))
                  return null

                const inputId = `entity-${entity.index}`
                const isText = entity.type === 'text'
                const displayValue = getEntityDisplayValue(entity)

                return (
                  <div key={inputId} className="flex flex-col border-b last:border-0 bg-card">
                    <div className="flex items-center justify-between px-4 py-2 bg-muted/20 border-b border-border/40">
                      <Label htmlFor={inputId} className="text-[10px] uppercase font-mono text-muted-foreground">
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
          <Popover>
            <PopoverTrigger render={(
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
                title="查看词汇表"
              />
            )}
            >
              <BookA className="size-4 mr-2" />
              词汇表
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start" side="top">
              <DictionaryViewer />
            </PopoverContent>
          </Popover>

          <div className="flex items-center gap-2">
            {getTranslation(tweetId) && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDelete}
              >
                <Trash2 className="size-4 mr-2" />
                删除
              </Button>
            )}

            <Button type="submit" size="sm">
              <Save className="size-4 mr-2" />
              保存
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
