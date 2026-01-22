import { Copy, SearchIcon } from 'lucide-react'
import { useState } from 'react'
import { SettingsGroup, SettingsRow } from '~/components/settings/SettingsUI'
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
    <div className="flex flex-col gap-3 max-h-80">
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

      <ScrollArea className="flex-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground space-y-1">
            <span className="text-sm">{search ? '无匹配结果' : '暂无词条'}</span>
            {!search && <span className="text-xs opacity-70">可在设置中添加</span>}
          </div>
        ) : (
          <SettingsGroup className="border-border/50 shadow-none">
            {filtered.map(entry => (
              <SettingsRow
                key={entry.id}
                className="min-h-12 py-2 px-3 gap-2"
                label={entry.translated}
                description={entry.original}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={() => copyToClipboard(entry.translated)}
                  title="复制译文"
                >
                  <Copy className="size-3.5" />
                </Button>
              </SettingsRow>
            ))}
          </SettingsGroup>
        )}
      </ScrollArea>
    </div>
  )
}
