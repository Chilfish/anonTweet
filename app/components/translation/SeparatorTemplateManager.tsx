import { Check, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'
import { useTranslationStore } from '~/lib/stores/translation'
import { cn } from '~/lib/utils'

function TemplatePreview({ html }: { html: string }) {
  return (
    <div className="space-y-2">
      <Label>预览效果</Label>
      <div className="border rounded-md p-4 bg-background/50 relative overflow-hidden">
        <div className="text-sm mb-2">原文内容...</div>
        <div
          className="prose dark:prose-invert max-w-none text-sm"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <div className="text-sm font-bold mt-2">翻译内容...</div>
      </div>
    </div>
  )
}

interface EditorProps {
  id: string
  initialName: string
  initialHtml: string
  isReadOnly: boolean
  onUpdate: (id: string, data: { name?: string, html?: string }) => void
  onDelete?: (id: string) => void
}

function TemplateEditor({
  id,
  initialName,
  initialHtml,
  isReadOnly,
  onUpdate,
  onDelete,
}: EditorProps) {
  const [name, setName] = useState(initialName)
  const [html, setHtml] = useState(initialHtml)

  useEffect(() => {
    setName(initialName)
    setHtml(initialHtml)
  }, [id, initialName, initialHtml])

  useEffect(() => {
    if (isReadOnly)
      return

    const timer = setTimeout(() => {
      if (name !== initialName || html !== initialHtml) {
        onUpdate(id, { name, html })
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [name, html, id, isReadOnly, onUpdate, initialName, initialHtml])

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="grid gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor={`tpl-name-${id}`}>模板名称</Label>
            {!isReadOnly && onDelete && (
              <Button
                variant="destructive-outline"
                size="sm"
                onClick={() => onDelete(id)}
              >
                <Trash2 className="size-3.5" />
                删除此模板
              </Button>
            )}
          </div>
          <Input
            id={`tpl-name-${id}`}
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={isReadOnly}
            className={cn(isReadOnly && 'opacity-70')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`tpl-html-${id}`}>HTML 代码</Label>
          <Textarea
            id={`tpl-html-${id}`}
            value={html}
            onChange={e => setHtml(e.target.value)}
            readOnly={isReadOnly}
            className={cn(
              'font-mono text-xs min-h-[100px] resize-y',
              isReadOnly && 'opacity-70 bg-muted',
            )}
          />
        </div>
      </div>

      <TemplatePreview html={html} />
    </div>
  )
}

export function SeparatorTemplateManager() {
  const {
    settings,
    selectTemplate,
    addCustomTemplate,
    updateCustomTemplate,
    deleteCustomTemplate,
  } = useTranslationStore()

  const [isCreating, setIsCreating] = useState(false)

  const [newTemplate, setNewTemplate] = useState({ name: '', html: '<hr class="my-4" />' })

  const allTemplates = useMemo(() =>
    [...settings.separatorTemplates, ...settings.customTemplates], [settings.separatorTemplates, settings.customTemplates])

  const selectedTemplate = useMemo(() =>
    allTemplates.find(t => t.id === settings.selectedTemplateId) || allTemplates[0], [allTemplates, settings.selectedTemplateId])

  const isPreset = !!selectedTemplate?.id.startsWith('preset-')

  const handleCreate = () => {
    if (!newTemplate.name.trim())
      return

    const newId = addCustomTemplate({
      name: newTemplate.name.trim(),
      html: newTemplate.html.trim(),
    })
    selectTemplate(newId)
    setIsCreating(false)
    setNewTemplate({ name: '', html: '<hr class="my-4" />' })
  }

  const handleDelete = useCallback((id: string) => {
    if (settings.selectedTemplateId === id) {
      selectTemplate(allTemplates[0]!.id)
    }
    deleteCustomTemplate(id)
  }, [settings.selectedTemplateId, allTemplates, selectTemplate, deleteCustomTemplate])

  return (
    <Card className="w-full gap-2">
      <CardHeader className="flex items-center justify-between">
        <h3 className="font-bold">分隔符样式</h3>
        {!isCreating ? (
          <Button
            size="sm"
            onClick={() => setIsCreating(true)}
            className="h-8 gap-1"
          >
            <Plus className="size-3.5" />
            新建
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => setIsCreating(false)}
            className="h-8 gap-1"
          >
            <RotateCcw className="size-3.5" />
            返回
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {isCreating ? (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
              <div className="space-y-2">
                <Label>新模板名称</Label>
                <Input
                  value={newTemplate.name}
                  onChange={e => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="例如：极简线条"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label>HTML 代码</Label>
                <Textarea
                  value={newTemplate.html}
                  onChange={e => setNewTemplate(prev => ({ ...prev, html: e.target.value }))}
                  className="font-mono text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setIsCreating(false)}>取消</Button>
                <Button size="sm" onClick={handleCreate} disabled={!newTemplate.name.trim()}>
                  <Check className="size-3.5" />
                  确认创建
                </Button>
              </div>
            </div>
            <TemplatePreview html={newTemplate.html} />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label>选择模板</Label>
              <Select
                value={selectedTemplate?.id}
                onValueChange={value => selectTemplate(value!)}
              >
                <SelectTrigger>
                  <SelectValue>{selectedTemplate?.name || '选择模板'}</SelectValue>
                </SelectTrigger>
                <SelectPopup className="max-h-[300px]">
                  {allTemplates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      <span className={cn(
                        'flex items-center gap-2',
                        template.id.startsWith('preset-') && 'font-medium',
                      )}
                      >
                        {template.name}
                        {template.id.startsWith('preset-') && (
                          <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                            预设
                          </span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
            </div>

            {selectedTemplate && (
              <TemplateEditor
                key={selectedTemplate.id}
                id={selectedTemplate.id}
                initialName={selectedTemplate.name}
                initialHtml={selectedTemplate.html}
                isReadOnly={isPreset}
                onUpdate={updateCustomTemplate}
                onDelete={handleDelete}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
