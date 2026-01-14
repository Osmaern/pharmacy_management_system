// Service Worker for offline functionality
const CACHE_NAME = 'pharmacy-v1';
const STATIC_ASSETS = [
  '/',
  '/static/animations.css',
  '/static/animations.js',
  '/static/offline.html',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js'
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).catch((err) => console.log('Service Worker: Install error', err))
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // For HTML pages: network first, fallback to cache
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const cloneResponse = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, cloneResponse);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache for HTML
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match('/static/offline.html');
          });
        })
    );
    return;
  }

  // For static assets: cache first, fallback to network
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok && (request.url.includes('static') || request.url.includes('cdn'))) {
            const cloneResponse = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, cloneResponse);
            });
          }
          return response;
        })
        .catch(() => {
          // Return offline placeholder for failed requests
          return new Response('Offline - Resource not available', {
            status: 503,
            statusText: 'Service Unavailable'
          });
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
