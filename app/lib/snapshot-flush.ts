const writers = new Map<string, () => void>()

/**
 * `usePersistSnapshot` 注册当前快照的立即写入函数。
 * 截图 / 保存翻译等不改变 store 形状的操作，用 key 主动 flush 一次。
 */
export function registerSnapshotWriter(
  key: string,
  writer: () => void,
): () => void {
  writers.set(key, writer)
  return () => {
    if (writers.get(key) === writer)
      writers.delete(key)
  }
}

export function flushSnapshot(key: string): void {
  writers.get(key)?.()
}
