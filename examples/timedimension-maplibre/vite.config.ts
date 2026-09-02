import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  server: {
    port: 4200
  },
  resolve: {
    alias: [
      {
        find: 'timedimension',
        replacement: fileURLToPath(
          new URL('../../src/index.ts', import.meta.url)
        ),
      },
    ],
  },
})
