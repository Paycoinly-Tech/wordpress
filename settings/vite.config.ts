import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  },
  build: {
    lib: {
      entry: './src/main.tsx',
      name: 'settings',
      fileName: () => 'settings.js',
      formats: ['iife']
    },
    outDir: '../js',
    target: 'esnext'
  }
})
