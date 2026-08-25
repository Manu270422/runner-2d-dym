import { defineConfig } from 'vite';

export default defineConfig({
  // Yo configuro la carpeta public para que Vite sirva los assets sin procesar
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Yo mantengo el sourcemap en dev para depurar fácilmente
    sourcemap: false,
    rollupOptions: {
      output: {
        // Yo separo Phaser en su propio chunk para cacheo eficiente
        manualChunks: {
          phaser: ['phaser']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
