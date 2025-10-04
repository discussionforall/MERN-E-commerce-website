import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  // 🔑 Important: ensures CSS/JS assets resolve correctly under Nginx/Docker
  base: "./",

  plugins: [react()],

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://192.168.1.29:5000',
        changeOrigin: true,
      },
    },
    allowedHosts: ['f6ee1c325d7a.ngrok-free.app'],
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'query-vendor': ['react-query'],
          'http-vendor': ['axios'],
          'socket-vendor': ['socket.io-client'],
          'stripe-vendor': ['@stripe/stripe-js', '@stripe/react-stripe-js'],
          'ui-vendor': ['lucide-react', 'react-hot-toast'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
    minify: 'esbuild',
  },
  
  define: {
    global: 'globalThis',
  },
  
  resolve: {
    alias: {
      react: 'react',
      'react-dom': 'react-dom',
    },
  },
  
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
});
