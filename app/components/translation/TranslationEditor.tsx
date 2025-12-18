import type { EnrichedTweet, Entity } from '~/lib/react-tweet'
import { BookA, Languages, LanguagesIcon, Save, Trash2 } from 'lucide-react'
import React, { useCallback, useMemo, useState } from 'react'
import { DictionaryViewer } from '~/components/translation/DictionaryViewer'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
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

      <DialogContent render={<form onSubmit={handleSave} />}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            翻译推文
          </DialogTitle>
        </DialogHeader>

        <DialogPanel className="space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <Label className="font-bold">原文</Label>
            </div>
            <Card className="mt-2 py-2 bg-muted/30">
              <CardContent className="px-3">
                <TweetBody tweet={originalTweet} isTranslated={false} />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="enable-prepend"
                checked={enablePrepend}
                onCheckedChange={setEnablePrepend}
              />
              <Label htmlFor="enable-prepend" className="font-medium cursor-pointer">
                启用句首翻译补充
              </Label>
            </div>

            {enablePrepend && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <Label htmlFor="prepend-text" className="text-xs font-mono text-muted-foreground">
                  也许你需要 调整语序 / 补充上下文
                </Label>
                <Textarea
                  id="prepend-text"
                  name="prepend-text"
                  defaultValue={prependText}
                  placeholder="输入句首补充内容..."
                  className="text-sm"
                />
              </div>
            )}
          </div>

          <div>
            <Label className="font-bold">翻译内容</Label>
            <div className="mt-3 space-y-4">
              {editingEntities.map((entity) => {
                if (shouldSkipEntity(entity))
                  return null

                const inputId = `entity-${entity.index}`
                const isText = entity.type === 'text'
                const displayValue = getEntityDisplayValue(entity)

                return (
                  <div key={inputId} className="space-y-1.5">
                    <Label htmlFor={inputId} className="text-xs uppercase font-mono text-muted-foreground">
                      {entity.type}
                    </Label>
                    {isText ? (
                      <Textarea
                        id={inputId}
                        name={inputId}
                        defaultValue={displayValue}
                        className="text-sm"
                      />
                    ) : (
                      <Input
                        id={inputId}
                        name={inputId}
                        defaultValue={displayValue}
                        className="text-sm"
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </DialogPanel>

        <DialogFooter
          className="flex-row items-center justify-between gap-2"
        >
          <Popover>
            <PopoverTrigger render={(
              <Button
                variant="secondary"
                className="mr-auto hover:bg-muted"
                title="查看词汇表"
              />
            )}
            >
              <BookA className="size-4" />
              查看词汇表
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="center" side="top">
              <DictionaryViewer />
            </PopoverContent>
          </Popover>

          {getTranslation(tweetId) ? (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
              删除
            </Button>
          ) : <div />}

          <Button type="submit">
            <Save className="h-4 w-4" />
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
