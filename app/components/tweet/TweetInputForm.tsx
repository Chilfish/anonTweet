import type { FormEvent } from 'react'
import { AlertCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Alert, AlertDescription } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  hasSharedContent,
  pickSharedInput,
  resolveShareTarget,
} from '~/lib/share'

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
      <CardContent className="pt-6">
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

        <p className="mt-4 text-xs text-muted-foreground">
          支持 x.com 推文链接、推文 ID，以及 instagram.com 的 /p、/reel 链接
        </p>
      </CardContent>
    </Card>
  )
}
