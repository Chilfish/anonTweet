import type { VisitedItem } from '~/lib/visited'
import { useEffect } from 'react'
import { useVisitedStore } from '~/lib/stores/visited'

/**
 * 详情页加载成功后就近记录一次访问（仅客户端，SSR 不写）。
 *
 * 依赖拆成原始字段而不是对象：调用方每次渲染都会新建对象，直接放进依赖会
 * 无限重写；同一 type + id 由 pushVisited 去重，字段变化只刷新内容与时间。
 */
export function useRecordVisit(item: Omit<VisitedItem, 'ts'> | null) {
  const record = useVisitedStore(state => state.record)

  const type = item?.type
  const id = item?.id
  const title = item?.title ?? ''
  const snippet = item?.snippet ?? ''
  const image = item?.image ?? ''

  useEffect(() => {
    if (!type || !id)
      return
    record({
      type,
      id,
      title,
      snippet: snippet || undefined,
      image: image || undefined,
    })
  }, [
    type,
    id,
    title,
    snippet,
    image,
    record,
  ])
}
