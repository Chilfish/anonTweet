import type { FormEvent } from 'react'
import { AlertCircle, Hash } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router' // Assuming react-router-dom
import { Alert, AlertDescription } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { extractTweetId } from '~/lib/utils'

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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError('')

    const trimmedInput = input.trim()
    if (!trimmedInput) {
      setError('请输入 Tweet 的 URL 或 ID。')
      return
    }

    const tweetId = extractTweetId(trimmedInput)
    if (!tweetId) {
      setError('无法识别有效的 Tweet URL 或 ID，请检查格式。')
      return
    }
    navigate(`/tweets/${tweetId}`)
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Hash className="h-5 w-5" />
          Anon Tweet
        </CardTitle>
        <CardDescription>
          输入链接或 ID，立即加载推文内容
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Label htmlFor="tweet-input" className="sr-only">
              Tweet URL 或 ID
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
            查看推文
          </Button>
        </form>

        <div className="mt-6 text-xs space-y-2">
          <p className="font-medium text-foreground/80">支持格式:</p>
          <ul className="space-y-1.5">
            <FormatListItem>
              <code className="bg-muted px-1.5 py-0.5 rounded-sm">twitter.com/.../status/123...</code>
            </FormatListItem>
            <FormatListItem>
              <code className="bg-muted px-1.5 py-0.5 rounded-sm">x.com/.../status/123...</code>
            </FormatListItem>
            <FormatListItem>
              <code className="bg-muted px-1.5 py-0.5 rounded-sm">1234567890...</code>
              {' '}
              (纯数字 ID)
            </FormatListItem>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
