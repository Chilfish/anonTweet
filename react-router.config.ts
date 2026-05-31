import type { Config } from '@react-router/dev/config'
import { vercelPreset } from '@vercel/react-router/vite'

const isInVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true'

const config: Config = {
  ssr: true,
  presets: [
    vercelPreset(),
  ],
  future: {
    v8_middleware: true,
    v8_splitRouteModules: true,
    v8_viteEnvironmentApi: true,
    v8_passThroughRequests: true,
    v8_trailingSlashAwareDataRequests: true,
  },
}

if (!isInVercel) {
  config.presets = []
}

export default config
