import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    set => ({
      theme: 'system',
      setTheme: theme => set({ theme }),
    }),
    {
      name: 'theme-store',
    },
  ),
)

// 便捷的 hook
export function useTheme() {
  const theme = useThemeStore(state => state.theme)
  const setTheme = useThemeStore(state => state.setTheme)
  return { theme, setTheme }
}
