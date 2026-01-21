// Nombre de la caché - versión específica
const CACHE_NAME = 'artcor-events-v2.0.1';
const STATIC_CACHE = 'static-artcor-v1';

// Archivos a cachear - rutas ABSOLUTAS para GitHub Pages
const urlsToCache = [
  '/artcor-events/',
  '/artcor-events/index.html',
  '/artcor-events/style.css',
  '/artcor-events/app.js',
  '/artcor-events/manifest.json',
  '/artcor-events/icon-144x144.png',
  '/artcor-events/icon-192x192.png',
  '/artcor-events/sw.js'
];

// Instalar Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Cache abierta:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[Service Worker] Todos los recursos cacheados');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[Service Worker] Error al cachear:', error);
      })
  );
});

// Activar y limpiar cachés viejas
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activado');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          // Eliminar cachés que no sean la actual
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Eliminando caché antigua:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      // Tomar control inmediato de los clients
      return self.clients.claim();
    })
  );
});

// Estrategia: Cache First, luego Network
self.addEventListener('fetch', event => {
  // Solo manejar solicitudes GET y del mismo origen (artcor-events)
  if (event.request.method !== 'GET' || !event.request.url.includes('artcor-events')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si está en caché, devolverlo
        if (response) {
          return response;
        }

        // Si no está en caché, hacer fetch y cachear
        return fetch(event.request)
          .then(response => {
            // Verificar que la respuesta sea válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clonar la respuesta para cachear
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(error => {
            console.error('[Service Worker] Error en fetch:', error);
            // Puedes devolver una página offline aquí si lo deseas
            // return caches.match('/artcor-events/offline.html');
          });
      })
  );
});

// Manejar mensajes desde la app (opcional)
self.addEventListener('message', event => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
