import type { IGTranslationMode } from '~/components/ins/IGTranslateToggle'
import type { IGPostData } from '~/types'
import { AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router'
import useSWR from 'swr'
import { IGHeader } from '~/components/ins/IGHeader'
import { IGPostSkeleton } from '~/components/ins/IGPostSkeleton'
import { InstagramPostCard } from '~/components/ins/InstagramPostCard'
import { Alert, AlertDescription } from '~/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { useIGOperations } from '~/hooks/use-ig-operations'
import { useIGScreenshotAction } from '~/hooks/use-ig-screenshot-action'
import { fetcher } from '~/lib/fetcher'
import { useAIConfig } from '~/lib/stores/hooks'
import { extractIGId } from '~/lib/utils'

export function meta() {
  return [
    { title: 'Anon Tweet — Instagram' },
    { name: 'description', content: 'Instagram 帖子查看器' },
  ]
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

  // AI 配置（用于自动翻译 — 加载时附带 enableAITranslation）
  const aiConfigFromStore = useAIConfig()

  const apiKey = aiConfigFromStore.aiProvider === 'google'
    ? aiConfigFromStore.geminiApiKey
    : aiConfigFromStore.deepseekApiKey
  const model = aiConfigFromStore.aiProvider === 'google'
    ? aiConfigFromStore.geminiModel
    : aiConfigFromStore.deepseekModel

  const aiConfig = {
    enableAITranslation: aiConfigFromStore.enableAITranslation,
    aiProvider: aiConfigFromStore.aiProvider,
    apiKey,
    model,
    thinkingLevel: undefined as string | undefined,
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

  // 翻译完成回调（IGTranslateDialog 保存后触发）
  const handleTranslated = (captionTranslation: string) => {
    if (!igId)
      return

    // 更新 SWR 缓存
    mutate(
      (currentData) => {
        if (!currentData)
          return currentData
        return currentData.map(p =>
          p.id === igId
            ? { ...p, captionTranslation }
            : p,
        )
      },
      { revalidate: false },
    )
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
        onTranslated={handleTranslated}
        className="mt-4"
      />
    </>
  )
}
