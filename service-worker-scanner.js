// Service Worker pour ScanExcel
const CACHE_NAME = 'scanexcel-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  'https://cdn.jsdelivr.net/npm/@ericblade/quagga2@1.8.4/dist/quagga.min.js',
  'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'
];

self.addEventListener('install', (event) => {
  console.log('[SW] Installation');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Mise en cache');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .catch((err) => console.log('[SW] Erreur cache:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activation');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          if (event.request.headers.get('accept').includes('text/html')) {
            return new Response(
              `<!DOCTYPE html>
              <html>
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Hors ligne - ScanExcel</title>
                <style>
                  body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                    background: #f5f5f5;
                    color: #333;
                  }
                  .offline-icon { font-size: 80px; margin-bottom: 20px; }
                  h1 { font-size: 24px; margin-bottom: 10px; }
                  p { color: #666; text-align: center; padding: 0 20px; }
                  button {
                    margin-top: 20px;
                    padding: 12px 24px;
                    background: #34C759;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    cursor: pointer;
                  }
                </style>
              </head>
              <body>
                <div class="offline-icon">📡</div>
                <h1>Vous êtes hors ligne</h1>
                <p>Vérifiez votre connexion et réessayez</p>
                <button onclick="window.location.reload()">Réessayer</button>
              </body>
              </html>`,
              { headers: { 'Content-Type': 'text/html' } }
            );
          }
        });
      })
  );
});