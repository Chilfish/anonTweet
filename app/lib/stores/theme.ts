import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'

export interface ThemeSettings {
  theme: Theme
  showActions: boolean
}

interface ThemeState extends ThemeSettings {
  setTheme: (theme: Theme) => void
  setShowActions: (showActions: boolean) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    set => ({
      theme: 'system',
      showActions: false,

      setTheme: theme => set({ theme }),
      setShowActions: showActions => set({ showActions }),
    }),
    {
      name: 'theme-store',
      version: 1,
    },
  ),
)

// 便捷的 hook
export function useTheme() {
  const theme = useThemeStore(state => state.theme)
  const setTheme = useThemeStore(state => state.setTheme)
  return { theme, setTheme }
}
