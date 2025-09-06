import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables based on the current mode (e.g., 'development', 'production')
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    // The `define` object is not needed if you're just accessing env variables.
    // They are automatically available on `import.meta.env`.
  }
})
