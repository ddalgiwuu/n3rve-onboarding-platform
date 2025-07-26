import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({
    // React 19 compatibility settings
    jsxRuntime: 'automatic',
    babel: {
      // Better React 19 support
      parserOpts: {
        plugins: ['jsx', 'typescript']
      },
      // Add babel configuration for better compatibility
      plugins: [
        ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }]
      ]
    }
  })],
  build: {
    sourcemap: true, // Always enable sourcemaps for debugging
    rollupOptions: {
      output: {
        // Add timestamp to force cache invalidation
        entryFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
        chunkFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
        assetFileNames: `assets/[name]-[hash]-${Date.now()}.[ext]`,
        // Disable all code splitting for debugging
        manualChunks: undefined,
        // Use IIFE format for better compatibility
        format: 'es'
      }
    },
    chunkSizeWarningLimit: 2000,
    // DISABLE MINIFICATION COMPLETELY
    minify: false,
    // Target modern browsers
    target: 'es2015',
    // Ensure proper module format
    modulePreload: {
      polyfill: true
    }
  },
  define: {
    // Ensure React is available globally
    global: 'globalThis',
  },
  optimizeDeps: {
    // Pre-bundle React dependencies
    include: ['react', 'react-dom', 'react-router-dom'],
    // Force ESM for all dependencies
    esbuildOptions: {
      target: 'es2020'
    }
  },
  resolve: {
    // Move dedupe here (correct location)
    dedupe: ['react', 'react-dom'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@store': path.resolve(__dirname, './src/store'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
      // Ensure all React imports point to the same instance
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom')
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