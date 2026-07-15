import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/team-clock/',
  build: {
    rollupOptions: {
      // Multi-page build: landing page at /, the app at /app/
      input: {
        landing: 'index.html',
        app: 'app/index.html',
      },
    },
  },
})
