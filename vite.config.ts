import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// A leading dot allows the domain and all of its subdomains.
const ngrokHosts = [
  '.ngrok-free.app',
  '.ngrok-free.dev',
  '.ngrok.app',
  '.ngrok.dev',
  '.ngrok.io',
];

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    allowedHosts: ngrokHosts,
  },
  preview: {
    allowedHosts: ngrokHosts,
  },
});
