import type { IGPost } from '~/types'
import { BookA, Languages, Loader2, Save, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { DictionaryViewer } from '~/components/translation/DictionaryViewer'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogPanel, DialogTitle, DialogTrigger } from '~/components/ui/dialog'
import { Label } from '~/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { Textarea } from '~/components/ui/textarea'
import { fetcher } from '~/lib/fetcher'
import { useAIConfig } from '~/lib/stores/hooks'
import { useTranslationDictionaryStore } from '~/lib/stores/TranslationDictionary'
import { toast } from '~/lib/utils'
import { RichText } from '../RichText'

interface IGTranslateDialogProps {
  post: IGPost
  /** 翻译完成后回调，用于更新父组件状态 */
  onTranslated: (captionTranslation: string) => void
}

/**
 * Instagram caption 翻译弹窗。
 *
 * 比 Twitter TranslationEditor 简化得多：
 * - 无实体编辑（IG caption 是纯文本）
 * - 原文对照 + AI 翻译按钮 + 可编辑译文 + 保存
 */
export function IGTranslateDialog({ post, onTranslated }: IGTranslateDialogProps) {
  const [open, setOpen] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const [editedText, setEditedText] = useState(post.captionTranslation || '')

  const aiConfig = useAIConfig()
  const dictEntries = useTranslationDictionaryStore(state => state.getFormattedEntries)

  const apiKey = aiConfig.aiProvider === 'google'
    ? aiConfig.geminiApiKey
    : aiConfig.deepseekApiKey
  const model = aiConfig.aiProvider === 'google'
    ? aiConfig.geminiModel
    : aiConfig.deepseekModel
  const thinkingLevel = aiConfig.aiProvider === 'google'
    ? aiConfig.geminiThinkingLevel
    : aiConfig.deepseekThinkingLevel

  const handleAITranslate = async () => {
    if (!apiKey || !model) {
      toast.error(`请配置 ${aiConfig.aiProvider === 'google' ? 'Gemini' : 'DeepSeek'} API Key`)
      return
    }

    setIsTranslating(true)
    try {
      const combinedGlossary = [dictEntries(), aiConfig.translationGlossary].filter(Boolean).join('\n')

      const { data } = await fetcher.post('/api/ai-translation', {
        type: 'ins',
        igPost: post,
        enableAITranslation: true,
        apiKey,
        model,
        thinkingLevel,
        translationGlossary: combinedGlossary,
        force: true,
      })

      if (data.success && data.data?.captionTranslation) {
        setEditedText(data.data.captionTranslation)
        toast.success('AI 翻译完成')
      }
      else {
        toast.error('AI 翻译失败', { description: data.error || '返回结果为空' })
      }
    }
    catch (error: any) {
      console.error('[IG TranslateDialog] AI error:', error)
      toast.error('AI 翻译请求失败')
    }
    finally {
      setIsTranslating(false)
    }
  }

  const handleSave = async () => {
    const text = editedText.trim()
    if (!text)
      return

    // 写回 DB + localCache
    try {
      await fetcher.post(`/api/ig/translate/${post.id}`, {
        manualTranslation: text,
      })
    }
    catch (err) {
      console.error('[IG] Failed to save translation to DB:', err)
      // 不阻塞：DB 写失败不影响 UI 更新
    }

    onTranslated(text)
    toast.success('翻译已保存', {
      description: '已同步到数据库',
    })
    setOpen(false)
  }

  // 打开时初始化编辑文本
  const handleOpen = (open_: boolean) => {
    if (open_) {
      setEditedText(post.captionTranslation || '')
    }
    setOpen(open_)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger
        render={(
          <Button
            variant="ghost"
            size="icon"
            className="inline-flex align-middle -my-1 ml-1 size-6 text-muted-foreground hover:text-foreground"
            aria-label="翻译 caption"
          />
        )}
      >
        <Languages className="size-3.5" />
      </DialogTrigger>

      {open && (
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Languages className="size-5" />
              翻译 Caption
            </DialogTitle>
          </DialogHeader>

          <DialogPanel className="space-y-4">
            {/* 原文对照 */}
            <div className="space-y-2">
              <Label className="px-1 text-xs font-medium text-muted-foreground">
                原文
              </Label>
              <RichText
                text={post.description}
                className="p-3 rounded-lg bg-muted/30 border border-dashed text-sm whitespace-pre-wrap wrap-break-words"
              />
            </div>

            {/* 译文编辑 */}
            <div className="space-y-2">
              <Label className="px-1 text-xs font-medium text-muted-foreground">
                AI 翻译结果
              </Label>
              <Textarea
                value={editedText}
                onChange={e => setEditedText(e.target.value)}
                placeholder="点击「AI 翻译」生成译文，或手动输入..."
                className="min-h-[100px] text-sm"
              />
            </div>
          </DialogPanel>

          <DialogFooter className="flex-row items-center justify-between gap-2 sm:justify-between">
            <Popover>
              <PopoverTrigger
                render={(
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                    title="查看词汇表"
                  />
                )}
              >
                <BookA className="size-4" />
                <span className="hidden sm:inline">词汇表</span>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start" side="top">
                <DictionaryViewer />
              </PopoverContent>
            </Popover>

            <Button
              variant="outline"
              size="sm"
              onClick={handleAITranslate}
              disabled={isTranslating}
              className="text-muted-foreground hover:text-foreground"
            >
              {isTranslating
                ? <Loader2 className="size-3.5 animate-spin" />
                : <Sparkles className="size-3.5" />}
              <span className="hidden sm:inline">AI 翻译</span>
            </Button>

            <Button className="ml-auto" onClick={handleSave}>
              <Save className="size-4" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  )
}
