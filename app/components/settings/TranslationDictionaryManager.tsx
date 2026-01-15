import type { TranslationDicEntry } from '~/lib/stores/TranslationDictionary'
import { FileDown, FileUp, Pencil, Plus, SearchIcon, Trash2, X } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { toastManager } from '~/components/ui/toast'
import { downloadExcel, parseExcel, useTranslationDictionaryStore } from '~/lib/stores/TranslationDictionary'
import { SettingsGroup, SettingsRow } from './SettingsUI'

export function TranslationDictionaryManager() {
  const { entries, addEntry, removeEntry, updateEntry, importEntries } = useTranslationDictionaryStore()

  // -- Local State --
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  // Add Form State
  const [newOriginal, setNewOriginal] = useState('')
  const [newTranslated, setNewTranslated] = useState('')

  // Edit Dialog State
  const [editingEntry, setEditingEntry] = useState<TranslationDicEntry | null>(null)
  const [editOriginal, setEditOriginal] = useState('')
  const [editTranslated, setEditTranslated] = useState('')
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredEntries = useMemo(() => {
    const lowerTerm = searchTerm.toLowerCase().trim()
    if (!lowerTerm)
      return entries

    return entries.filter(entry =>
      entry.original.toLowerCase().includes(lowerTerm)
      || entry.translated.toLowerCase().includes(lowerTerm),
    )
  }, [entries, searchTerm])

  // -- Handlers --

  const handleAdd = () => {
    if (!newOriginal.trim() || !newTranslated.trim())
      return

    addEntry({
      original: newOriginal.trim(),
      translated: newTranslated.trim(),
    })

    setNewOriginal('')
    setNewTranslated('')
    toastManager.add({
      title: '已添加',
      type: 'success',
    })
  }

  const handleExport = async () => {
    try {
      await downloadExcel(entries)
      toastManager.add({
        title: '导出成功',
        description: 'Excel 文件已开始下载',
        type: 'success',
      })
    }
    catch (e) {
      console.error('Export failed', e)
      toastManager.add({
        title: '导出失败',
        description: `导出过程中发生错误: ${e}`,
        type: 'error',
      })
    }
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file)
      return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const result = event.target?.result as ArrayBuffer
        if (!result)
          throw new Error('File read failed')

        const parsed = await parseExcel(result)

        if (Array.isArray(parsed) && parsed.length > 0) {
          const stats = importEntries(parsed)
          toastManager.add({
            title: '导入成功',
            description: `成功导入 ${stats.added} 条新词条，跳过 ${stats.skipped} 条重复项。`,
            type: 'success',
          })
        }
        else if (Array.isArray(parsed) && parsed.length === 0) {
          toastManager.add({
            title: '导入无数据',
            description: '未在 Excel 中找到有效词条。请确保表头为 原文 和 译文。',
            type: 'error',
          })
        }
        else {
          toastManager.add({
            title: '导入失败',
            description: '文件格式错误或为空。',
            type: 'error',
          })
        }
      }
      catch (error) {
        console.error('Import failed', error)
        toastManager.add({
          title: '导入失败',
          description: '解析 Excel 失败，请检查文件格式。',
          type: 'error',
        })
      }
      finally {
        if (fileInputRef.current)
          fileInputRef.current.value = ''
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const openEditDialog = (entry: TranslationDicEntry) => {
    setEditingEntry(entry)
    setEditOriginal(entry.original)
    setEditTranslated(entry.translated)
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = () => {
    if (editingEntry && editOriginal.trim() && editTranslated.trim()) {
      updateEntry(editingEntry.id, {
        original: editOriginal.trim(),
        translated: editTranslated.trim(),
      })
      setIsEditDialogOpen(false)
      setEditingEntry(null)
    }
  }

  return (
    <div className="space-y-6 p-1">
      {/* Management Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-sm font-medium text-muted-foreground">管理</h4>
          <span className="text-xs text-muted-foreground">
            共
            {' '}
            {entries.length}
            {' '}
            条
          </span>
        </div>
        <p className="px-1 text-[10px] text-muted-foreground/60 leading-tight">
          在此添加的词汇将自动应用到 AI 翻译中，不会覆盖 AI 设置中的自定义术语表。
        </p>
        <SettingsGroup>
          {/* Add Toggle */}
          <SettingsRow
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setShowAddForm(!showAddForm)}
            label="添加新词汇"
          >
            <Button size="icon" variant="ghost" className="h-6 w-6 pointer-events-none">
              {showAddForm ? <X className="size-4" /> : <Plus className="size-4" />}
            </Button>
          </SettingsRow>

          {/* Add Form */}
          {showAddForm && (
            <div className="p-4 bg-muted/30 border-t space-y-3 animate-in slide-in-from-top-2 fade-in duration-200">
              <div className="space-y-2">
                <Input
                  placeholder="原文 (e.g. MyGO!!!!!)"
                  value={newOriginal}
                  onChange={e => setNewOriginal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  className="bg-background text-xs"
                />
                <Input
                  placeholder="译文 (e.g. 我的去!!!!!)"
                  value={newTranslated}
                  onChange={e => setNewTranslated(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  className="bg-background text-xs"
                />
              </div>
              <Button onClick={handleAdd} disabled={!newOriginal || !newTranslated} size="sm" className="w-full">
                确认添加
              </Button>
            </div>
          )}

          {/* Import / Export */}
          <SettingsRow
            label="数据备份"
          >
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8" onClick={handleExport}>
                <FileDown className="size-3.5 mr-1" />
                导出
              </Button>

              <Button variant="outline" size="sm" className="h-8" onClick={() => fileInputRef.current?.click()}>
                <FileUp className="size-3.5 mr-1" />
                导入
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                className="hidden"
                onChange={handleImport}
              />
            </div>
          </SettingsRow>
        </SettingsGroup>
      </div>

      {/* List Section */}
      <div className="space-y-2">
        <h4 className="px-1 text-sm font-medium text-muted-foreground">词汇列表</h4>

        {/* Search Bar */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="搜索原文 or 译文..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 bg-muted/30 border-transparent focus-visible:bg-background focus-visible:border-input transition-all"
          />
        </div>

        <SettingsGroup className="max-h-[400px] overflow-y-auto">
          {filteredEntries.length === 0
            ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  {searchTerm ? '没有找到匹配的词汇' : '暂无数据，请添加或导入'}
                </div>
              )
            : (
                filteredEntries.map(entry => (
                  <SettingsRow
                    key={entry.id}
                    className="items-start py-3 gap-3"
                    label={entry.original}
                    description={entry.translated}
                  >
                    <div className="flex shrink-0 items-center gap-1 -mr-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => openEditDialog(entry)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeEntry(entry.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </SettingsRow>
                ))
              )}
        </SettingsGroup>
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        dismissible={false}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>编辑词汇</DialogTitle>
            <DialogDescription>
              修改词汇的对应关系。
            </DialogDescription>
          </DialogHeader>
          <DialogPanel className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-original">原文</Label>
              <Input
                id="edit-original"
                value={editOriginal}
                onChange={e => setEditOriginal(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-translated">译文</Label>
              <Input
                id="edit-translated"
                value={editTranslated}
                onChange={e => setEditTranslated(e.target.value)}
              />
            </div>
          </DialogPanel>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>取消</Button>
            <Button onClick={handleSaveEdit}>保存修改</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
