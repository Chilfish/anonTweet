import type { IGPostData } from '~/types'
import { AlertCircle } from 'lucide-react'
import { useParams } from 'react-router'
import useSWR from 'swr'
import { IGPostCard } from '~/components/ins/IGPostCard'
import { Alert, AlertDescription } from '~/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Skeleton } from '~/components/ui/skeleton'
import { fetcher } from '~/lib/fetcher'
import { extractIGId } from '~/lib/utils'

export function meta() {
  return [
    { title: 'Anon Tweet — Instagram' },
    { name: 'description', content: 'Instagram 帖子查看器' },
  ]
}

function IGPostSkeleton() {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center gap-3 pb-2">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="w-32 h-4" />
          <Skeleton className="w-20 h-3" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="w-full aspect-square rounded-xl" />
        <Skeleton className="w-3/4 h-4" />
        <Skeleton className="w-1/2 h-4" />
      </CardContent>
    </Card>
  )
}

function IGNotFound({ id }: { id?: string }) {
  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle className="text-center">未找到帖子</CardTitle>
      </CardHeader>
      <CardContent>
        <Alert variant="error">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {id
              ? `无法加载 Instagram 帖子: ${id}`
              : '请输入有效的 Instagram 帖子链接'}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

async function getIGPost(id: string): Promise<IGPostData> {
  const { data } = await fetcher.post<IGPostData>(`/api/ig/get/${id}`, {})
  return data
}

export default function IGPostPage() {
  const { id } = useParams()
  const igId = id ? (extractIGId(id) ?? id) : null

  const { data: posts, error, isLoading } = useSWR<IGPostData>(
    igId,
    () => getIGPost(igId!),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  )

  if (!igId) {
    return <IGNotFound id={id} />
  }

  if (isLoading) {
    return <IGPostSkeleton />
  }

  if (error || !posts || posts.length === 0) {
    console.error(error)
    return <IGNotFound id={igId} />
  }

  const post = posts[0]!

  return <IGPostCard post={post} className="mt-4" />
}
