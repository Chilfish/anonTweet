import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
   ssr: {
        noExternal: ['react-tweet'],
   },
   server: {
     proxy: {
          '/api': {
            target: 'https://syndication.twitter.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
          }
     }
   }
})
