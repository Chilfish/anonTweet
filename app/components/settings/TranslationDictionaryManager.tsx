import { FileDown, FileUp, MoreHorizontal, Pencil, Plus, SearchIcon, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
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
import { ScrollArea } from '~/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../ui/input-group'

// --- Types ---

export interface TranslationEntry {
  id: string
  original: string
  translated: string
  type: 'tag' | 'text'
  createdAt: number
}

interface TranslationDictionaryState {
  entries: TranslationEntry[]
  addEntry: (entry: Omit<TranslationEntry, 'id' | 'createdAt'>) => void
  removeEntry: (id: string) => void
  updateEntry: (id: string, updates: Partial<TranslationEntry>) => void
  importEntries: (entries: TranslationEntry[]) => void
  clearEntries: () => void
}

// --- Store ---

export const useTranslationDictionaryStore = create<TranslationDictionaryState>()(
  persist(
    set => ({
      entries: [],
      addEntry: entry => set(state => ({
        entries: [
          {
            ...entry,
            id: crypto.randomUUID(),
            createdAt: Date.now(),
          },
          ...state.entries,
        ],
      })),
      removeEntry: id => set(state => ({
        entries: state.entries.filter(e => e.id !== id),
      })),
      updateEntry: (id, updates) => set(state => ({
        entries: state.entries.map(e => e.id === id ? { ...e, ...updates } : e),
      })),
      importEntries: newEntries => set((state) => {
        const existingIds = new Set(state.entries.map(e => e.id))
        // Basic deduplication by ID, but also checking for exact content duplicates could be nice.
        // For now, we trust the import to have unique IDs or we regenerate them if needed (not implemented here).
        // Merging based on ID:
        const uniqueNew = newEntries.filter(e => !existingIds.has(e.id))
        return { entries: [...uniqueNew, ...state.entries] }
      }),
      clearEntries: () => set({ entries: [] }),
    }),
    {
      name: 'translation-dictionary-storage',
    },
  ),
)

// --- Components ---

export function TranslationDictionaryManager() {
  const { entries, addEntry, removeEntry, updateEntry, importEntries } = useTranslationDictionaryStore()

  // -- State --
  const [searchTerm, setSearchTerm] = useState('')
  const [newOriginal, setNewOriginal] = useState('')
  const [newTranslated, setNewTranslated] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  // Edit Dialog State
  const [editingEntry, setEditingEntry] = useState<TranslationEntry | null>(null)
  const [editOriginal, setEditOriginal] = useState('')
  const [editTranslated, setEditTranslated] = useState('')
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // -- Handlers --

  const handleAdd = () => {
    if (!newOriginal.trim() || !newTranslated.trim())
      return

    addEntry({
      original: newOriginal.trim(),
      translated: newTranslated.trim(),
      type: 'text',
    })

    setNewOriginal('')
    setNewTranslated('')
    setShowAddForm(false)
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(entries, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `translation_dictionary_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
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
          importEntries(parsed)
        }
        else {
          // alert('Invalid JSON format: Expected an array.')
        }
      }
      catch (error) {
        console.error('Import failed', error)
        // alert('Failed to parse JSON file.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const openEditDialog = (entry: TranslationEntry) => {
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

  // -- Derived State --
  const filteredEntries = entries.filter(entry =>
    entry.original.toLowerCase().includes(searchTerm.toLowerCase())
    || entry.translated.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <Card className="w-full shadow-none border-0 sm:border sm:shadow-sm">
      <CardHeader className="px-4 py-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h3 className="font-bold">翻译词汇对照表</h3>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button onClick={() => setShowAddForm(true)} variant="outline" size="sm">
              <Plus className="size-4 mr-1" />
              添加新词汇
            </Button>

            <Button variant="outline" size="sm" onClick={handleExport} title="导出 JSON" className="flex-1 sm:flex-none">
              <FileDown className="size-4" />
              导出
            </Button>
            <div className="relative flex-1 sm:flex-none">
              <Button variant="outline" size="sm" onClick={() => document.getElementById('dict-import')?.click()} title="导入 JSON" className="w-full">
                <FileUp className="size-4" />
                导入
              </Button>
              <input
                id="dict-import"
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImport}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-4 sm:px-6 pb-6">
        {/* Add New Entry Form */}
        {showAddForm && (
          <div className="flex flex-col gap-3 items-end bg-muted/30 p-3 rounded-lg border">
            <div className="grid w-full gap-2">
              <Label htmlFor="original-term" className="text-xs">原文</Label>
              <Input
                id="original-term"
                placeholder="e.g. MyGO"
                value={newOriginal}
                onChange={e => setNewOriginal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                className="h-9"
              />
            </div>
            <div className="grid w-full gap-2">
              <Label htmlFor="translated-term" className="text-xs">译文</Label>
              <Input
                id="translated-term"
                placeholder="e.g. 我的去"
                value={newTranslated}
                onChange={e => setNewTranslated(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                className="h-9"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false)
                  setNewOriginal('')
                  setNewTranslated('')
                }}
                className="shrink-0 h-9"
                size="sm"
              >
                取消
              </Button>
              <Button onClick={handleAdd} disabled={!newOriginal || !newTranslated} className="shrink-0 h-9" size="sm">
                <Plus className="size-4 mr-1" />
                添加
              </Button>
            </div>
          </div>
        )}

        {/* Search & List */}
        <div className="space-y-2">
          <InputGroup>
            <InputGroupAddon align="inline-start">

              <SearchIcon className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="搜索词汇..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="h-9"
            />
          </InputGroup>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">原文</TableHead>
                  <TableHead className="w-[40%]">译文</TableHead>
                  <TableHead className="w-[20%] text-right pr-4">操作</TableHead>
                </TableRow>
              </TableHeader>
            </Table>
            <ScrollArea className="w-full">
              <Table>
                <TableBody>
                  {filteredEntries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                        {entries.length === 0 ? '暂无数据，请添加。' : '未找到匹配项。'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEntries.map(entry => (
                      <TableRow key={entry.id}>
                        <TableCell className="w-[40%] max-w-sm truncate">
                          {entry.original}
                        </TableCell>
                        <TableCell className="w-[40%] max-w-sm truncate">
                          {entry.translated}
                        </TableCell>
                        <TableCell className="w-[20%] text-right pr-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="size-4" />
                                <span className="sr-only">菜单</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(entry)}>
                                <Pencil className="mr-2 size-4" />
                                编辑
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => removeEntry(entry.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 size-4" />
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
            </ScrollArea>
          </div>
          <div className="text-xs text-muted-foreground text-right px-1">
            共
            {' '}
            {filteredEntries.length}
            {' '}
            /
            {entries.length}
            {' '}
            条
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>编辑词汇</DialogTitle>
              <DialogDescription>
                修改原文或译文。点击保存以更新。
              </DialogDescription>
            </DialogHeader>
            <DialogPanel className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-original" className="text-right">
                  原文
                </Label>
                <Input
                  id="edit-original"
                  value={editOriginal}
                  onChange={e => setEditOriginal(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-translated" className="text-right">
                  译文
                </Label>
                <Input
                  id="edit-translated"
                  value={editTranslated}
                  onChange={e => setEditTranslated(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </DialogPanel>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>取消</Button>
              <Button onClick={handleSaveEdit}>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
