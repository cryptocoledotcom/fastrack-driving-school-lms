import path from 'path';
import { fileURLToPath } from 'url';

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ _mode, _command }) => {
  const defaultPort = process.env.VITE_USE_EMULATORS === 'true' ? 3001 : 3000;
  const port = parseInt(process.env.VITE_PORT || defaultPort, 10);

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
