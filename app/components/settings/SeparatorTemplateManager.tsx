import { Check, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'
import { useTranslationStore } from '~/lib/stores/translation'
import { cn } from '~/lib/utils'
import { SettingsGroup, SettingsRow } from './SettingsUI'

function TemplatePreview({ html }: { html: string }) {
  return (
    <div className="space-y-2">
      <h4 className="px-1 text-sm font-medium text-muted-foreground">预览效果</h4>
      <div className="overflow-hidden rounded-xl border bg-muted/20 p-6 shadow-sm">
        <div className="text-sm mb-2 opacity-60">原文内容...</div>
        <div
          className="prose dark:prose-invert max-w-none text-sm"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <div className="text-sm font-bold mt-2 opacity-60">翻译内容...</div>
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="space-y-2">
        <h4 className="px-1 text-sm font-medium text-muted-foreground">配置</h4>
        <SettingsGroup>
          <SettingsRow>
            <Label htmlFor={`tpl-name-${id}`} className="w-20 shrink-0 font-medium">名称</Label>
            <Input
              id={`tpl-name-${id}`}
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={isReadOnly}
              className={cn(
                'text-right h-8 border-none shadow-none focus-visible:ring-0 px-0',
                isReadOnly && 'opacity-70',
              )}
            />
          </SettingsRow>

          <div className="p-4 border-t space-y-2 bg-muted/10">
            <Label htmlFor={`tpl-html-${id}`} className="text-xs text-muted-foreground">HTML 结构</Label>
            <Textarea
              id={`tpl-html-${id}`}
              value={html}
              onChange={e => setHtml(e.target.value)}
              readOnly={isReadOnly}
              className={cn(
                'font-mono text-xs min-h-[100px] resize-y bg-background',
                isReadOnly && 'opacity-70 bg-muted',
              )}
            />
          </div>
        </SettingsGroup>
      </div>

      <TemplatePreview html={html} />

      {!isReadOnly && onDelete && (
        <div className="px-1">
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => onDelete(id)}
          >
            <Trash2 className="size-4 mr-2" />
            删除此模板
          </Button>
        </div>
      )}
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
    <div className="space-y-6 p-1">
      {/* Header Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-sm font-medium text-muted-foreground">
            {isCreating ? '新建模板' : '模板选择'}
          </h4>
          {!isCreating
            ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsCreating(true)}
                  className="h-7 px-2 text-primary hover:text-primary hover:bg-primary/10"
                >
                  <Plus className="size-3.5 mr-1" />
                  新建
                </Button>
              )
            : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsCreating(false)}
                  className="h-7 px-2"
                >
                  <RotateCcw className="size-3.5 mr-1" />
                  返回
                </Button>
              )}
        </div>

        {isCreating
          ? (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <SettingsGroup>
                  <SettingsRow>
                    <Label className="w-20 shrink-0 font-medium">名称</Label>
                    <Input
                      value={newTemplate.name}
                      onChange={e => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="例如：极简线条"
                      className="text-right h-8 border-none shadow-none focus-visible:ring-0"
                      autoFocus
                    />
                  </SettingsRow>
                  <div className="p-4 border-t space-y-2 bg-muted/10">
                    <Label className="text-xs text-muted-foreground">HTML 结构</Label>
                    <Textarea
                      value={newTemplate.html}
                      onChange={e => setNewTemplate(prev => ({ ...prev, html: e.target.value }))}
                      className="font-mono text-xs bg-background min-h-[100px]"
                    />
                  </div>
                </SettingsGroup>

                <TemplatePreview html={newTemplate.html} />

                <div className="px-1">
                  <Button
                    className="w-full"
                    onClick={handleCreate}
                    disabled={!newTemplate.name.trim()}
                  >
                    <Check className="size-4 mr-2" />
                    确认创建
                  </Button>
                </div>
              </div>
            )
          : (
              <>
                <SettingsGroup>
                  <SettingsRow>
                    <Label className="shrink-0 font-medium">当前应用</Label>
                    <div className="flex-1 min-w-0 flex justify-end">
                      <Select
                        value={selectedTemplate?.id}
                        onValueChange={value => selectTemplate(value!)}
                      >
                        <SelectTrigger className="w-[200px] h-8 border-none shadow-none focus:ring-0 justify-end gap-2">
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
                  </SettingsRow>
                </SettingsGroup>

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
      </div>
    </div>
  )
}
