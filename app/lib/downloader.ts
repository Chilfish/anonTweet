import axios from 'axios'

export interface DownloadItem {
  url: string
  filename: string
}

export interface DownloadProgress {
  loaded: number
  total: number
  percentage: number
}

export interface DownloadOptions {
  onProgress?: (progress: DownloadProgress) => void
  onComplete?: (filename: string) => void
  onError?: (error: Error, filename: string) => void
}

/**
 * 异步下载单个文件
 */
export async function downloadFile(
  item: DownloadItem,
  options: DownloadOptions = {},
): Promise<void> {
  const { url, filename } = item
  const { onProgress, onComplete, onError } = options

  try {
    const response = await axios({
      method: 'GET',
      url,
      responseType: 'blob',
      onDownloadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const loaded = progressEvent.loaded
          const total = progressEvent.total
          const percentage = Math.round((loaded * 100) / total)
          onProgress({ loaded, total, percentage })
        }
      },
    })

    // 创建下载链接
    const blob = new Blob([response.data])
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename

    // 触发下载
    document.body.appendChild(link)
    link.click()

    // 清理
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)

    onComplete?.(filename)
  }
  catch (error) {
    const err = error instanceof Error ? error : new Error('下载失败')
    onError?.(err, filename)
    throw err
  }
}

/**
 * 批量异步下载文件
 */
export async function downloadFiles(
  items: DownloadItem[],
  options: DownloadOptions = {},
): Promise<void> {
  for (const item of items) {
    try {
      await downloadFile(item, {
        ...options,
        onProgress: (progress) => {
          // 为每个文件添加索引信息
          options.onProgress?.({
            ...progress,
            // 可以在这里添加当前文件索引等信息
          })
        },
        onComplete: (filename) => {
          options.onComplete?.(filename)
        },
        onError: (error, filename) => {
          console.error(`下载失败: ${filename}`, error)
          options.onError?.(error, filename)
        },
      })
    }
    catch (error) {
      // 单个文件下载失败不影响其他文件
      console.error(`跳过失败的文件: ${item.filename}`, error)
    }
  }
}
