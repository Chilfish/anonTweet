import type { IGTranslationMode } from '~/components/ins/IGTranslateToggle'
import type { IGPostData } from '~/types'
import { AlertCircle } from 'lucide-react'
import { useRef, useState } from 'react'
import { useParams } from 'react-router'
import useSWR from 'swr'
import { IGHeader } from '~/components/ins/IGHeader'
import { IGPostList } from '~/components/ins/IGPostList'
import { IGPostSkeleton } from '~/components/ins/IGPostSkeleton'
import { IGStoryList } from '~/components/ins/IGStoryList'
import { IGStoryListSkeleton } from '~/components/ins/IGStoryListSkeleton'
import { isStoryPost } from '~/components/ins/IGStoryMeta'
import { Alert, AlertDescription } from '~/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { useIGOperations } from '~/hooks/use-ig-operations'
import { useIGScreenshotAction } from '~/hooks/use-ig-screenshot-action'
import { fetcher } from '~/lib/fetcher'
import { useAIConfig, useResolvedAIConfig } from '~/lib/stores/hooks'
import { extractIGId, isIGStoryLikeId } from '~/lib/url-detect'

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
  // 快拍族（单条 story / tray / 精选集列表）：请求发出前即可判定，决定骨架屏与 header 形态
  const storyLike = !!igId && isIGStoryLikeId(igId)

  // 翻译模式：local state，不依赖全局 Twitter 翻译 store
  const [translationMode, setTranslationMode] = useState<IGTranslationMode>('bilingual')

  // AI 配置（用于自动翻译 — 加载时附带 enableAITranslation）
  const aiConfigFromStore = useAIConfig()
  const resolved = useResolvedAIConfig()

  const aiConfig = {
    enableAITranslation: aiConfigFromStore.enableAITranslation,
    aiProvider: resolved.provider,
    apiKey: resolved.apiKey,
    model: resolved.model,
    thinkingLevel: resolved.thinkingLevel,
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

  const list = posts ?? []
  const primaryPost = list[0] ?? null
  // 快拍 / 精选集：下载优先的列表（无帖子截图/翻译操作）
  const isStoryList = list.length > 0 && list.every(isStoryPost)

  // 页面级操作：作用于首帖；普通帖子截图捕获 listRef 包裹的卡片
  const listRef = useRef<HTMLDivElement | null>(null)

  // IG 操作 hook
  const { downloadMedia, copyText, copyMarkdown, share } = useIGOperations(primaryPost)

  // 截图 hook（多卡捕获整列，单卡等价于原行为）
  const {
    handleScreenshot,
    shareScreenshot,
    isCapturing,
  } = useIGScreenshotAction({ post: primaryPost, captureRef: listRef })

  // 翻译完成回调（IGTranslateDialog 保存后触发，按 post.id 精确回写）
  const handleTranslated = (postId: string, captionTranslation: string) => {
    if (!igId)
      return

    // 该路由的列表可能含多张卡（tray / 精选集）：按 item id 匹配回写
    mutate(
      currentData => currentData?.map(p =>
        p.id === postId ? { ...p, captionTranslation } : p,
      ),
      { revalidate: false },
    )
  }

  // 共享的 header props
  const headerProps = {
    post: primaryPost,
    translationMode,
    onTranslationModeChange: setTranslationMode,
    isCapturing,
    onScreenshot: handleScreenshot,
    onShareScreenshot: shareScreenshot,
    onDownload: downloadMedia,
    onShare: share,
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

  // 加载中：快拍族用网格骨架，避免闪出帖子的九宫格 + 互动栏 + caption 行
  if (isLoading) {
    return (
      <>
        <IGHeader {...headerProps} storyMode={storyLike} />
        {storyLike
          ? <IGStoryListSkeleton className="mt-4" />
          : (
              <div className="flex flex-col gap-4">
                <IGPostSkeleton />
                <IGPostSkeleton />
              </div>
            )}
      </>
    )
  }

  // 错误 / 无数据
  if (error || list.length === 0) {
    console.error(error)
    return (
      <>
        <IGHeader {...headerProps} />
        <IGNotFound id={igId} />
      </>
    )
  }

  // 正常渲染：快拍/精选集 → 下载优先列表；普通帖子 → 单卡（header 操作）
  return (
    <>
      <IGHeader {...headerProps} storyMode={isStoryList} />
      {isStoryList
        ? <IGStoryList posts={list} className="mt-4" />
        : (
            <div ref={listRef} className="w-full">
              <IGPostList
                posts={list}
                translationMode={translationMode}
                onTranslated={handleTranslated}
                className="mt-4"
              />
            </div>
          )}
    </>
  )
}
