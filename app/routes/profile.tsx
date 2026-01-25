import type { RawUser } from '~/types'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import useSWR from 'swr/immutable'
import { ProfileHeader } from '~/components/profile/ProfileHeader'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { fetcher } from '~/lib/fetcher'

async function getProfile(username: string) {
  if (!username)
    return null

  const { data } = await fetcher.get<RawUser | null>(`/api/user/get/${username}`)

  console.log(data)
  return data
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { username } = useParams()
  const [searchUsername, setSearchUsername] = useState(username || '')

  const { data: user, isLoading } = useSWR(
    username,
    getProfile,
  )

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchUsername.trim()) {
      navigate(`/profile/${searchUsername.trim()}`)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse font-medium">加载中...</div>
      </div>
    )
  }

  return (
    <div className="bg-background border-x border-border rounded">
      {user ? (
        <ProfileHeader user={user} />
      ) : (
        <div className="p-8 flex flex-col items-center justify-center gap-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-black tracking-tight">查找用户</h1>
            <p className="text-muted-foreground">
              搜索推特用户名以查看其公开个人资料
            </p>
          </div>

          <form onSubmit={handleSearch} className="w-full max-w-sm space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-bold ml-1">用户名</Label>
              <Input
                id="username"
                className="rounded-xl h-12 focus-visible:ring-primary"
                placeholder="例如: elonmusk"
                value={searchUsername}
                onChange={e => setSearchUsername(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full h-12 rounded-full font-bold text-base transition-all active:scale-95">
              搜索
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}
