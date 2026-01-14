# Testing Offline Functionality - Quick Guide

## Step-by-Step Test

### 1. Open the App in Chrome/Edge
```
Visit: http://localhost:5000 (or your Railway URL)
```

### 2. Check Service Worker Installation
```
DevTools (F12) → Application → Service Workers
```
You should see:
- ✓ Status: "activated and running"
- ✓ Scope: Your app domain

### 3. View Cached Assets
```
DevTools → Application → Cache Storage → pharmacy-v1
```
You should see 8-10 cached resources:
- CSS files
- JS files
- HTML pages

### 4. Enable Offline Mode
```
DevTools → Network → Throttling (dropdown)
Select: Offline
```
Or:
```
DevTools → Application → Service Workers
Check: "Offline" checkbox
```

### 5. Navigate Offline
With offline mode ON:
- ✓ Refresh page - loads from cache
- ✓ Click "Dashboard" - still works
- ✓ Click "Medicines" - displays cached data
- ✓ Navigate to "Reports" - works from cache

### 6. Queue Offline Sale
```
1. Click "New Sale"
2. Fill form:
   - Select medicine
   - Enter quantity
   - Select (optional) customer
3. Click "Save Sale"
```

You should see:
- Yellow "⚠️ Offline Mode" banner at top
- Message: "Sale queued for sync when online"
- Data stored in IndexedDB (not sent to server)

### 7. View Queued Sales in IndexedDB
```
DevTools → Application → IndexedDB → PharmacyDB → offlineSalesQueue
```
You should see your queued sales with `synced: false`

### 8. Go Back Online
```
DevTools → Network → Throttling: select any normal speed
Or: DevTools → Service Workers → Uncheck "Offline"
Refresh page
```

### 9. Verify Automatic Sync
After going online:
- Yellow banner disappears
- Green notification: "1 offline sales synced successfully!"
- Check DevTools → Network tab
- See POST request to `/sales/new`
- Check server received sale (refresh sales page)

### 10. Verify IndexedDB Updated
```
DevTools → Application → IndexedDB → PharmacyDB → offlineSalesQueue
```
Your sale should now have `synced: true`

## Advanced Testing

### Test Cache Invalidation
```
1. Go to DevTools → Application → Service Workers
2. Click "Unregister"
3. Click "skipWaiting" if you see it
4. Reload page - new SW should register
```

### Test Database Quota
```
DevTools → Application → Storage
View: "Persistent storage" status
```
Should show how much space is available for offline data

### Test on Different Browsers
- Chrome/Edge: Full support ✓
- Firefox: Full support ✓
- Safari: Mostly works (some limitations)

### Test Install as PWA
**On Desktop (Chrome):**
```
1. Open app
2. Click address bar menu
3. Select "Install app" or "Create shortcut"
4. Confirm
```

**On Mobile:**
```
1. Open app in Chrome
2. Scroll to bottom of page
3. Tap "Install" banner
4. Confirm
5. App appears on home screen
6. Tap to open as native app
```

## Network Speed Simulation

**Slow 3G (Mobile):**
```
DevTools → Network → Throttling: Slow 3G
- Notice app loads MUCH faster
- Static assets served from cache
```

**Offline:**
```
DevTools → Network → Throttling: Offline
- App still functions completely
- UI stays responsive
```

## Console Messages to Expect

When online and Service Worker active, you should see:
```
✓ Service Worker registered
✓ IndexedDB initialized
Starting offline data sync...
✓ Successfully synced 1 sales
```

When going offline:
```
✗ Gone offline
(offline banner shown)
```

When sync in progress:
```
Syncing 1 queued sales...
✓ Synced sale 1/1
```

## Data Verification

### Check Local Storage
```
DevTools → Application → Local Storage
```
(Optional - for metadata like lastSync time)

### Check IndexedDB
```
DevTools → Application → IndexedDB → PharmacyDB
Object Stores:
- medicines: cached medicine data
- sales: historical sales
- customers: customer data
- offlineSalesQueue: pending sales
- metadata: app settings (lastSync, etc)
```

### Check Server
```
1. Go online
2. Wait for auto-sync
3. Open "Search Sales" page
4. Search for your offline sale
5. Should appear with today's date
```

## Troubleshooting Tests

### Service Worker Not Installing
```
1. DevTools → Application → Service Workers
2. Check "Errors" field
3. Verify: 
   - App is HTTPS (or localhost)
   - static/service-worker.js exists
   - No JavaScript errors in console
```

### Sales Not Syncing
```
1. Check Network tab (DevTools → Network)
2. Look for POST to /sales/new
3. Check response (should be 201 success)
4. Check backend logs
5. Verify medicine had enough stock
```

### Cache Issues
```
1. DevTools → Application → Clear site data
2. Unregister Service Worker
3. Hard refresh (Ctrl+Shift+R)
4. Wait 5 seconds for SW to reinstall
5. Check Cache Storage again
```

## Performance Benchmark

| Metric | With Cache | Without Cache |
|--------|-----------|----------------|
| Page Load (repeat visit) | ~200ms | ~2000ms |
| Static Assets | Instant (cached) | Downloaded |
| Offline Mode | Fully functional | Blank page |
| New Sale Submission (offline) | ~100ms (queued) | Fails |
| Sync Time (5 sales) | ~1-2 seconds | N/A |

## Post-Testing Checklist

- [ ] Service Worker registers successfully
- [ ] Cache Storage contains assets
- [ ] App loads offline from cache
- [ ] New sale can be queued offline
- [ ] IndexedDB queues the sale
- [ ] Going online triggers sync
- [ ] Synced sales appear on server
- [ ] Green notification shows on sync
- [ ] No console errors
- [ ] PWA install works
- [ ] App runs in standalone mode
- [ ] Database quota shows available space

## Support

If tests fail, check:
1. Browser console for errors (F12)
2. Network tab for failed requests
3. Service Worker details in Application tab
4. IndexedDB data in Application → IndexedDB
5. See OFFLINE.md for troubleshooting guide

