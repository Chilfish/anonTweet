import type { Config } from '@react-router/dev/config'
import { vercelPreset } from '@vercel/react-router/vite'

export default {
  // Config options...
  // Server-side render by default, to enable SPA mode set this to `false`
  ssr: true,
  presets: [vercelPreset],
  future: {
    v8_middleware: true,
    unstable_viteEnvironmentApi: true,
  },
} satisfies Config
