import type { FormEvent } from 'react'
import axios from 'axios'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ImageUploader } from '~/components/SortableImage'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'

interface ApiResponse {
  message?: string
  dyn_id_str?: string
  error?: string
}

async function submitBiliPost(formData: FormData): Promise<{ postId: string | null, error: string | null }> {
  try {
    const response = await axios.postForm<ApiResponse>('/api/bili-post', formData)
    if (response.data.error) {
      return { postId: null, error: response.data.error }
    }
    const dynId = response.data.dyn_id_str
    return { postId: dynId !== undefined ? dynId : 'N/A', error: null }
  }
  catch (err: any) {
    let errorMessage = '发生未知错误'
    if (err.response && err.response.data && err.response.data.error) {
      errorMessage = err.response.data.error
    }
    else if (err.message) {
      errorMessage = err.message
    }
    return { postId: null, error: errorMessage }
  }
}

export interface CookieSettings {
  cookie: string
}

interface CookieState extends CookieSettings {
  setCookie: (cookie: string) => void
}

export const useCookieStore = create<CookieState>()(
  persist(
    set => ({
      cookie: '',
      setCookie: cookie => set({ cookie }),
    }),
    { name: 'cookie-store', version: 1 },
  ),
)

export default function PublishDynamicForm() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [images, setImages] = useState<File[]>([])

  const { cookie, setCookie } = useCookieStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [postId, setPostId] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!content || !cookie) {
      setError('内容和 Cookie 是必填项。')
      return
    }

    setIsLoading(true)

    const formData = new FormData()
    formData.append('title', title)
    formData.append('content', content)
    formData.append('cookie', cookie)

    // 这里的 images 已经是排序好的数组
    images.forEach((image) => {
      formData.append('images', image)
    })

    const result = await submitBiliPost(formData)
    if (result.error) {
      setError(result.error)
    }
    else {
      setPostId(result.postId)
      setSuccess('动态发布成功。')
      setTitle('')
      setContent('')
      setImages([])
    }
    setIsLoading(false)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-bold">发布 Bilibili 动态</CardTitle>
        <CardDescription>填写内容、上传图片并提供 Cookie 即可发布。</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="error">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>错误</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="bg-green-50 text-green-900 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle>成功</AlertTitle>
              <AlertDescription className="flex-row gap-0">
                <span>
                  {success}
                </span>
                <a
                  className="underline font-medium ml-1"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`https://t.bilibili.com/${postId}`}
                >
                  点击查看动态：
                  {postId}
                </a>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="cookie">Cookie (Bilibili)</Label>
            <Input
              id="cookie"
              type="password"
              placeholder="SESSDATA=...; bili_jct=...; DedeUserID=..."
              value={cookie}
              onChange={e => setCookie(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">标题 (可选)</Label>
            <Input
              id="title"
              placeholder="为你的动态添加一个醒目的标题"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">内容</Label>
            <Textarea
              id="content"
              placeholder="分享你的新鲜事..."
              className="min-h-[120px] resize-y"
              value={content}
              onChange={e => setContent(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>
              图片 (
              {images.length}
              /18)
            </Label>
            {/* 替换为新组件 */}
            <ImageUploader
              value={images}
              onChange={setImages}
              maxCount={18}
            />
          </div>
        </CardContent>

        <CardFooter className="pt-4">
          <Button
            render={<Link to="/" />}
            variant="link"
          >
            返回首页
          </Button>

          <Button
            type="submit"
            className="ml-auto"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                发布中...
              </>
            ) : (
              '立即发布'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
