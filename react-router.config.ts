import type { Config } from '@react-router/dev/config'
import { vercelPreset } from '@vercel/react-router/vite'

const isInVercel = process.env.VERCEL === 'true'

const config: Config = {
  ssr: true,
  presets: [
    vercelPreset(),
  ],
  future: {
    v8_middleware: true,
    // unstable_viteEnvironmentApi: true,
  },
}

if (!isInVercel) {
  config.presets = []
}

export default config
