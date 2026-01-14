// Offline Database Manager using IndexedDB
class OfflineDatabase {
  constructor() {
    this.dbName = 'PharmacyDB';
    this.version = 1;
    this.db = null;
    this.available = typeof indexedDB !== 'undefined';
    if (this.available) {
      this.init();
    }
  }

  async init() {
    if (!this.available) return Promise.resolve(null);
    
    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(this.dbName, this.version);

        request.onerror = () => {
          console.error('IndexedDB error:', request.error);
          this.available = false;
          reject(request.error);
        };

        request.onsuccess = () => {
          this.db = request.result;
          console.log('IndexedDB initialized');
          resolve(this.db);
        };

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          
          // Create object stores if they don't exist
          if (!db.objectStoreNames.contains('medicines')) {
            db.createObjectStore('medicines', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('sales')) {
            db.createObjectStore('sales', { keyPath: 'id', autoIncrement: true });
          }
          if (!db.objectStoreNames.contains('customers')) {
            db.createObjectStore('customers', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('offlineSalesQueue')) {
            db.createObjectStore('offlineSalesQueue', { keyPath: 'timestamp' });
          }
          if (!db.objectStoreNames.contains('metadata')) {
            db.createObjectStore('metadata', { keyPath: 'key' });
          }
          
          console.log('IndexedDB stores created');
        };
      } catch (err) {
        console.error('IndexedDB initialization error:', err);
        this.available = false;
        reject(err);
      }
    });
  }

  // Save medicine locally
  async saveMedicine(medicine) {
    const transaction = this.db.transaction(['medicines'], 'readwrite');
    const store = transaction.objectStore('medicines');
    return new Promise((resolve, reject) => {
      const request = store.put(medicine);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get all cached medicines
  async getMedicines() {
    const transaction = this.db.transaction(['medicines'], 'readonly');
    const store = transaction.objectStore('medicines');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get single medicine
  async getMedicine(id) {
    const transaction = this.db.transaction(['medicines'], 'readonly');
    const store = transaction.objectStore('medicines');
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Queue offline sale
  async queueSale(saleData) {
    const transaction = this.db.transaction(['offlineSalesQueue'], 'readwrite');
    const store = transaction.objectStore('offlineSalesQueue');
    const queueItem = {
      ...saleData,
      timestamp: Date.now(),
      synced: false
    };
    return new Promise((resolve, reject) => {
      const request = store.add(queueItem);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get all queued sales
  async getQueuedSales() {
    const transaction = this.db.transaction(['offlineSalesQueue'], 'readonly');
    const store = transaction.objectStore('offlineSalesQueue');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result.filter(s => !s.synced));
      request.onerror = () => reject(request.error);
    });
  }

  // Mark sale as synced
  async markSaleSynced(timestamp) {
    const transaction = this.db.transaction(['offlineSalesQueue'], 'readwrite');
    const store = transaction.objectStore('offlineSalesQueue');
    return new Promise((resolve, reject) => {
      const getRequest = store.get(timestamp);
      getRequest.onsuccess = () => {
        const sale = getRequest.result;
        if (sale) {
          sale.synced = true;
          const updateRequest = store.put(sale);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Clear all queued sales
  async clearSalesQueue() {
    const transaction = this.db.transaction(['offlineSalesQueue'], 'readwrite');
    const store = transaction.objectStore('offlineSalesQueue');
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Save metadata (last sync time, etc)
  async setMetadata(key, value) {
    const transaction = this.db.transaction(['metadata'], 'readwrite');
    const store = transaction.objectStore('metadata');
    return new Promise((resolve, reject) => {
      const request = store.put({ key, value });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get metadata
  async getMetadata(key) {
    const transaction = this.db.transaction(['metadata'], 'readonly');
    const store = transaction.objectStore('metadata');
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result?.value);
      request.onerror = () => reject(request.error);
    });
  }
}

// Global instance
const offlineDB = new OfflineDatabase();
