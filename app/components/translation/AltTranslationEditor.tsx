import type { EnrichedTweet } from '~/types'
import { BookA, Languages, LanguagesIcon, Save } from 'lucide-react'
import React, { useMemo } from 'react'
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
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { useAltTranslationLogic } from '~/hooks/use-alt-translation-logic'
import { useUIState } from '~/lib/stores/hooks'
import { AltEntityList } from './AltEditorComponents'

interface AltTranslationEditorProps {
  originalTweet: EnrichedTweet
  className?: string
}

export const AltTranslationEditor: React.FC<AltTranslationEditorProps> = ({
  originalTweet,
  className,
}) => {
  const { showTranslationButton } = useUIState()
  const editor = useAltTranslationLogic(originalTweet)

  const isVisible = useMemo(() => {
    // 只有当存在 Alt 实体且全局开关打开时才显示入口
    const hasAlt = originalTweet.entities?.some(e => e.type === 'media_alt')
    return showTranslationButton && hasAlt
  }, [showTranslationButton, originalTweet.entities])

  if (!isVisible)
    return null

  return (
    <Dialog open={editor.isOpen} onOpenChange={editor.setIsOpen} dismissible={false}>
      <DialogTrigger render={(
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={editor.initializeEditor}
          className={`${className} size-5 hover:bg-background/50 p-0`}
          title="翻译图片描述"
        />
      )}
      >
        <LanguagesIcon className="size-3 text-muted-foreground/70" />
        <span className="sr-only">翻译图片描述</span>
      </DialogTrigger>

      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Languages className="size-5" />
            翻译图片描述
          </DialogTitle>
        </DialogHeader>

        <DialogPanel className="space-y-4">
          {/* 编辑列表组件 */}
          <AltEntityList
            entities={editor.editingEntities}
            onUpdate={editor.updateAltTranslation}
          />
        </DialogPanel>

        <DialogFooter className="flex-row items-center justify-between gap-2 sm:justify-between">
          <Popover>
            <PopoverTrigger render={(
              <Button
                variant="outline"
                size="sm"
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

          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="destructive-outline"
              onClick={editor.hideTranslations}
            >
              <Save className="size-4" />
              删除
            </Button>
            <Button
              onClick={editor.saveTranslations}
            >
              <Save className="size-4" />
              保存
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
