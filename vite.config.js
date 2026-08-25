import { defineConfig } from 'vite';

export default defineConfig({
  // Yo uso la raíz porque mi juego se publica directamente
  // en mi dominio personalizado: runner.elmundodemanu.com
  base: '/',

  // Yo configuro la carpeta public para que Vite sirva
  // los assets estáticos sin procesarlos.
  publicDir: 'public',

  build: {
    outDir: 'dist',
    assetsDir: 'assets',

    // Yo mantengo el sourcemap desactivado para producción.
    sourcemap: false,

    rollupOptions: {
      output: {
        // Yo separo Phaser en su propio chunk
        // para mejorar el cacheo de los archivos.
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