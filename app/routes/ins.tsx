import type { IGTranslationMode } from '~/components/ins/IGTranslateToggle'
import type { IGPostData } from '~/types'
import { AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router'
import useSWR from 'swr'
import { IGHeader } from '~/components/ins/IGHeader'
import { InstagramPostCard } from '~/components/ins/InstagramPostCard'
import { Alert, AlertDescription } from '~/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Skeleton } from '~/components/ui/skeleton'
import { useIGOperations } from '~/hooks/use-ig-operations'
import { useIGScreenshotAction } from '~/hooks/use-ig-screenshot-action'
import { fetcher } from '~/lib/fetcher'
import { useAIConfig } from '~/lib/stores/hooks'
import { extractIGId, toast } from '~/lib/utils'

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

async function getIGPost(
  id: string,
  aiConfig?: {
    enableAITranslation: boolean
    aiProvider: string
    apiKey: string
    model: string
    thinkingLevel?: string
    translationGlossary?: string
  },
): Promise<IGPostData> {
  const body = aiConfig?.enableAITranslation && aiConfig.apiKey && aiConfig.model
    ? {
        enableAITranslation: true,
        apiKey: aiConfig.apiKey,
        model: aiConfig.model,
        provider: aiConfig.aiProvider,
        thinkingLevel: aiConfig.thinkingLevel,
        translationGlossary: aiConfig.translationGlossary,
      }
    : {}

  const { data } = await fetcher.post<IGPostData>(`/api/ig/get/${id}`, body)
  return data
}

export default function IGPostPage() {
  const { id } = useParams()
  const igId = id ? (extractIGId(id) ?? id) : null

  // 翻译模式：local state，不依赖全局 Twitter 翻译 store
  const [translationMode, setTranslationMode] = useState<IGTranslationMode>('bilingual')

  // 翻译触发状态
  const [isTranslating, setIsTranslating] = useState(false)

  // AI 配置（使用 selector hook 防止不必要重渲染）
  const aiConfigFromStore = useAIConfig()

  const apiKey = aiConfigFromStore.aiProvider === 'google'
    ? aiConfigFromStore.geminiApiKey
    : aiConfigFromStore.deepseekApiKey
  const model = aiConfigFromStore.aiProvider === 'google'
    ? aiConfigFromStore.geminiModel
    : aiConfigFromStore.deepseekModel
  const thinkingLevel = aiConfigFromStore.aiProvider === 'google'
    ? aiConfigFromStore.geminiThinkingLevel
    : aiConfigFromStore.deepseekThinkingLevel

  const aiConfig = {
    enableAITranslation: aiConfigFromStore.enableAITranslation,
    aiProvider: aiConfigFromStore.aiProvider,
    apiKey,
    model,
    thinkingLevel,
    translationGlossary: aiConfigFromStore.translationGlossary,
  }

  const { data: posts, error, isLoading, mutate } = useSWR<IGPostData>(
    igId,
    () => getIGPost(igId!, aiConfig),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  )

  const post = posts?.[0] ?? null

  // IG 操作 hook
  const { downloadMedia, copyText, copyMarkdown } = useIGOperations(post)

  // 截图 hook
  const { containerRef, handleScreenshot, isCapturing } = useIGScreenshotAction({ post })

  // 翻译 caption 回调
  const handleTranslateCaption = async () => {
    if (!igId || !post?.description)
      return

    if (!apiKey || !model) {
      toast.error('翻译失败：未配置 API Key', {
        description: '请在设置中配置 Gemini 或 DeepSeek API Key',
      })
      return
    }

    setIsTranslating(true)
    try {
      const result = await fetcher.post<{ captionTranslation: string }>(
        `/api/ig/translate/${igId}`,
        {
          apiKey,
          model,
          provider: aiConfigFromStore.aiProvider,
          thinkingLevel,
          translationGlossary: aiConfigFromStore.translationGlossary,
        },
      )

      if (result.data?.captionTranslation) {
        // 更新本地 SWR 缓存 — 把翻译文本注入帖子
        mutate(
          (currentData) => {
            if (!currentData)
              return currentData
            const updated = currentData.map(p =>
              p.id === igId
                ? { ...p, captionTranslation: result.data.captionTranslation }
                : p,
            )
            return updated
          },
          { revalidate: false },
        )

        toast.success('翻译完成')
      }
      else {
        toast.error('翻译失败', { description: '返回结果为空' })
      }
    }
    catch (err) {
      console.error('[IG] Translate error:', err)
      toast.error('翻译请求失败')
    }
    finally {
      setIsTranslating(false)
    }
  }

  // 共享的 header props
  const headerProps = {
    post,
    translationMode,
    onTranslationModeChange: setTranslationMode,
    isCapturing,
    onScreenshot: handleScreenshot,
    onDownload: downloadMedia,
    onCopyText: copyText,
    onCopyMarkdown: copyMarkdown,
  }

  // 无有效 ID
  if (!igId) {
    return (
      <>
        <IGHeader {...headerProps} />
        <IGNotFound id={id} />
      </>
    )
  }

  // 加载中
  if (isLoading) {
    return (
      <>
        <IGHeader {...headerProps} />
        <IGPostSkeleton />
      </>
    )
  }

  // 错误 / 无数据
  if (error || !posts || posts.length === 0) {
    console.error(error)
    return (
      <>
        <IGHeader {...headerProps} />
        <IGNotFound id={igId} />
      </>
    )
  }

  // 正常渲染
  return (
    <>
      <IGHeader {...headerProps} />
      <InstagramPostCard
        ref={containerRef}
        post={post!}
        translationMode={translationMode}
        isTranslatingCaption={isTranslating}
        onTranslateCaption={handleTranslateCaption}
        className="mt-4"
      />
    </>
  )
}
