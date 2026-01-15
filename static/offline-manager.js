// Offline Detection and Sync Manager
class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.syncing = false;
    try {
      this.init();
    } catch (err) {
      console.warn('OfflineManager initialization error:', err);
    }
  }

  init() {
    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
    
    // Show/hide offline banner
    this.updateOfflineBanner();
    
    // Attempt sync on page load if online
    if (this.isOnline) {
      setTimeout(() => this.syncOfflineData(), 1000);
    }
  }

  handleOnline() {
    this.isOnline = true;
    console.log('✓ Back online');
    this.updateOfflineBanner();
    this.syncOfflineData();
  }

  handleOffline() {
    this.isOnline = false;
    console.log('✗ Gone offline');
    this.updateOfflineBanner();
  }

  updateOfflineBanner() {
    let banner = document.getElementById('offline-banner');
    
    if (!this.isOnline) {
      if (!banner) {
        banner = document.createElement('div');
        banner.id = 'offline-banner';
        banner.className = 'alert alert-warning alert-dismissible fade show m-0';
        banner.role = 'alert';
        banner.style.borderRadius = '0';
        banner.style.borderBottom = '3px solid #ff9800';
        banner.innerHTML = `
          <strong>⚠️ Offline Mode:</strong> You are offline. New sales will be queued and synced when your connection returns.
          <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        document.body.insertBefore(banner, document.body.firstChild);
      }
      banner.style.display = 'block';
    } else {
      if (banner) banner.style.display = 'none';
    }
  }

  async syncOfflineData() {
    if (this.syncing || !this.isOnline || !offlineDB || !offlineDB.available) return;
    
    this.syncing = true;
    console.log('Starting offline data sync...');
    
    try {
      const queuedSales = await offlineDB.getQueuedSales();
      
      if (queuedSales.length === 0) {
        console.log('No queued sales to sync');
        this.syncing = false;
        return;
      }
      
      console.log(`Syncing ${queuedSales.length} queued sales...`);
      let synced = 0;
      
      for (const sale of queuedSales) {
        try {
          // Use /sales/sync endpoint which is CSRF exempt for offline sync
          const response = await fetch('/sales/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              medicine_id: sale.medicine_id,
              quantity: sale.quantity,
              customer_id: sale.customer_id || null
            })
          });
          
          if (response.ok) {
            await offlineDB.markSaleSynced(sale.timestamp);
            synced++;
            console.log(`✓ Synced sale ${synced}/${queuedSales.length}`);
          } else {
            const errorText = await response.text();
            console.error(`Failed to sync sale: ${response.status} - ${errorText}`);
          }
        } catch (err) {
          console.error('Sync error:', err);
          break; // Stop if network error
        }
      }
      
      if (synced > 0) {
        console.log(`✓ Successfully synced ${synced} sales`);
        this.showSyncNotification(`${synced} offline sales synced successfully!`);
        await offlineDB.setMetadata('lastSync', new Date().toISOString());
      }
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      this.syncing = false;
    }
  }

  showSyncNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'alert alert-success alert-dismissible fade show';
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '9999';
    notification.style.minWidth = '300px';
    notification.style.animation = 'slideIn 0.3s ease-out';
    notification.innerHTML = `
      <strong>✓ Success!</strong> ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  async queueSale(medicine_id, quantity, customer_id = null) {
    if (!this.isOnline) {
      await offlineDB.queueSale({
        medicine_id,
        quantity,
        customer_id,
        offline: true
      });
      console.log('Sale queued for sync when online');
      return { offline: true };
    } else {
      // Online - send immediately
      try {
        const response = await fetch('/sales/new', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ medicine_id, quantity, customer_id })
        });
        return await response.json();
      } catch (err) {
        console.error('Failed to save sale:', err);
        throw err;
      }
    }
  }
}

// Global instance (wrapped in try-catch for safety)
let offlineManager;
try {
  offlineManager = new OfflineManager();
} catch (err) {
  console.warn('Failed to initialize offline manager:', err);
  offlineManager = null;
}
