const SECTION_LABELS: Record<string, string> = {
  tweets: '推文',
  ins: 'Instagram',
  article: '长文',
  search: '搜索',
  list: 'List',
  bili: '动态发布',
}

/** 当前路由所属栏目（用于日付线/外壳），未知路径返回空串 */
export function sectionLabel(pathname: string): string {
  if (pathname === '/')
    return ''
  const section = pathname.split('/')[1] ?? ''
  return SECTION_LABELS[section] ?? ''
}
