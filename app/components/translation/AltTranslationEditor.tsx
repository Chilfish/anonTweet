import type { EnrichedTweet, Entity } from '~/types'
import { BookA, EyeOff, Languages, LanguagesIcon, RotateCcw, Save } from 'lucide-react'
import React, { useCallback, useMemo, useState } from 'react'
import { SettingsGroup } from '~/components/settings/SettingsUI'
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
import { Label } from '~/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { Textarea } from '~/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import { useTranslationActions, useUIState } from '~/lib/stores/hooks'
import { decodeHtmlEntities } from '~/lib/utils'

interface AltTranslationEditorProps {
  originalTweet: EnrichedTweet
  className?: string
}

// 辅助函数：判断是否跳过某些实体的翻译编辑（只允许 media_alt）
function shouldSkipEntity(entity: Entity) {
  // 只保留 media_alt
  return entity.type !== 'media_alt'
}

// 辅助函数：获取显示文本（优先取 translation，没有则取 text）
function getEntityDisplayValue(entity: Entity) {
  return decodeHtmlEntities(entity.translation || entity.text)
}

export const AltTranslationEditor: React.FC<AltTranslationEditorProps> = ({
  originalTweet,
  className,
}) => {
  const tweetId = originalTweet.id_str
  const [isOpen, setIsOpen] = useState(false)
  const [editingEntities, setEditingEntities] = useState<Entity[]>([])

  const { showTranslationButton } = useUIState()
  const {
    getTranslation,
    setTranslation,
    setTranslationVisibility,
    resetTranslation,
  } = useTranslationActions()

  const isVisible = useMemo(() => {
    // 只要有媒体Alt就显示，或者根据业务逻辑
    return showTranslationButton
  }, [showTranslationButton])

  const handleOpen = useCallback(() => {
    // 1. 优先获取用户本地保存的“人工精修”翻译
    const existing = getTranslation(tweetId)
    const tweetWithAuto = originalTweet as EnrichedTweet

    let baseEntities: Entity[] = []

    if (existing && existing.length > 0) {
      // 命中本地缓存，深拷贝
      baseEntities = JSON.parse(JSON.stringify(existing))
    }
    else if (tweetWithAuto.autoTranslationEntities && tweetWithAuto.autoTranslationEntities.length > 0) {
      // 2. 命中服务端 AI 翻译
      baseEntities = JSON.parse(JSON.stringify(tweetWithAuto.autoTranslationEntities))
    }
    else {
      // 3. 回退：使用原始实体
      baseEntities = (originalTweet.entities || []).map((e) => {
        return { ...e }
      })
    }

    const originalAlts = (originalTweet.entities || []).filter(e => e.type === 'media_alt')

    // 检查 baseEntities 里是否涵盖了所有的 alt
    // 通过 index 匹配
    originalAlts.forEach((alt) => {
      const exists = baseEntities.find(e => e.index === alt.index)
      if (!exists) {
        baseEntities.push({ ...alt })
      }
      else {
        exists.text = alt.text
      }
    })

    // 重新排序
    baseEntities.sort((a, b) => a.index - b.index)

    setEditingEntities(baseEntities)
    setIsOpen(true)
  }, [tweetId, getTranslation, originalTweet])

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const finalTranslations: Entity[] = editingEntities.map((entity) => {
      // 只更新 media_alt，其他保持原样
      if (shouldSkipEntity(entity)) {
        return entity
      }

      const inputName = `entity-${entity.index}`
      const inputValue = formData.get(inputName) as string

      return {
        ...entity,
        translation: inputValue !== null ? inputValue : entity.translation,
      }
    })

    setTranslation(tweetId, finalTranslations)
    // 保存时确保可见
    setTranslationVisibility(tweetId, { alt: true })
    setIsOpen(false)
  }

  const handleHide = () => {
    setTranslationVisibility(tweetId, { alt: false })
    setIsOpen(false)
  }

  const handleReset = () => {
    resetTranslation(tweetId)
    // resetTranslation already resets visibility to default (true) in store logic
    setIsOpen(false)
  }

  if (!isVisible)
    return null

  // 计算有多少个待编辑项
  const editableCount = editingEntities.filter(e => !shouldSkipEntity(e)).length
  if (isOpen && editableCount === 0) {
    // 如果打开了但发现没东西可编（理论上不应该发生，因为入口会控制），可以显示空状态
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen} dismissible={false}>
      <DialogTrigger render={(
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleOpen}
          className={`${className} h-5 w-5 hover:bg-background/50`}
          title="翻译图片描述"
        >
          <LanguagesIcon className="size-3 text-muted-foreground/70" />
        </Button>
      )}
      >
        <LanguagesIcon className="size-3 text-muted-foreground/70" />
      </DialogTrigger>

      <DialogContent render={<form onSubmit={handleSave} />} className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Languages className="size-5" />
            翻译图片描述
          </DialogTitle>
        </DialogHeader>

        <DialogPanel className="space-y-6">
          {/* 译文编辑 */}
          <div className="space-y-2">
            <SettingsGroup>
              {editingEntities.map((entity) => {
                if (shouldSkipEntity(entity))
                  return null

                const inputId = `entity-${entity.index}`
                const displayValue = getEntityDisplayValue(entity)

                return (
                  <div key={inputId} className="flex flex-col border-b last:border-0 bg-card">
                    <div className="flex items-center justify-between px-4 py-2 bg-muted/20 border-b border-border/40">
                      <Label htmlFor={inputId} className="text-[10px] uppercase font-mono text-muted-foreground flex items-center gap-2">
                        ALT TEXT
                        <span className="text-[10px] text-muted-foreground/70">
                          图
                          {entity.index - 20000 + 1}
                        </span>
                      </Label>
                    </div>
                    <div className="p-3 bg-muted/10 border-b-2 border-border/10">
                      <p className="text-muted-foreground leading-relaxed">
                        {entity.text}
                      </p>
                    </div>
                    <Textarea
                      id={inputId}
                      name={inputId}
                      defaultValue={displayValue}
                      className="min-h-12 border-none shadow-none rounded-none bg-transparent resize-none text-sm leading-relaxed"
                      placeholder="输入翻译..."
                    />
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
              <BookA className="size-4" />
              词汇表
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start" side="top">
              <DictionaryViewer />
            </PopoverContent>
          </Popover>

          <div className="flex items-center gap-2">
            {getTranslation(tweetId) !== null && (
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
            )}

            {getTranslation(tweetId) !== null && (
              <Tooltip>
                <TooltipTrigger render={(
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleHide}
                  >
                    <EyeOff className="size-4" />
                    隐藏
                  </Button>
                )}
                >
                  <EyeOff className="size-4" />
                  隐藏
                </TooltipTrigger>
                <TooltipContent>
                  不再显示此推文的翻译
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
    </Dialog>
  )
}
