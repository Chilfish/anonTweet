import type { Route } from './+types/ins-user'
import type { IGProfileData } from '~/types'
import { AlertCircle } from 'lucide-react'
import { useParams } from 'react-router'
import useSWR from 'swr'
import { IGProfileCard } from '~/components/ins/IGProfileCard'
import { IGProfilePostGrid } from '~/components/ins/IGProfilePostGrid'
import { IGProfileSkeleton } from '~/components/ins/IGProfileSkeleton'
import { BackButton } from '~/components/translation/BackButton'
import { Alert, AlertDescription } from '~/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { useRecordVisit } from '~/hooks/use-record-visit'
import { fetcher } from '~/lib/fetcher'
import { buildMeta } from '~/lib/seo'
import { IG_USERNAME_RE } from '~/lib/url-detect'

export function meta({ params }: Route.MetaArgs) {
  const username = params.username ?? ''
  return buildMeta({
    title: username
      ? `@${username} 的 Instagram 主页 | Anon Tweet`
      : 'Instagram 主页查看 | Anon Tweet',
    description: '匿名查看 Instagram 用户主页：头像、简介、粉丝数与近期帖子，无需登录。',
    noindex: true,
  })
}

function IGProfileNotFound({ username }: { username?: string }) {
  return (
    <Card className="mx-auto mt-8 w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center">未找到主页</CardTitle>
      </CardHeader>
      <CardContent>
        <Alert variant="error">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {username
              ? `无法加载 Instagram 主页: @${username}`
              : '请输入有效的 Instagram 主页链接'}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

async function getIGProfile(username: string): Promise<IGProfileData> {
  const { data } = await fetcher.get<IGProfileData>(`/api/ig/user/${encodeURIComponent(username)}`)
  return data
}

export default function IGProfilePage() {
  const { username = '' } = useParams()
  const valid = IG_USERNAME_RE.test(username)

  const { data, error, isLoading } = useSWR<IGProfileData>(
    valid
      ? `ig-profile:${username.toLowerCase()}`
      : null,
    () => getIGProfile(username),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  )

  const profile = data?.profile
  const posts = data?.posts ?? []

  useRecordVisit(profile
    ? {
        type: 'ig',
        id: `user~${profile.username}`,
        title: `${profile.fullname || profile.username} (@${profile.username})`,
        snippet: profile.biography?.replace(/\s+/g, ' ').trim().slice(0, 90),
        image: profile.avatarUrl,
        author: `@${profile.username}`,
        authorHandle: profile.username,
      }
    : null)

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between gap-2 px-1 py-2 sm:px-0">
        <BackButton />
      </div>

      {!valid
        ? <IGProfileNotFound username={username} />
        : isLoading
          ? <IGProfileSkeleton />
          : error || !profile
            ? <IGProfileNotFound username={username} />
            : (
                <>
                  <IGProfileCard profile={profile} />
                  {posts.length > 0
                    ? (
                        <div className="mx-auto w-full max-w-[600px]">
                          <IGProfilePostGrid posts={posts} />
                        </div>
                      )
                    : (
                        <p className="py-6 text-center text-sm text-muted-foreground">
                          暂无公开帖子
                        </p>
                      )}
                </>
              )}
    </div>
  )
}
