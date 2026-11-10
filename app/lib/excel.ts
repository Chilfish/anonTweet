import type { TranslationDicEntry } from '~/lib/stores/TranslationDictionary'

/**
 * Excel 导入导出仅在浏览器触发（设置页按钮 / 文件选择）。
 * SSR 构建通过 `import.meta.env.SSR` 分支裁掉 `xlsx` 动态 chunk，避免把 700KB+
 * 的解析器带进 Worker bundle。
 */
async function loadXLSX() {
  if (import.meta.env.SSR)
    throw new Error('Excel 导入导出仅在浏览器可用')
  return import('xlsx')
}

export async function downloadExcel(entries: TranslationDicEntry[]) {
  const XLSX = await loadXLSX()
  const data = entries.map(e => ({
    原文: e.original,
    译文: e.translated,
  }))
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Dictionary')
  XLSX.writeFile(wb, `翻译对照表_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

export async function parseExcel(data: ArrayBuffer): Promise<Omit<TranslationDicEntry, 'id' | 'createdAt'>[]> {
  const XLSX = await loadXLSX()
  const wb = XLSX.read(data, { type: 'array' })
  const wsName = wb.SheetNames[0]
  if (!wsName)
    return []
  const ws = wb.Sheets[wsName]!
  const jsonData = XLSX.utils.sheet_to_json<any>(ws)

  return jsonData
    .map((item) => {
      // Try to find fields by common names (case-insensitive or Chinese)
      const keys = Object.keys(item)
      const originalKey = keys.find(k => k.toLowerCase() === 'original' || k === '原文')
      const translatedKey = keys.find(k => k.toLowerCase() === 'translated' || k === '译文')

      if (originalKey && translatedKey) {
        return {
          original: String(item[originalKey]),
          translated: String(item[translatedKey]),
        }
      }
      return null
    })
    .filter((e): e is Omit<TranslationDicEntry, 'id' | 'createdAt'> =>
      e !== null && Boolean(e.original.trim()) && Boolean(e.translated.trim()),
    )
}
