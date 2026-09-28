import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // allow importing ../brand.config.json from the project root
    fs: { allow: ['..'] },
    // during development, /api calls and uploaded images go to the backend
    proxy: { '/api': 'http://localhost:4000', '/uploads': 'http://localhost:4000' },
  },
});
