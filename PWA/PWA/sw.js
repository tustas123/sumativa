// Asignar un nombre y versión al caché
const CACHE_NAME = 'v1_pwa_app_cache';
const urlsToCache = [
  './',
  'index.html',
  'css/style.css',
];

// Durante la fase de instalación, generalmente se almacenan en caché los activos estáticos
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return Promise.all(
          urlsToCache.map(url => {
            return fetch(url)
              .then(response => {
                if (!response.ok) {
                  throw new Error(`Failed to fetch: ${url}`);
                }
                return cache.put(url, response);
              })
              .catch(err => console.error(`Error al almacenar en caché ${url}`, err));
          })
        )
        .then(() => self.skipWaiting())
        .catch(err => console.error('Error en la instalación del cache', err));
      })
  );
});

// Una vez que se instala el SW, se activa y busca los recursos para hacer que funcione sin conexión
self.addEventListener('activate', e => {
  const cacheWhitelist = [CACHE_NAME];

  e.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
      .catch(err => console.error('Error en la activación del cache', err))
  );
});

// Cuando el navegador recupera una URL
self.addEventListener('fetch', e => {
  // Responder ya sea con el objeto en caché o continuar y buscar la URL real
  e.respondWith(
    caches.match(e.request)
      .then(res => {
        if (res) {
          // Recuperar del caché
          return res;
        }
        // Recuperar de la petición a la URL
        return fetch(e.request)
          .then(response => {
            // Verificar si la respuesta es válida antes de almacenarla en el caché
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clonar la respuesta para que pueda ser almacenada en el caché y servida
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(e.request, responseToCache);
              });

            return response;
          })
          .catch(err => {
            console.error('Falló algo al solicitar recursos', err);
            // Puedes devolver una respuesta de fallback aquí si deseas
          });
      })
      .catch(err => console.error(`Error al recuperar del caché ${e.request.url}`, err))
  );
});