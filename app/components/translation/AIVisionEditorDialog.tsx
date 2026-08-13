import type { EnrichedTweet } from '~/types'
import type { VisionMode } from '~/types/vision'
import { ImageIcon, Loader2, Save, Sparkles } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Switch } from '~/components/ui/switch'
import { Textarea } from '~/components/ui/textarea'
import { useVisionLogic } from '~/hooks/use-vision-logic'
import { resolveVisionView } from '~/lib/vision/parse'

const MODE_OPTIONS: Array<{ label: string, value: VisionMode }> = [
  { label: '看图说话', value: 'describe' },
  { label: 'OCR + 翻译', value: 'ocr' },
  { label: '自定义提示', value: 'custom' },
]

export function AIVisionEditorDialog({ originalTweet }: { originalTweet: EnrichedTweet }) {
  const editor = useVisionLogic(originalTweet)
  const currentModeOption = MODE_OPTIONS.find(opt => opt.value === editor.mode)

  return (
    <Dialog open={editor.isOpen} onOpenChange={editor.setIsOpen} dismissible={false}>
      <DialogTrigger render={(
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={editor.initializeEditor}
          className="size-5 hover:bg-background/50 p-0"
          title="生成/编辑 AI 图片描述"
        />
      )}
      >
        <Sparkles className="size-3 text-muted-foreground/70" />
        <span className="sr-only">生成/编辑 AI 图片描述</span>
      </DialogTrigger>

      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="size-5" />
            AI 图片描述
          </DialogTitle>
        </DialogHeader>

        <DialogPanel className="space-y-4">
          {/* 弹窗级生成配置：mode + withContext + customPrompt 作用于一次请求 */}
          <div className="flex flex-wrap items-center gap-3 px-1">
            <Select
              value={currentModeOption}
              onValueChange={opt => opt && editor.setMode(opt.value)}
            >
              <SelectTrigger className="w-fit h-8 border-none transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODE_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Switch
                checked={editor.withContext}
                onCheckedChange={editor.setWithContext}
              />
              附推文上下文
            </label>
          </div>

          {editor.mode === 'custom' && (
            <Textarea
              value={editor.customPrompt}
              onChange={e => editor.setCustomPrompt(e.target.value)}
              placeholder="输入自定义描述提示词…"
              className="min-h-20 bg-secondary/20 border-none focus-visible:ring-1 focus-visible:ring-primary/20 resize-none rounded-lg text-sm"
            />
          )}

          {/* 逐图查看 + 手动覆盖编辑 */}
          <div className="space-y-1">
            {editor.photoIndexes.map((i) => {
              const aiInfo = editor.visionInfo.find(v => v.index === i)
              const view = resolveVisionView(aiInfo, editor.manualTexts[i])
              return (
                <div key={i} className="flex flex-col border-b last:border-0 bg-card">
                  <div className="flex items-center justify-between px-4 py-2 bg-muted/20 border-b border-border/40">
                    <Label className="text-[10px] uppercase font-mono text-muted-foreground flex items-center gap-2">
                      IMAGE
                      <span className="text-[10px] text-muted-foreground/70 bg-muted px-1.5 py-0.5 rounded">
                        图
                        {' '}
                        {i + 1}
                      </span>
                    </Label>
                  </div>

                  {view.hasView && (
                    <div className="p-3 bg-muted/10 border-b-2">
                      {view.originalText && (
                        <p className="tweet-body text-xs opacity-70 break-words">
                          {view.originalText}
                        </p>
                      )}
                      {view.originalText && view.displayText && (
                        <div className="my-1 border-t border-border/40" />
                      )}
                      {view.displayText && (
                        <p className="tweet-body text-xs font-bold break-words">
                          {view.displayText}
                        </p>
                      )}
                    </div>
                  )}
                  {aiInfo?.status === 'error' && (
                    <div className="p-3 bg-destructive/5 border-b-2">
                      <p className="text-xs text-destructive break-words">{aiInfo.error}</p>
                    </div>
                  )}

                  <Textarea
                    value={editor.manualTexts[i] ?? ''}
                    onChange={e => editor.updateManual(i, e.target.value)}
                    placeholder={aiInfo?.mode === 'ocr'
                      ? '手动输入翻译覆盖（可选，优先于 AI 结果）…'
                      : '手动输入描述覆盖（可选，优先于 AI 结果）…'}
                    className="min-h-16 border-none shadow-none rounded-none bg-transparent resize-none text-sm leading-relaxed focus-visible:ring-0"
                  />
                </div>
              )
            })}
          </div>
        </DialogPanel>

        <DialogFooter className="flex-row items-center justify-between gap-2 sm:justify-between">
          <span className="px-1 text-[10px] text-muted-foreground/50">
            使用
            {editor.providerName}
            {' '}
            生成 · OCR 模式可复现图片文字并翻译
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={editor.generate}
              disabled={editor.isGenerating}
              className="text-muted-foreground hover:text-foreground"
            >
              {editor.isGenerating
                ? <Loader2 className="size-3.5 animate-spin" />
                : <Sparkles className="size-3.5" />}
              <span className="hidden sm:inline-block">
                AI 生成
              </span>
            </Button>
            <Button
              size="sm"
              onClick={editor.save}
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
