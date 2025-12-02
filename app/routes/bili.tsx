import axios from 'axios'
import React, { useState } from 'react'

// 定义一个接口来描述API响应的结构，有助于类型安全
interface ApiResponse {
  error?: string
  // 假设成功时可能返回其他数据，比如动态ID
  dyn_id_str?: string
}

export default function PublishPage() {
  // 组件内部状态管理
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [files, setFiles] = useState<FileList | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault() // 阻止表单默认的页面刷新行为

    if (!content) {
      setError('内容不能为空')
      return
    }

    // 重置状态
    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    // 创建 FormData 来聚合数据
    const formData = new FormData()
    formData.append('title', title)
    formData.append('content', content)
    if (files) {
      for (const file of files) {
        formData.append('images', file)
      }
    }

    try {
      const response = await axios.post<ApiResponse>('/api/bili-post', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      // 后端 action 返回了 error 字段
      if (response.data.error) {
        throw new Error(response.data.error)
      }

      setSuccessMessage('动态发布成功！')
      // 成功后清空表单
      setTitle('')
      setContent('')
      setFiles(null)
      // 清空文件输入框的值
      const fileInput = document.getElementById('image-input') as HTMLInputElement
      if (fileInput)
        fileInput.value = ''
    }
    catch (err: any) {
      // 处理网络错误或后端抛出的业务错误
      const errorMessage = err.response?.data?.error || err.message || '发生未知错误'
      setError(errorMessage)
    }
    finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4 max-w-lg mx-auto font-sans">
      <h1 className="text-2xl font-bold mb-6 text-center">发布新动态</h1>

      {/* 错误与成功消息提示 */}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">{error}</div>}
      {successMessage && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4" role="alert">{successMessage}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="title" className="block mb-2 font-medium text-gray-700">标题 (可选)</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none"
            placeholder="为你的动态取个标题吧"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="content" className="block mb-2 font-medium text-gray-700">内容</label>
          <textarea
            id="content"
            value={content}
            onChange={e => setContent(e.target.value)}
            required
            rows={6}
            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none"
            placeholder="分享你的新鲜事..."
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="image-input" className="block mb-2 font-medium text-gray-700">图片 (最多9张)</label>
          <input
            id="image-input"
            type="file"
            multiple
            accept="image/png, image/jpeg, image/gif"
            onChange={e => setFiles(e.target.files)}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-600 hover:file:bg-pink-100 cursor-pointer"
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-pink-500 text-white px-4 py-2.5 rounded-md hover:bg-pink-600 transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              发布中...
            </>
          ) : (
            '立即发布'
          )}
        </button>
      </form>
    </div>
  )
}
