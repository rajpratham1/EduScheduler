import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'; // Import path module

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Set up an alias for the 'src' directory
      'src': path.resolve(__dirname, './src'),
    },
  },
})