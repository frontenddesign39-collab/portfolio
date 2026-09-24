import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Client bundle only. The Worker (src/worker.ts) renders the HTML and is bundled by wrangler.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist/client',
    manifest: true,
    emptyOutDir: true,
    rollupOptions: { input: 'src/entry-client.tsx' },
  },
})
