/**
 * 快拍查看器 / 网格选择 —— 纯逻辑（无 React / DOM 依赖）。
 *
 * 组件只负责渲染与事件接线；环形步进、序号夹取、选择集合的不可变更新都收敛在此，
 * 以便在 node 环境的验收层直接断言（仓库没有 DOM 测试环境，见 AC-IG-STORY-007）。
 */

/** 查看器切条方向：-1 上一条，1 下一条。 */
export type StoryViewerDirection = 1 | -1

/**
 * 环形步进（末条 → 首条，首条 → 末条）。
 *
 * 只有 0/1 条时恒为 0 —— 单条快拍没有可切换的邻条。
 */
export function stepViewerIndex(
  current: number,
  total: number,
  direction: StoryViewerDirection,
): number {
  if (total <= 1)
    return 0

  return ((current + direction) % total + total) % total
}

/** 把序号夹取到 `[0, total-1]`（打开第 k 格时用）；空列表返回 0。 */
export function clampViewerIndex(index: number, total: number): number {
  if (total <= 0)
    return 0

  return Math.min(Math.max(index, 0), total - 1)
}

/** 网格多选动作。 */
export type StorySelectionAction
  = | { type: 'toggle', id: string }
    | { type: 'set', ids: string[] }
    | { type: 'clear' }

/**
 * 选择集合 reducer（不可变：每次都返回新 Set，原 state 不被改动）。
 *
 * 与 `useReducer` 搭配；`set` 用于全选，`clear` 用于取消全选与退出选择态。
 */
export function storySelectionReducer(
  state: ReadonlySet<string>,
  action: StorySelectionAction,
): Set<string> {
  if (action.type === 'toggle') {
    const next = new Set(state)
    if (next.has(action.id))
      next.delete(action.id)
    else
      next.add(action.id)
    return next
  }

  if (action.type === 'set')
    return new Set(action.ids)

  return new Set()
}
