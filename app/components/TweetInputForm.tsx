import { AlertCircle, Hash, Link } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Alert, AlertDescription } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { extractTweetId } from '~/lib/utils'

export function TweetInputForm() {
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!input.trim()) {
      setError('请输入 Tweet URL 或 Tweet ID')
      return
    }

    const tweetId = extractTweetId(input)
    if (!tweetId) {
      setError('无效的 Tweet URL 或 ID 格式')
      return
    }

    await navigate(`/${tweetId}`)
  }

  const isUrl = input.includes('twitter.com') || input.includes('x.com')

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Hash className="h-5 w-5" />
          Anon Tweet
        </CardTitle>
        <CardDescription>
          输入 Twitter/X 链接或 Tweet ID 来查看推文
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tweet-input" className="flex items-center gap-2">
              {isUrl ? <Link className="h-4 w-4" /> : <Hash className="h-4 w-4" />}
              Tweet URL 或 ID
            </Label>
            <Input
              id="tweet-input"
              name="tweet-id"
              type="text"
              placeholder="https://twitter.com/user/status/123... 或 1234567890"
              value={input}
              onChange={e => setInput(e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full">
            查看推文
          </Button>
        </form>

        <div className="mt-6 text-xs text-muted-foreground space-y-1">
          <p className="font-medium">支持的格式：</p>
          <ul className="space-y-1 ml-2">
            <li>• Twitter URL: twitter.com/user/status/123...</li>
            <li>• X URL: x.com/user/status/123...</li>
            <li>• Tweet ID: 1234567890</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
