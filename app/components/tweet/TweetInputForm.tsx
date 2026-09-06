import type { FormEvent } from 'react'
import { AlertCircle, Hash } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Alert, AlertDescription } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  hasSharedContent,
  pickSharedInput,
  resolveShareTarget,
} from '~/lib/share'

function FormatListItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-muted-foreground">
      <span className="mt-1 text-primary/80">•</span>
      <span className="flex-1">{children}</span>
    </li>
  )
}

export function TweetInputForm() {
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  /** 提交原始内容（与「手动粘贴点查看」走同一套解析/跳转，见 app/lib/share.ts）。 */
  const submitRaw = (raw: string) => {
    setError('')
    const result = resolveShareTarget(raw)
    if (result.ok) {
      navigate(result.to)
    }
    else {
      setError(result.error)
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    submitRaw(input)
  }

  // 一次性处理系统分享落地（PWA share_target，action="/" 携带 title/text/url）：
  // 把分享内容填进输入框后照常 submitRaw——可识别链接自动跳转，不可识别留框报错待手动改。
  // ref 守卫：仅首次且仅在真实存在分享字段时触发，避免普通访问首页 / 热重载误触发。
  const shareHandled = useRef(false)
  useEffect(() => {
    if (shareHandled.current)
      return

    const title = searchParams.get('title') ?? ''
    const text = searchParams.get('text') ?? ''
    const url = searchParams.get('url') ?? ''
    if (!hasSharedContent({ title, text, url }))
      return

    shareHandled.current = true
    const shared = pickSharedInput({ title, text, url })
    setInput(shared)

    const result = resolveShareTarget(shared)
    if (result.ok) {
      navigate(result.to)
    }
    else {
      setError(result.error)
    }
    // searchParams 变化即重新评估；配合 ref 保证只落地一次
  }, [searchParams, navigate])

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Hash className="h-5 w-5" />
          Anon Tweet
        </CardTitle>
        <CardDescription>
          输入链接或 ID，加载推文 / Instagram 内容
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Label htmlFor="tweet-input" className="sr-only">
              Tweet / Instagram URL 或 ID
            </Label>
            <Input
              id="tweet-input"
              name="tweet-id"
              type="text"
              placeholder="粘贴 URL 或输入 ID..."
              value={input}
              onChange={e => setInput(e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          {error && (
            <Alert variant="error">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full">
            查看
          </Button>
        </form>

        <div className="mt-6 text-xs space-y-2">
          <p className="font-medium text-foreground/80">支持格式:</p>
          <ul className="space-y-1.5">
            <FormatListItem>
              <code className="bg-muted px-1.5 py-0.5 rounded-sm">x.com/.../status/123...</code>
            </FormatListItem>
            <FormatListItem>
              <code className="bg-muted px-1.5 py-0.5 rounded-sm">1234567890...</code>
              {' '}
              (推文纯数字 ID)
            </FormatListItem>
            <FormatListItem>
              <code className="bg-muted px-1.5 py-0.5 rounded-sm">
                instagram.com/p/
                {'{id}'}
                /
              </code>
            </FormatListItem>
            <FormatListItem>
              <code className="bg-muted px-1.5 py-0.5 rounded-sm">
                instagram.com/reel/
                {'{id}'}
                /
              </code>
            </FormatListItem>
            <FormatListItem>
              <code className="bg-muted px-1.5 py-0.5 rounded-sm">
                instagram.com/
                {'{username}'}
                /p/
                {'{id}'}
                /
              </code>
            </FormatListItem>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
