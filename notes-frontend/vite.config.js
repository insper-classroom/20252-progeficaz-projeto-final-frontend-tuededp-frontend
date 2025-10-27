import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => {
          // Split path and query
          const [basePath, query] = path.split('?');
          // Add trailing slash to base path only
          const newPath = basePath.endsWith('/') ? basePath : `${basePath}/`;
          // Recombine with query if it exists
          return query ? `${newPath}?${query}` : newPath;
        },
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
          });
        }
      }
    }
  }
})
