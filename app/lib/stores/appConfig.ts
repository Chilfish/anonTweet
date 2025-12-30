import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'

export interface AppConfigs {
  theme: Theme
  showActions: boolean
  enableMediaProxy: boolean
  mediaProxyUrl: string
}

interface AppConfigState extends AppConfigs {
  setTheme: (theme: Theme) => void
  setShowActions: (showActions: boolean) => void

  setEnableMediaProxy: (enableMediaProxy: boolean) => void
  setMediaProxyUrl: (mediaProxyUrl: string) => void
}

export const useAppConfigStore = create<AppConfigState>()(
  persist(
    set => ({
      theme: 'light',
      showActions: false,
      enableMediaProxy: false,
      mediaProxyUrl: 'https://proxy.chilfish.top/',

      setEnableMediaProxy: enableMediaProxy => set({ enableMediaProxy }),
      setMediaProxyUrl: mediaProxyUrl => set({ mediaProxyUrl }),
      setTheme: theme => set({ theme }),
      setShowActions: showActions => set({ showActions }),
    }),
    {
      name: 'app-config-store',
      version: 1,
    },
  ),
)

export function useProxyMedia() {
  const enableMediaProxy = useAppConfigStore(s => s.enableMediaProxy)
  const mediaProxyUrl = useAppConfigStore(s => s.mediaProxyUrl)

  return (url: string) => {
    if (!enableMediaProxy)
      return url
    return `${mediaProxyUrl}${url}`
  }
}
