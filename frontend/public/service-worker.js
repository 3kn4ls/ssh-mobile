/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'ssh-mobile-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/css/main.css',
  '/static/js/bundle.js',
  '/static/js/main.chunk.js',
  '/static/js/vendors~main.chunk.js',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png'
];

// Instalación del service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache).catch(err => {
          console.log('Error caching:', err);
        });
      })
  );
  self.skipWaiting();
});

// Activación del service worker
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interceptar peticiones
self.addEventListener('fetch', (event) => {
  // No cachear WebSocket ni peticiones al backend
  if (event.request.url.includes('ws://') ||
      event.request.url.includes('wss://') ||
      event.request.url.includes(':3001')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - retornar respuesta
        if (response) {
          return response;
        }

        return fetch(event.request).then((response) => {
          // Verificar si es una respuesta válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clonar respuesta
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(() => {
          // Si falla la red, intentar retornar index.html desde cache
          return caches.match('/index.html');
        });
      })
  );
});

// Manejar mensajes
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
