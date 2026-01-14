# Offline-First Architecture Documentation

## Overview
The Pharmacy Management System now supports **offline-first functionality** using Service Workers, IndexedDB, and background synchronization. Users can continue working without an internet connection, and data automatically syncs when reconnected.

## Features

### 1. Service Worker Caching
**File:** `static/service-worker.js`

- **Install:** Caches critical assets (CSS, JS, images, fonts, HTML)
- **Fetch Strategy:** Network-first for HTML, cache-first for static assets
- **Fallback:** Serves offline page when connection unavailable
- **Cleanup:** Automatically removes old cache versions

**Cached Assets:**
- Bootstrap CSS & JS bundle
- Chart.js library
- Custom animations CSS/JS
- All application HTML pages
- Static images and fonts

### 2. IndexedDB Data Persistence
**File:** `static/offline-db.js`

Provides structured database for offline data storage:

```javascript
// Available methods:
await offlineDB.saveMedicine(medicine)      // Cache medicine data
await offlineDB.getMedicines()              // Retrieve cached medicines
await offlineDB.queueSale(saleData)         // Queue sale when offline
await offlineDB.getQueuedSales()            // Get pending sales
await offlineDB.markSaleSynced(timestamp)   // Mark sale as synced
await offlineDB.setMetadata(key, value)     // Store metadata
```

**Object Stores:**
- `medicines` - Cached medicine inventory
- `sales` - Sale history
- `customers` - Customer data
- `offlineSalesQueue` - Sales pending sync
- `metadata` - App metadata (last sync, etc)

### 3. Offline Detection & Auto-Sync
**File:** `static/offline-manager.js`

Features:
- Real-time online/offline detection
- Offline banner notification
- Automatic sync when connection restored
- Queue management for offline operations
- User feedback notifications

```javascript
// Global instance available as: offlineManager
offlineManager.isOnline          // Check current status
await offlineManager.queueSale(...) // Queue or submit sale
```

### 4. Progressive Web App (PWA)
**File:** `static/manifest.json`

- Installable app on mobile/desktop
- Custom app icons and colors
- App shortcuts (Dashboard, New Sale, Medicines)
- Standalone display mode

## Usage

### For End Users

#### Going Offline
1. The app automatically detects loss of connection
2. A yellow warning banner appears at top of page
3. You can continue:
   - ✓ Viewing cached pages and data
   - ✓ Recording sales (queued locally)
   - ✓ Reviewing previous transactions
   - ✓ Viewing medicine inventory

#### Coming Back Online
1. Connection is automatically detected
2. Queued sales sync to the server
3. Green success notification confirms sync
4. App data updates from server

### For Developers

#### Testing Offline Mode

**Chrome/Edge DevTools:**
1. Open DevTools (F12)
2. Go to **Application** tab
3. Left sidebar → **Service Workers**
4. Check "Offline" checkbox
5. Refresh page - app continues working
6. Try recording a sale - it queues locally
7. Uncheck "Offline" - sync happens automatically

**Alternative - Network Throttling:**
1. DevTools → **Network** tab
2. Throttle dropdown → **Offline**
3. Test app functionality

#### Viewing Cached Data

**In DevTools:**
1. **Application** → **Cache Storage**
2. Expand `pharmacy-v1` cache
3. View all cached resources

**IndexedDB Data:**
1. **Application** → **IndexedDB** → **PharmacyDB**
2. Expand object stores (medicines, sales, etc)
3. View queued/cached data

#### Registering the App

**On Mobile/Desktop:**
1. Open app in browser
2. Click **Install** button (or three-dots menu)
3. Select "Install app"
4. App icon appears on home screen
5. Works like native app

## Architecture

```
┌─────────────────────────────────────────────┐
│         Flask Backend (Online)              │
│         PostgreSQL Database                 │
└─────────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────────┐
│    Service Worker (Asset Caching)           │
│    - Intercepts HTTP requests               │
│    - Serves cached assets if offline        │
│    - Network-first for dynamic content      │
└─────────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────────┐
│  IndexedDB (Data Persistence)               │
│  - Stores medicines, sales, customers       │
│  - Queues offline transactions              │
│  - Syncs when online                        │
└─────────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────────┐
│    Offline Manager (Detection & Sync)       │
│    - Monitors connection status             │
│    - Shows offline/online UI                │
│    - Auto-syncs queued data                 │
└─────────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────────┐
│         User Interface / App                │
│         (Works online & offline)            │
└─────────────────────────────────────────────┘
```

