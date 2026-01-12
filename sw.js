const CACHE_NAME = 'runner2d-v1';

// LISTA CRÍTICA: Aquí deben estar TODOS los archivos que tu juego necesita para arrancar.
// Agregué las carpetas 'entities' y los iconos que configuramos antes.
const FILES_TO_CACHE = [
  './',
  './index.html',
  './offline.html',
  './manifest.json',
  
  // Módulos del Sistema
  './src/main.js',
  './src/system/Game.js',
  './src/system/UI.js',
  './src/system/Audio.js',
  './src/system/Storage.js',
  './src/system/Particles.js', // ¡Faltaba este!
  
  // Escenas y Entidades
  './src/scenes/SceneRunner.js',
  './src/entities/Player.js',         // ¡Faltaba este!
  './src/entities/ShieldPowerUp.js',  // ¡Faltaba este!

  // Recursos (Assets)
  './assets/audio/jump.wav',
  './assets/audio/hit.wav',
  './assets/images/logo.png',
  './assets/icons/icon-192.png' // Importante para el install prompt
];

// 1. INSTALACIÓN: Descarga los archivos al caché
self.addEventListener('install', e => {
  console.log('[SW] Instalando versión:', CACHE_NAME);
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Cacheando archivos...');
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(() => self.skipWaiting()) // Fuerza al SW a activarse de una vez
  );
});

// 2. ACTIVACIÓN: Limpia cachés viejos (Vital para cuando actualices el juego)
self.addEventListener('activate', e => {
  console.log('[SW] Activado');
  e.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        if (key !== CACHE_NAME) {
          console.log('[SW] Borrando caché antiguo:', key);
          return caches.delete(key);
        }
      }));
    })
    .then(() => self.clients.claim()) // Toma control de la página inmediatamente
  );
});

// 3. INTERCEPTOR (FETCH): Estrategia "Network First, falling back to Cache"
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request)
      .catch(() => {
        // Si no hay internet, buscamos en caché
        return caches.match(e.request).then(response => {
          if (response) {
            return response;
          }
          // Si no está en caché y es una navegación (HTML), damos offline.html
          if (e.request.mode === 'navigate') {
            return caches.match('./offline.html');
          }
        });
      })
  );
});