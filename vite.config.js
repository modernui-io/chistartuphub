import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualEditPlugin } from './vite-plugins/visual-edit-plugin.js'
import { errorOverlayPlugin } from './vite-plugins/error-overlay-plugin.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [
      mode === 'development' && visualEditPlugin(),
      react(),
      errorOverlayPlugin(),
      {
        name: 'iframe-hmr',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            // Allow iframe embedding
            res.setHeader('X-Frame-Options', 'ALLOWALL');
            res.setHeader('Content-Security-Policy', "frame-ancestors *;");
            next();
          });
        }
      }
    ].filter(Boolean),
    server: {
      host: '0.0.0.0', // Bind to all interfaces for container access
      port: 5173,
      strictPort: true,
      // Allow all hosts - essential for Modal tunnel URLs
      allowedHosts: true,
      watch: {
        // Enable polling for better file change detection in containers
        usePolling: true,
        interval: 100, // Check every 100ms for responsive HMR
      },
      hmr: {
        protocol: 'wss',
        clientPort: 443
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
      extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json']
    },
    optimizeDeps: {
      include: ['react', 'react-dom'],
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
      },
    },
    build: {
      sourcemap: false,
      minify: 'terser', // Better compression than esbuild
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          passes: 2, // Multiple passes for better compression
        },
      },
      rollupOptions: {
        output: {
          // More aggressive code splitting
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              // Split by library for better caching
              if (id.includes('react') && !id.includes('react-router')) {
                return 'react-core';
              }
              if (id.includes('react-router')) {
                return 'react-router';
              }
              if (id.includes('framer-motion')) {
                return 'animation';
              }
              if (id.includes('gsap')) {
                return 'gsap';
              }
              if (id.includes('@supabase')) {
                return 'supabase';
              }
              if (id.includes('leaflet') || id.includes('react-leaflet')) {
                return 'maps';
              }
              if (id.includes('@radix-ui') || id.includes('lucide-react')) {
                return 'ui';
              }
              if (id.includes('recharts')) {
                return 'charts';
              }
              return 'vendor';
            }
            
            // Split heavy pages
            if (id.includes('/pages/Profile')) return 'page-profile';
            if (id.includes('/pages/Resources')) return 'page-resources';
            if (id.includes('/pages/Opportunities')) return 'page-opportunities';
            if (id.includes('/pages/SavedResources')) return 'page-saved';
          },
          // Optimize chunk names for caching
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
        }
      },
      // Smaller chunks for faster initial load
      chunkSizeWarningLimit: 500,
    }
  }
});