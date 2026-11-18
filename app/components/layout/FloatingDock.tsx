import { Home, Search, Settings } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { SettingsPanel } from '~/components/settings/SettingsPanel'
import { cn } from '~/lib/utils'

/** 下滑收起、顶部或上滑时出现；避免阅读时被常驻控件挡住 */
function useHideOnScroll() {
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      if (y < 80) {
        setHidden(false)
      }
      else if (Math.abs(y - lastY.current) > 8) {
        setHidden(y > lastY.current)
      }
      lastY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return hidden
}

const ITEM_CLASS = 'grid size-8 place-items-center rounded-full text-muted-foreground transition-all hover:bg-muted/60 hover:text-foreground active:scale-95'

/**
 * 底部悬浮控件簇：全站唯一的常驻导航（首页 / 搜索 / 设置）。
 * 不用通栏 header，材质只包住控件本身，内容区保持完整。
 */
export function FloatingDock() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const hidden = useHideOnScroll()
  const { pathname } = useLocation()

  return (
    <div
      className={cn(
        'fixed inset-x-0 z-40 flex justify-center transition-transform duration-300 ease-out',
        'bottom-[calc(env(safe-area-inset-bottom,0px)+1rem)]',
        hidden && 'translate-y-24',
      )}
    >
      <nav
        aria-label="站点导航"
        className="flex items-center gap-0.5 rounded-full border border-border/50 bg-background/80 px-1.5 py-1.5 shadow-lg shadow-black/5 backdrop-blur-xl"
      >
        <Link
          to="/"
          aria-label="首页"
          title="首页"
          className={cn(ITEM_CLASS, pathname === '/' && 'bg-muted/60 text-foreground')}
        >
          <Home className="size-4" aria-hidden />
        </Link>
        <Link
          to="/search"
          aria-label="搜索推文"
          title="搜索推文"
          className={cn(ITEM_CLASS, pathname === '/search' && 'bg-muted/60 text-foreground')}
        >
          <Search className="size-4" aria-hidden />
        </Link>
        <button
          type="button"
          aria-label="设置"
          title="设置"
          onClick={() => setSettingsOpen(true)}
          className={ITEM_CLASS}
        >
          <Settings className="size-4" aria-hidden />
        </button>
      </nav>

      <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  )
}
