import type { EnrichedTweet } from '~/types'
import { BookA, Languages, LanguagesIcon, Loader2, Save, Sparkles } from 'lucide-react'
import React, { useMemo } from 'react'
import { SettingsGroup } from '~/components/settings/SettingsUI'
import { DictionaryViewer } from '~/components/translation/DictionaryViewer'
import { ToggleTransButton } from '~/components/translation/ToggleTransButton'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogPanel, DialogTitle, DialogTrigger } from '~/components/ui/dialog'
import { Label } from '~/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { useTranslationEditorLogic } from '~/hooks/use-translation-editor-logic'
import { TweetBody } from '~/lib/react-tweet'

import { useShowTranslationButton, useTranslationActions } from '~/lib/stores/hooks'
import { EntityList, PrependSection } from './EditorComponents'

interface TranslationEditorProps {
  originalTweet: EnrichedTweet
  className?: string
}

export const TranslationEditor: React.FC<TranslationEditorProps> = ({
  originalTweet,
  className,
}) => {
  const showTranslationButton = useShowTranslationButton()
  const { hasTextContent } = useTranslationActions()
  const editor = useTranslationEditorLogic(originalTweet)

  const isVisible = useMemo(() => {
    return hasTextContent(originalTweet.text) && showTranslationButton
  }, [originalTweet.text, showTranslationButton, hasTextContent])

  if (!isVisible)
    return null

  return (
    <Dialog
      open={editor.isOpen}
      onOpenChange={editor.setIsOpen}
      dismissible={false}
    >
      <DialogTrigger render={(
        <Button
          variant="secondary"
          size="icon-sm"
          onClick={editor.initializeEditor}
          className={`${className} ml-auto bg-transparent`}
          data-testid="translation-editor-button"
        />
      )}
      >
        <LanguagesIcon className="size-3.5 text-muted-foreground" />
      </DialogTrigger>

      {editor.isOpen && (
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Languages className="size-5" />
              翻译推文
            </DialogTitle>
          </DialogHeader>

          <DialogPanel
            className="space-y-6"
          >
            {/* 原文对照 */}
            <div className="space-y-2">
              <Label className="px-1 text-xs font-medium text-muted-foreground">原文对照</Label>
              <SettingsGroup className="bg-muted/30 border-dashed">
                <div className="p-4">
                  <TweetBody tweet={originalTweet} isTranslated={false} />
                </div>
              </SettingsGroup>
            </div>

            {/* 句首补充组件 */}
            <PrependSection
              enabled={editor.enablePrepend}
              setEnabled={editor.setEnablePrepend}
              text={editor.prependText}
              setText={editor.setPrependText}
            />

            {/* 实体编辑列表 */}
            <EntityList
              entities={editor.editingEntities}
              originalTweet={originalTweet}
              onUpdate={editor.updateEntityTranslation}
            />
          </DialogPanel>

          <DialogFooter className="flex-row items-center justify-between gap-2 sm:justify-between">

            <Popover>
              <PopoverTrigger render={(
                <Button
                  variant="outline"
                  size="sm"
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

            {editor.enableAITranslation && (
              <Button
                variant="outline"
                size="sm"
                onClick={editor.requestAITranslation}
                disabled={editor.isAITranslating}
                className="text-muted-foreground hover:text-foreground"
              >
                {editor.isAITranslating
                  ? <Loader2 className="size-3.5 animate-spin" />
                  : <Sparkles className="size-3.5" />}
                <span className="hidden sm:inline-block">
                  AI 翻译
                </span>
              </Button>
            )}

            <ToggleTransButton
              tweetId={originalTweet.id_str}
              variant="outline"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            />

            <Button
              className="ml-auto"
              onClick={editor.saveTranslations}
            >
              <Save className="size-4" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  )
}

TranslationEditor.displayName = 'TranslationEditor'
