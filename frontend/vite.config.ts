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
    sourcemap: process.env.NODE_ENV === 'development',
    rollupOptions: {
      output: {
        // Simplified file naming with hash only
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // Keep React ecosystem unified
            if (id.includes('react') || id.includes('react-dom') ||
                id.includes('react-router') || id.includes('react-hot-toast') || 
                id.includes('@tanstack/react-query') || id.includes('react-hook-form') ||
                id.includes('@formkit') || id.includes('@dnd-kit') || 
                id.includes('framer-motion') || id.includes('lucide-react') ||
                id.includes('@reduxjs/toolkit') || id.includes('react-redux')) {
              return 'react-all'
            }
            return 'vendor'
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    // Change minification to terser for better React 19 compatibility
    minify: 'terser',
    terserOptions: {
      compress: {
        // Preserve console logs for debugging
        drop_console: false,
        drop_debugger: false,
        // Avoid breaking React 19 internals
        keep_infinity: true,
        passes: 1
      },
      mangle: {
        // Don't mangle React internals
        reserved: ['React', 'createContext', 'useState', 'useEffect', 'useContext']
      },
      format: {
        // Better compatibility with React 19
        comments: false,
        // Prevent IIFE wrapping issues
        wrap_iife: false
      }
    },
    // Target ES2020 for better compatibility
    target: 'es2020'
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