import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode, command }) => {
  // Development always uses 3001 (for Firebase emulators)
  // Production build uses 3000
  const port = command === 'serve' ? 3001 : 3000;

  return {
    plugins: [react()],
    server: {
      port,
      strictPort: true,
      open: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});
