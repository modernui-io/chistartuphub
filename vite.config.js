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
      minify: 'esbuild', // Back to esbuild for stability
      rollupOptions: {
        output: {
          manualChunks: {
            // Core React libraries
            vendor: ['react', 'react-dom', 'react-router-dom'],
            // Framer Motion (lazy-loaded via LazyMotion domAnimation)
            'framer-motion': ['framer-motion'],
            // GSAP is dynamically imported in SmoothScrollProvider — keep it in its own chunk
            gsap: ['gsap'],
            // Radix UI — Overlay components (dialogs, popovers, tooltips, menus)
            'ui-overlay': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-popover',
              '@radix-ui/react-tooltip',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-hover-card',
              '@radix-ui/react-alert-dialog',
              '@radix-ui/react-context-menu',
            ],
            // Radix UI — Form components (inputs, toggles, selectors)
            'ui-form': [
              '@radix-ui/react-checkbox',
              '@radix-ui/react-radio-group',
              '@radix-ui/react-select',
              '@radix-ui/react-switch',
              '@radix-ui/react-slider',
              '@radix-ui/react-toggle',
              '@radix-ui/react-toggle-group',
              '@radix-ui/react-label',
            ],
            // Radix UI — Navigation components (tabs, accordions, menus)
            'ui-nav': [
              '@radix-ui/react-navigation-menu',
              '@radix-ui/react-tabs',
              '@radix-ui/react-accordion',
              '@radix-ui/react-collapsible',
              '@radix-ui/react-menubar',
            ],
            // Radix UI — Core primitives (layout, utilities)
            'ui-core': [
              '@radix-ui/react-avatar',
              '@radix-ui/react-aspect-ratio',
              '@radix-ui/react-separator',
              '@radix-ui/react-scroll-area',
              '@radix-ui/react-progress',
              '@radix-ui/react-slot',
            ],
            // Supabase
            supabase: ['@supabase/supabase-js'],
            // Query + State
            query: ['@tanstack/react-query'],
            // Utils
            utils: ['clsx', 'tailwind-merge', 'class-variance-authority', 'date-fns'],
          }
        }
      }
    }
  }
});
