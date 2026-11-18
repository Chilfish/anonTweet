import type { SnapshotRecord } from '~/lib/storage/db'
import { useCallback, useEffect, useRef } from 'react'
import { registerSnapshotWriter } from '~/lib/snapshot-flush'
import { putSnapshot } from '~/lib/storage/snapshots'

const DEFAULT_DELAY = 800

/**
 * 详情快照持久化：记录变化后防抖写入，卸载时 flush。
 *
 * `record` 必须来自 `useMemo` + store 的稳定引用，否则每次渲染都会重置计时器。
 * 写入时统一把 `savedAt` 刷新为当前时间；截图 / 翻译保存可通过
 * `flushSnapshot(key)` 立即落盘，不依赖 800ms 防抖。
 */
export function usePersistSnapshot(
  record: SnapshotRecord | null,
  delay = DEFAULT_DELAY,
): void {
  const latest = useRef(record)
  latest.current = record
  const key = record?.key

  const writeNow = useCallback(() => {
    if (latest.current && typeof indexedDB !== 'undefined') {
      void putSnapshot({
        ...latest.current,
        savedAt: Date.now(),
      })
    }
  }, [])

  useEffect(() => {
    if (!record || typeof indexedDB === 'undefined')
      return
    const timer = setTimeout(writeNow, delay)
    return () => clearTimeout(timer)
  }, [record, delay, writeNow])

  useEffect(() => {
    if (!key)
      return
    return registerSnapshotWriter(key, writeNow)
  }, [key, writeNow])

  useEffect(() => () => {
    writeNow()
  }, [writeNow])
}
