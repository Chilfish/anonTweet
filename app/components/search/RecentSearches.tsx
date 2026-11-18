/** 最近搜索：点选直接重搜，最多展示十条；无记录不占位 */
export function RecentSearches({
  queries,
  onSelect,
  onClear,
}: {
  queries: string[]
  onSelect: (query: string) => void
  onClear: () => void
}) {
  if (!queries.length)
    return null

  return (
    <section className="w-full">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-medium text-muted-foreground">最近搜索</h2>
        <button
          type="button"
          onClick={onClear}
          className="text-[11px] text-muted-foreground/60 transition-colors hover:text-foreground"
        >
          清除
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {queries.map(query => (
          <button
            key={query}
            type="button"
            onClick={() => onSelect(query)}
            className="max-w-full truncate rounded-full border border-border/60 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          >
            {query}
          </button>
        ))}
      </div>
    </section>
  )
}
