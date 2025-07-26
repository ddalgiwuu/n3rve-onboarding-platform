import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: process.env.NODE_ENV === 'development',
    rollupOptions: {
      output: {
        // Force complete cache invalidation with timestamp + random
        entryFileNames: `assets/[name]-[hash]-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.js`,
        chunkFileNames: `assets/[name]-[hash]-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.js`,
        assetFileNames: `assets/[name]-[hash]-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.[ext]`,
        manualChunks: (id) => {
          // Vendor chunks for better caching and React compatibility
          if (id.includes('node_modules')) {
            // Highest priority: Keep React and React-DOM together to prevent dual instances
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-core'
            }
            // React-related libraries that depend on React context
            if (id.includes('react-router') || id.includes('react-hot-toast') || 
                id.includes('@tanstack/react-query') || id.includes('react-hook-form')) {
              return 'react-ecosystem'
            }
            // State management
            if (id.includes('@reduxjs/toolkit') || id.includes('react-redux')) {
              return 'state-vendor'
            }
            // UI libraries that might have React 19 compatibility issues
            if (id.includes('@formkit') || id.includes('@dnd-kit') || 
                id.includes('framer-motion') || id.includes('lucide-react')) {
              return 'ui-vendor'
            }
            // Utilities and other libraries
            return 'vendor'
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    minify: 'esbuild',
    target: 'esnext'
  },
  define: {
    // Ensure React is available globally during development
    global: 'globalThis',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@store': path.resolve(__dirname, './src/store'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils')
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false
      },
      '/socket.io': {
        target: 'http://localhost:5001',
        ws: true
      }
    }
  }
})