import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // relative base: the built game runs from any folder or static host
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: {
          framework: ['react', 'react-dom'],
          math: ['katex'],
        },
      },
    },
  },
  server: { host: '127.0.0.1', port: 8765, strictPort: true },
  test: { environment: 'jsdom', include: ['tests/**/*.test.ts'] },
});
