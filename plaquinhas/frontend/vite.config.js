import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // 5273 para não colidir com o fuzue, que usa a 5173 na mesma máquina
    port: 5273,
    // permite importar ../brand.config.json, na raiz do projeto
    fs: { allow: ['..'] },
    // em desenvolvimento, as chamadas /api e as imagens enviadas vão para o backend
    proxy: { '/api': 'http://localhost:4100', '/uploads': 'http://localhost:4100' },
  },
});
