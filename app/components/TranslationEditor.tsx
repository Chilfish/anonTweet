import type { EnrichedQuotedTweet, EnrichedTweet, Entity } from '~/lib/react-tweet/utils'
import { Languages, LanguagesIcon, Save, Trash2, X } from 'lucide-react'
import React, { useState } from 'react'
import { useTranslationStore } from '~/lib/stores/translation'
import { TweetText } from './tweet/TweetText'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Switch } from './ui/switch'
import { Textarea } from './ui/textarea'

type EntityTranslation = Entity & {
  index: number
}

// 翻译编辑器组件
interface TranslationEditorProps {
  tweetId: string
  originalTweet: EnrichedTweet | EnrichedQuotedTweet
  className?: string
}

export const TranslationEditor: React.FC<TranslationEditorProps> = ({
  tweetId,
  originalTweet,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [entityTranslations, setEntityTranslations] = useState<EntityTranslation[]>([])
  const [enablePrepend, setEnablePrepend] = useState(false)
  const [prependEntity, setPrependEntity] = useState<EntityTranslation>({
    type: 'text',
    text: '',
    indices: [-1, 0],
    index: -1,
  })

  const { showTranslationButton, getTranslation, setTranslation } = useTranslationStore()
  const hasTextContent = useTranslationStore(state => state.hasTextContent)
  const existingTranslation = getTranslation(tweetId)

  // 获取所有实体（包括文本实体）
  const getAllEntities = () => {
    if (Array.isArray(originalTweet.entities)) {
      return originalTweet.entities
    }
    return []
  }

  // 检查是否应该显示翻译编辑器
  const shouldShowEditor = () => {
    if (!hasTextContent(originalTweet.text) || !showTranslationButton) {
      return false
    }
    return true
  }

  // 如果不应该显示编辑器，返回null
  if (!shouldShowEditor()) {
    return null
  }

  const handleOpen = () => {
    // 初始化所有实体的翻译状态
    let allEntities = existingTranslation
    if (!allEntities) {
      allEntities = getAllEntities()
    }

    setEntityTranslations(allEntities.map((entity, index) => ({
      ...entity,
      index,
    })))

    // 检查是否已有句首补充翻译
    const hasPrependEntity = allEntities.some(entity => entity.indices?.[0] === -1)
    setEnablePrepend(hasPrependEntity)

    setIsOpen(true)
  }

  const handleSave = () => {
    // 保存所有实体的翻译，包括句首补充（如果启用）
    const finalTranslations = [...entityTranslations]

    if (enablePrepend && prependEntity.text.trim()) {
      if (entityTranslations[0].indices?.[0] !== -1) {
        finalTranslations.unshift(prependEntity)
      }
      else {
        finalTranslations[0] = prependEntity
      }
    }

    setTranslation(tweetId, finalTranslations)
    setIsOpen(false)
  }

  const handleDelete = () => {
    const deleteTranslation = useTranslationStore.getState().deleteTranslation
    deleteTranslation(tweetId)
    setIsOpen(false)
  }

  const handleEntityTranslationChange = (index: number, translatedText: string) => {
    const updated = [...entityTranslations]
    const entityIndex = updated.findIndex(et => et.index === index)
    if (entityIndex !== -1) {
      updated[entityIndex].text = translatedText
      setEntityTranslations(updated)
    }
  }

  const skipTranslation = (entityTranslation: EntityTranslation) => {
    return (entityTranslation.type === 'text' && entityTranslation.text.trim() === '')
      || (entityTranslation.type === 'url')
      || (entityTranslation.type === 'mention')
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          onClick={handleOpen}
          className={`${className} ml-auto`}
          data-testid="translation-editor-button"
        >
          <LanguagesIcon className="size-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[92vh] max-w-[95vw] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            翻译推文
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 原文显示 */}
          <div>
            <Label className="font-medium">原文</Label>
            <Card className="mt-2 py-3">
              <CardContent>
                <TweetText text={originalTweet.text} />
              </CardContent>
            </Card>
          </div>

          {/* 句首翻译补充开关 */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="enable-prepend"
                checked={enablePrepend}
                onCheckedChange={setEnablePrepend}
              />
              <Label htmlFor="enable-prepend" className="font-medium">
                启用句首翻译补充
              </Label>
            </div>

            {enablePrepend && (
              <div className="space-y-2">
                <Label htmlFor="prepend-text" className="text-xs uppercase font-mono">
                  句首补充内容
                </Label>
                <Textarea
                  id="prepend-text"
                  value={prependEntity.text}
                  onChange={e => setPrependEntity(prev => ({ ...prev, text: e.target.value }))}
                  placeholder="输入要在句首添加的翻译内容..."
                  className="text-sm"
                />
              </div>
            )}
          </div>

          {/* 按实体遍历的翻译输入 */}
          <div>
            <Label className="font-bold">翻译内容</Label>
            <div className="mt-2 space-y-3">
              {entityTranslations
                .filter(entityTranslation => !skipTranslation(entityTranslation) && entityTranslation.indices?.[0] !== -1)
                .map((entityTranslation) => {
                  const id = `${entityTranslation.index}-${entityTranslation.type}`
                  return (
                    <div key={id} className="space-y-2">
                      <Label htmlFor={id} className="text-xs uppercase font-mono min-w-0 flex-shrink-0">
                        {entityTranslation.type}
                      </Label>
                      {entityTranslation.type === 'text'
                        ? (
                            <Textarea
                              id={id}
                              value={entityTranslation.text}
                              onChange={e => handleEntityTranslationChange(entityTranslation.index, e.target.value)}
                              placeholder="输入翻译内容..."
                              className="text-sm"
                            />
                          )
                        : (
                            <Input
                              id={id}
                              value={entityTranslation.text}
                              onChange={e => handleEntityTranslationChange(entityTranslation.index, e.target.value)}
                              placeholder={`翻译 ${entityTranslation.text}`}
                              className="text-sm"
                            />
                          )}
                    </div>
                  )
                })}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-between pt-4">
            <div>
              {existingTranslation && (
                <Button variant="destructive" size="sm" onClick={handleDelete} className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  删除翻译
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsOpen(false)} className="gap-2">
                <X className="h-4 w-4" />
                取消
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!entityTranslations.some(et => et.type === 'text' && et.text.trim()) && !(enablePrepend && prependEntity.text.trim())}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                保存
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
