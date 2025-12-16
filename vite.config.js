import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  // Port 3001 for emulators mode, 3000 for production (default)
  const port = mode === 'emulators' ? 3001 : 3000;

  return {
    plugins: [react()],
    server: {
      port,
      strictPort: false,
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
