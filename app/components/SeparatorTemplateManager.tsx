import { Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslationStore } from '~/lib/stores/translation'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'

export function SeparatorTemplateManager() {
  const { settings, selectTemplate, addCustomTemplate, updateCustomTemplate, deleteCustomTemplate }
    = useTranslationStore()

  const [isAddingTemplate, setIsAddingTemplate] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplateHtml, setNewTemplateHtml] = useState('')

  const allTemplates = [...settings.separatorTemplates, ...settings.customTemplates]
  const selectedTemplate = allTemplates.find(t => t.id === settings.selectedTemplateId) || allTemplates[0]

  const isPreset = selectedTemplate?.id.startsWith('preset-')

  const handleAddTemplate = () => {
    if (newTemplateName.trim() && newTemplateHtml.trim()) {
      const newId = addCustomTemplate({
        name: newTemplateName.trim(),
        html: newTemplateHtml.trim(),
      })
      selectTemplate(newId)
      setNewTemplateName('')
      setNewTemplateHtml('')
      setIsAddingTemplate(false)
    }
  }

  const handleDeleteTemplate = (templateId: string) => {
    deleteCustomTemplate(templateId)
  }

  return (
    <Card className="gap-2">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>分隔符样式</span>
          <Button variant="outline" size="sm" onClick={() => setIsAddingTemplate(true)} className="h-8">
            <Plus className="h-4 w-4 mr-1" />
            新建模板
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 max-w-80 sm:max-w-110 px-4">
        {/* 模板选择器 */}
        <div className="flex items-center gap-2">
          <Label>当前模板</Label>
          <Select value={settings.selectedTemplateId} onValueChange={selectTemplate}>
            <SelectTrigger>
              <SelectValue>
                <div className="flex items-center gap-2">{selectedTemplate?.name}</div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-w-[300px] p-2">
              {allTemplates.map(template => (
                <SelectItem className="group" key={template.id} value={template.id}>
                  <div className="flex flex-col min-w-56 p-2">
                    <div className="font-medium text-sm">{template.name}</div>
                    <div className="text-xs mt-1 p-2 rounded border overflow-hidden max-w-[200px] truncate">
                      <div dangerouslySetInnerHTML={{ __html: template.html }} />
                    </div>
                  </div>
                  {!template.id.startsWith('preset-') && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity "
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 模板管理 */}
        { !isAddingTemplate && (
          <div className="space-y-3">
            <Label htmlFor={`template-name-${selectedTemplate.id}`}>模板名称</Label>
            <Input
              id={`template-name-${selectedTemplate.id}`}
              value={selectedTemplate.name}
              onChange={e => updateCustomTemplate(selectedTemplate.id, { name: e.target.value })}
              placeholder="模板名称"
              disabled={isPreset}
            />
            <Label htmlFor={`template-html-${selectedTemplate.id}`}>HTML代码</Label>
            <Textarea
              value={selectedTemplate.html}
              onChange={e => updateCustomTemplate(selectedTemplate.id, { html: e.target.value })}
              placeholder="HTML代码"
              className="min-h-[80px] w-full"
              id={`template-html-${selectedTemplate.id}`}
              readOnly={isPreset}
            />
          </div>
        )}

        {/* 添加新模板 */}
        {isAddingTemplate && (
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-medium">新建模板</Label>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsAddingTemplate(false)
                  setNewTemplateName('')
                  setNewTemplateHtml('')
                }}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <Input
              value={newTemplateName}
              onChange={e => setNewTemplateName(e.target.value)}
              placeholder="输入模板名称"
              id="new-template-name"
            />
            <Textarea
              value={newTemplateHtml}
              onChange={e => setNewTemplateHtml(e.target.value)}
              placeholder="输入HTML代码"
              className="min-h-[80px]"
              id="new-template-html"
            />
            <Button
              onClick={handleAddTemplate}
              disabled={!newTemplateName.trim() || !newTemplateHtml.trim()}
              size="sm"
              className="w-full"
            >
              <Plus className="h-3 w-3 mr-1" />
              创建模板
            </Button>
          </div>
        )}

        {/* 预览效果 */}
        <div className="space-y-2 truncate">
          <Label>预览效果</Label>
          <div className="border rounded-md p-4 bg-white dark:bg-[#080808]">
            <div className="text-sm mb-2">原文内容</div>
            <div
              dangerouslySetInnerHTML={{ __html: selectedTemplate.html }}
            />
            <div className="text-sm mt-2 font-bold">翻译内容</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