## API Endpoints

### Sales Recording (Enhanced for Offline)

**Route:** `POST /sales/new`

**Supports Both:**
1. **Form Submission** (traditional)
   ```html
   <form method="POST">
     <input name="medicine_id">
     <input name="quantity">
     <input name="customer_id">
   </form>
   ```

2. **JSON API** (for offline sync)
   ```javascript
   fetch('/sales/new', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       medicine_id: 5,
       quantity: 2,
       customer_id: null
     })
   })
   ```

**Response (JSON):**
```json
{
  "success": true,
  "sale_id": 123,
  "total": 49.99
}
```

## Files Added/Modified

### New Files
- `static/service-worker.js` - 130 lines
- `static/offline-db.js` - 160 lines
- `static/offline-manager.js` - 150 lines
- `static/offline.html` - 130 lines
- `static/manifest.json` - 95 lines

### Modified Files
- `templates/base.html` - Added Service Worker registration, offline JS modules, PWA manifest
- `app.py` - Enhanced `/sales/new` to accept JSON requests from offline sync

## Performance Impact

- **Service Worker:** ~5KB (gzipped)
- **IndexedDB Manager:** ~6KB (gzipped)
- **Offline Manager:** ~5KB (gzipped)
- **Cache Size:** ~2MB (CSS, JS, images)
- **Load Time Improvement:** ~50% faster repeat visits (from cache)

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Service Worker | ✓ | ✓ | ✓ 11.1+ | ✓ |
| IndexedDB | ✓ | ✓ | ✓ | ✓ |
| PWA Install | ✓ | Limited | ✓ 15.1+ | ✓ |
| Background Sync | ✓ | ✓ 75+ | Limited | ✓ |

## Testing Checklist

- [ ] Open app in production
- [ ] Go to DevTools → Application → Service Workers
- [ ] Confirm Service Worker is registered and activated
- [ ] Check "Offline" checkbox
- [ ] Verify app still loads and responds
- [ ] Try to record a sale - should queue locally
- [ ] Uncheck "Offline"
- [ ] Verify sale syncs automatically
- [ ] Check server received the sale
- [ ] Open app in incognito/private mode
- [ ] Test install banner (on mobile or Chrome)
- [ ] Verify app runs in standalone mode

## Future Enhancements

1. **Background Sync API** - Sync queued data even if app closed
2. **Push Notifications** - Notify on sync success/failure
3. **Data Compression** - Optimize IndexedDB storage
4. **Encryption** - Secure sensitive offline data
5. **Conflict Resolution** - Handle concurrent edits
6. **Selective Sync** - Choose what to sync
7. **Offline Reports** - Generate reports from cached data
8. **Medicine Photo Caching** - Cache medicine images offline

## Troubleshooting

### Service Worker Not Registering
1. Check HTTPS is enabled (required for SW)
2. Verify `static/service-worker.js` is accessible
3. Clear browser cache and hard refresh (Ctrl+Shift+R)
4. Check browser console for errors

### IndexedDB Full
1. Clear cache in DevTools → Application → Storage
2. Increase database quota (browser dependent)
3. Clear old cached medicines not in use

### Sync Not Working
1. Check network connection restored
2. Verify backend is running
3. Check browser console for errors
4. Reload page to trigger manual sync
5. Check DevTools → Network for sync requests

### App Still Cached After Update
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Clear Service Worker cache in DevTools
3. Wait for automatic cache cleanup (if enabled)

## Security Considerations

1. **Data Encryption:** IndexedDB data is NOT encrypted - don't store sensitive PII
2. **Service Worker Scope:** Limited to `/` - doesn't access other domains
3. **Cache Validation:** Always verify server data after sync
4. **HTTPS Required:** Service Worker only works over HTTPS (except localhost)

