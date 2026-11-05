import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// A leading dot allows the domain and all of its subdomains.
const ngrokHosts = [
  '.ngrok-free.app',
  '.ngrok-free.dev',
  '.ngrok.app',
  '.ngrok.dev',
  '.ngrok.io',
];

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const proxy = { '/api': { target: env.API_PROXY_TARGET || 'http://127.0.0.1:8000', changeOrigin: true } };
  return {
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    allowedHosts: ngrokHosts,
    proxy,
  },
  preview: {
    allowedHosts: ngrokHosts,
    proxy,
  },
  };
});
