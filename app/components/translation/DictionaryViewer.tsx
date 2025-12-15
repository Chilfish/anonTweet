import { Copy, SearchIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '~/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '~/components/ui/input-group'
import { ScrollArea } from '~/components/ui/scroll-area'
import { toastManager } from '~/components/ui/toast'
import { useTranslationDictionaryStore } from '~/lib/stores/TranslationDictionary'

export function DictionaryViewer() {
  const entries = useTranslationDictionaryStore(state => state.entries)
  const [search, setSearch] = useState('')

  const filtered = entries.filter(e =>
    e.original.toLowerCase().includes(search.toLowerCase())
    || e.translated.toLowerCase().includes(search.toLowerCase()),
  )

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toastManager.add({
      title: '已复制',
      description: text,
      type: 'success',
    })
  }

  return (
    <div className="flex flex-col gap-3 max-h-[300px]">
      <InputGroup>
        <InputGroupAddon align="inline-start">
          <SearchIcon className="size-4" />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="搜索词汇..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-8 h-9"
        />
      </InputGroup>
      <ScrollArea className="flex-1 rounded-md border bg-muted/30">
        <div className="p-3 space-y-3">
          {filtered.length === 0
            ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  {search ? '无匹配结果' : '暂无词条，可在设置中添加'}
                </div>
              )
            : (
                filtered.map(entry => (
                  <div key={entry.id} className="flex justify-between items-start gap-2 text-sm border-b border-border/50 pb-2 last:border-0 last:pb-0">
                    <div className="grid gap-0.5 w-full">
                      <div className="text-muted-foreground wrap-break-word whitespace-normal">{entry.translated}</div>
                      <div className="font-medium text-foreground wrap-break-word whitespace-normal text-xs">{entry.original}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => copyToClipboard(entry.translated)}
                      title="复制译文"
                      className="text-secondary-foreground"
                    >
                      <Copy />
                    </Button>
                  </div>
                ))
              )}
        </div>
      </ScrollArea>
    </div>
  )
}
