const CACHE_NAME = 'event-manager-kpop-v2';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/manifest.json',
    '/icon-144x144.png',
    '/icon-192x192.png'
];

// Instalar Service Worker
self.addEventListener('install', event => {
    console.log('[Service Worker] Instalando...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] Cacheando archivos esenciales');
                return cache.addAll(urlsToCache)
                    .then(() => {
                        console.log('[Service Worker] Todos los recursos han sido cacheados');
                        return self.skipWaiting();
                    })
                    .catch(error => {
                        console.log('[Service Worker] Error al cachear:', error);
                    });
            })
    );
});

// Activar Service Worker
self.addEventListener('activate', event => {
    console.log('[Service Worker] Activando...');
    // Limpiar caches antiguos
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Eliminando cache antiguo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[Service Worker] Ahora está activo!');
            return self.clients.claim();
        })
    );
});

// Interceptar solicitudes
self.addEventListener('fetch', event => {
    // Solo manejar solicitudes GET
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                // Si hay respuesta en cache, devolverla
                if (cachedResponse) {
                    console.log('[Service Worker] Sirviendo desde cache:', event.request.url);
                    return cachedResponse;
                }

                // Si no está en cache, hacer la solicitud a la red
                console.log('[Service Worker] Haciendo fetch a la red:', event.request.url);
                return fetch(event.request)
                    .then(networkResponse => {
                        // Verificar si la respuesta es válida
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        // Clonar la respuesta
                        const responseToCache = networkResponse.clone();

                        // Agregar al cache
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                                console.log('[Service Worker] Cacheado nuevo recurso:', event.request.url);
                            });

                        return networkResponse;
                    })
                    .catch(error => {
                        console.log('[Service Worker] Fetch falló:', error);
                        // Podrías devolver una página offline personalizada aquí
                        // Por ejemplo: return caches.match('/offline.html');
                    });
            })
    );
});

// Manejar mensajes
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
