import type { SnapshotRecord } from '~/lib/storage/db'
import { useEffect, useRef } from 'react'
import { putSnapshot } from '~/lib/storage/snapshots'

const DEFAULT_DELAY = 800

/**
 * 详情快照持久化：记录变化后防抖写入，卸载时 flush。
 *
 * `record` 必须来自 `useMemo` + store 的稳定引用，否则每次渲染都会重置计时器。
 */
export function usePersistSnapshot(
  record: SnapshotRecord | null,
  delay = DEFAULT_DELAY,
): void {
  const latest = useRef(record)
  latest.current = record

  useEffect(() => {
    if (!record || typeof indexedDB === 'undefined')
      return
    const timer = setTimeout(() => {
      if (latest.current)
        void putSnapshot(latest.current)
    }, delay)
    return () => clearTimeout(timer)
  }, [record, delay])

  useEffect(() => () => {
    if (latest.current && typeof indexedDB !== 'undefined')
      void putSnapshot(latest.current)
  }, [])
}
