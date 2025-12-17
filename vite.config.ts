import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Vercel injects env vars at build time. This inlines it for the client.
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
});