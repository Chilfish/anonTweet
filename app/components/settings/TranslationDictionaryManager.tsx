import type { TranslationDicEntry } from '~/lib/stores/TranslationDictionary' // 请根据实际路径调整
import { FileDown, FileUp, MoreHorizontal, Pencil, Plus, SearchIcon, Trash2, X } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader } from '~/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle,
} from '~/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { toastManager } from '~/components/ui/toast'
import { useTranslationDictionaryStore } from '~/lib/stores/TranslationDictionary'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../ui/input-group'

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
    // 以此保持添加模式开启，方便连续添加
    // setShowAddForm(false)
  }

  const handleExport = () => {
    try {
      const dataStr = JSON.stringify(entries, null, 2)
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `dictionary_${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
    catch (e) {
      console.error('Export failed', e)
      toastManager.add({
        title: '导出失败',
        description: `请检查您的浏览器是否支持导出文件。${e}`,
        type: 'error',
      })
    }
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file)
      return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const result = event.target?.result as string
        const parsed = JSON.parse(result)

        if (Array.isArray(parsed)) {
          const stats = importEntries(parsed)
          toastManager.add({
            title: '导入成功',
            description: `成功导入 ${stats.added} 条新词条，跳过 ${stats.skipped} 条重复项。`,
            type: 'success',
          })
        }
        else {
          toastManager.add({
            title: '导入失败',
            description: '文件格式错误：JSON 内容必须是数组。',
            type: 'error',
          })
        }
      }
      catch (error) {
        console.error('Import failed', error)
        toastManager.add({
          title: '导入失败',
          description: '解析 JSON 失败，请检查文件格式。',
          type: 'error',
        })
      }
      finally {
        if (fileInputRef.current)
          fileInputRef.current.value = ''
      }
    }
    reader.readAsText(file)
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
    <Card className="w-full border shadow-sm gap-2 pb-0">
      <CardHeader className="py-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h3 className="font-semibold tracking-tight">
            翻译词汇对照表
            <span className="text-xs text-muted-foreground">
              {' '}
              (
              {entries.length}
              {' '}
              条)
            </span>
          </h3>

          <div className="flex gap-2 justify-end w-full sm:w-auto">
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              variant={showAddForm ? 'secondary' : 'default'}
              size="sm"
            >
              {showAddForm ? <X className="size-4 mr-1" /> : <Plus className="size-4 mr-1" />}
              {showAddForm ? '关闭添加' : '添加词汇'}
            </Button>

            <Button variant="outline" size="sm" onClick={handleExport}>
              <FileDown className="size-4 mr-1" />
              导出
            </Button>

            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <FileUp className="size-4 mr-1" />
              导入
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Add Entry Section - Collapsible */}
        {showAddForm && (
          <div className="border-b p-4 animate-in slide-in-from-top-2 fade-in duration-200">
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="grid w-full gap-1.5">
                <Label htmlFor="new-orig" className="text-xs text-muted-foreground">原文</Label>
                <Input
                  id="new-orig"
                  placeholder="e.g. MyGO!!!!!"
                  value={newOriginal}
                  onChange={e => setNewOriginal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  className="h-9 bg-background"
                />
              </div>
              <div className="grid w-full gap-1.5">
                <Label htmlFor="new-trans" className="text-xs text-muted-foreground">译文</Label>
                <Input
                  id="new-trans"
                  placeholder="e.g. 我的去!!!!!"
                  value={newTranslated}
                  onChange={e => setNewTranslated(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  className="h-9 bg-background"
                />
              </div>
              <Button onClick={handleAdd} disabled={!newOriginal || !newTranslated}>
                添加
              </Button>
            </div>
          </div>
        )}

        {/* Toolbar: Search */}
        <div className="p-3 flex items-center gap-2">
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <SearchIcon className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="搜索原文或译文..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="h-9"
            />
          </InputGroup>
        </div>

        {/* Main Table Area */}
        <Table
          containerClassName="h-[350px] overflow-y-auto p-2 pt-0"
          className="table-fixed w-full rounded-md"
        >
          <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[40%]">原文</TableHead>
              <TableHead className="w-[40%]">译文</TableHead>
              <TableHead className="w-[20%] text-right pr-6">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="">
            {filteredEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                  {searchTerm ? '没有找到匹配的词汇' : '暂无数据，请添加或导入'}
                </TableCell>
              </TableRow>
            ) : (
              filteredEntries.map(entry => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium align-top py-3 wrap-break-word whitespace-normal">
                    {entry.original}
                  </TableCell>
                  <TableCell className="align-top py-3 wrap-break-word whitespace-normal text-muted-foreground">
                    {entry.translated}
                  </TableCell>
                  <TableCell className="text-right align-top py-3 pr-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">菜单</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(entry)}>
                          <Pencil className="mr-2 size-3.5" />
                          编辑
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => removeEntry(entry.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 size-3.5" />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

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
    </Card>
  )
}
