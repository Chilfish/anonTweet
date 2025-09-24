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
  delay?: number // 下载间隔，防止并发过多
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
  const { delay = 500 } = options

  for (let i = 0; i < items.length; i++) {
    const item = items[i]

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
          console.log(`下载完成: ${filename} (${i + 1}/${items.length})`)
          options.onComplete?.(filename)
        },
        onError: (error, filename) => {
          console.error(`下载失败: ${filename}`, error)
          options.onError?.(error, filename)
        },
      })

      // 添加延迟，避免并发过多导致浏览器卡顿
      if (i < items.length - 1 && delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    catch (error) {
      // 单个文件下载失败不影响其他文件
      console.error(`跳过失败的文件: ${item.filename}`, error)
    }
  }
}

/**
 * 使用 Web Worker 进行后台下载（可选的高级功能）
 */
export function createDownloadWorker(): Worker | null {
  if (typeof Worker === 'undefined') {
    return null
  }

  // 创建一个简单的 Worker 用于后台下载
  const workerCode = `
    self.onmessage = function(e) {
      const { url, filename } = e.data
      
      fetch(url)
        .then(response => response.blob())
        .then(blob => {
          self.postMessage({ 
            type: 'success', 
            filename, 
            blob 
          })
        })
        .catch(error => {
          self.postMessage({ 
            type: 'error', 
            filename, 
            error: error.message 
          })
        })
    }
  `

  const blob = new Blob([workerCode], { type: 'application/javascript' })
  return new Worker(URL.createObjectURL(blob))
}
