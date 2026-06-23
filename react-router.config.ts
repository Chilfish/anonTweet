import type { Config } from '@react-router/dev/config'
import { vercelPreset } from '@vercel/react-router/vite'

const isInVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true'

const config: Config = {
  ssr: true,
  presets: [
    vercelPreset(),
  ],
  future: {
  },
}

if (!isInVercel) {
  config.presets = []
}

export default config
