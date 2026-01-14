// Service Worker for offline functionality
const CACHE_NAME = 'pharmacy-cache-v3';
const ASSETS_TO_CACHE = [
  '/',
  '/static/animations.css',
  '/static/animations.js',
  '/static/offline-db.js',
  '/static/offline-manager.js',
  '/static/manifest.json',
  '/static/offline.html',
];

// Install - cache core assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching core assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .catch((err) => {
        console.error('[SW] Cache install error:', err);
      })
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and non-http(s)
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // For HTML requests: network first, fallback to cache
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful HTML responses
          if (response && response.status === 200) {
            const cloneResponse = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, cloneResponse);
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed - try cache
          return caches.match(request)
            .then((cached) => cached || caches.match('/static/offline.html'));
        })
    );
    return;
  }

  // For other requests: cache first, then network
  event.respondWith(
    caches.match(request)
      .then((cached) => {
        if (cached) {
          // Return from cache but fetch fresh in background
          if (!request.url.includes('/api/')) {
            fetch(request).then((response) => {
              if (response && response.status === 200) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, response.clone());
                });
              }
            }).catch(() => {});
          }
          return cached;
        }

        // Not in cache - fetch from network
        return fetch(request)
          .then((response) => {
            // Cache successful responses
            if (response && response.status === 200) {
              const cloneResponse = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, cloneResponse);
              });
            }
            return response;
          })
          .catch(() => {
            // Return offline page as fallback
            return caches.match('/static/offline.html');
          });
      })
  );
});

// Background sync for offline requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-sales') {
    event.waitUntil(syncOfflineSales());
  }
});

// Sync offline sales data when connection restored
async function syncOfflineSales() {
  try {
    const db = await openDB();
    const offlineSales = await getAllFromStore(db, 'offlineSales');
    
    for (const sale of offlineSales) {
      try {
        const response = await fetch('/sales/new', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sale)
        });
        
        if (response.ok) {
          await deleteFromStore(db, 'offlineSales', sale.id);
        }
      } catch (err) {
        console.log('Sync error for sale', sale.id, err);
      }
    }
  } catch (err) {
    console.log('Background sync failed', err);
  }
}

// IndexedDB helpers
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('PharmacyDB', 1);
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('offlineSales')) {
        db.createObjectStore('offlineSales', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('medicines')) {
        db.createObjectStore('medicines', { keyPath: 'id' });
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAllFromStore(db, storeName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function deleteFromStore(db, storeName, key) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
