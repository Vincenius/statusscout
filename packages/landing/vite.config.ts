// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import Pages from 'vite-plugin-pages'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [
    react(),
    Pages({
      dirs: 'src/pages',
      extensions: ['jsx', 'tsx'],
      // Sync mode is required for SSR renderToString — no React.lazy, all routes loaded eagerly.
      // Fine for a small landing page with few routes.
      importMode: 'sync',
    }),
    ViteImageOptimizer({}),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
  },
  // react-helmet-async v2 is CJS — bundle it into the SSR output to avoid Node.js named-export failure
  ssr: isSsrBuild ? { noExternal: ['react-helmet-async'] } : {},
}));
