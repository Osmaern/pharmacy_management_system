# Quick Start - Offline Functionality

## ⚡ 60-Second Test

1. **Open the app**
   ```
   http://localhost:5000
   ```

2. **Press F12 to open DevTools**

3. **Go to: Network tab → Throttling dropdown**

4. **Select: Offline**

5. **Refresh the page** - still works! ✓

6. **Click "New Sale"**

7. **Fill form and submit**
   - Medicine: Any
   - Quantity: 2
   - Customer: (optional)

8. **See message:** "Sale queued for sync when online" ✓

9. **Change Throttling: back to Normal**

10. **Watch for:** Green notification "1 offline sales synced!" ✓

**Done! Offline mode works perfectly.**

---

## 📱 Install as App (2 minutes)

### Windows/Mac (Chrome)
1. Open pharmacy app
2. Click **address bar** → look for install icon (or ⋮ menu)
3. Click "Install app"
4. Confirm
5. Opens as full-screen app

### Android (Chrome)
1. Open pharmacy app
2. Tap ⋮ (menu)
3. Tap "Install app"
4. Tap "Install"
5. App icon appears on home screen

### iPhone/iPad (Safari)
1. Open pharmacy app
2. Tap **Share** button
3. Tap "Add to Home Screen"
4. Tap "Add"
5. App icon appears on home screen

---

## 🧪 What to Test

| Action | Online | Offline |
|--------|--------|---------|
| Browse app | ✓ Works | ✓ Works (cached) |
| View dashboard | ✓ Fresh | ✓ Cached |
| View medicines | ✓ Fresh | ✓ Cached |
| View reports | ✓ Fresh | ✓ Cached |
| Record sale | ✓ Immediate | ✓ Queued |
| Sync sales | - | ✓ Auto (when online) |

---

## 🔍 View Offline Data

### See Service Worker Cache
1. DevTools → **Application** tab
2. Left sidebar → **Cache Storage**
3. Open `pharmacy-v1`
4. See all cached assets (CSS, JS, HTML, images)

### See Queued Sales (IndexedDB)
1. DevTools → **Application** tab
2. Left sidebar → **IndexedDB**
3. Open **PharmacyDB**
4. Click **offlineSalesQueue**
5. See your queued sales with `synced: false`
6. After sync, `synced` becomes `true`

---

## 🚀 Deployment

The app is ready for production! Just:

1. Ensure **HTTPS** is enabled (Service Worker requires it)
2. Railway auto-deploys when you push
3. Everything works the same as local
4. Users get offline support automatically

---

## 📞 Troubleshooting

### App won't work offline?
- DevTools → Application → Service Workers
- Check if "activated and running"
- If not, hard refresh: Ctrl+Shift+R

### Sales not syncing?
- Check Network tab for POST to `/sales/new`
- Verify backend is running
- Check browser console for errors

### Can't install as app?
- Must use Chrome, Edge, or Samsung Internet
- HTTPS required (localhost works locally)
- Try clearing cache and reinstalling

### Forgot how to enable offline?
- DevTools (F12) → Network → Throttling → Offline

---

## 📚 Full Documentation

- **OFFLINE.md** - Complete technical guide
- **TESTING_OFFLINE.md** - Detailed testing procedures
- **WORKFLOWS.md** - Architecture and data flows
- **OFFLINE_SUMMARY.md** - Implementation overview

---

## ✅ What's Working

✓ Service Worker installed
✓ Assets cached (~2MB)
✓ Offline detection active
✓ IndexedDB setup
✓ Sale queuing works
✓ Auto-sync enabled
✓ PWA installable
✓ All documented
✓ Ready for production

---

## 🎯 Next Steps

1. Test offline mode (see 60-second test above)
2. Install as app (see section above)
3. Try recording sales offline
4. Watch auto-sync when online
5. Share with team - everyone loves offline! 🎉

