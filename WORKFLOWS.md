# Offline Functionality Workflow

## User Online - Normal Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    User Online (Normal)                      │
└─────────────────────────────────────────────────────────────┘

1. User opens app
   ↓
2. Service Worker installs (background)
   - Caches CSS, JS, images, fonts
   - Caches current page
   ↓
3. User browses normally
   - All requests go to server
   - Images cached by SW
   - Data loaded fresh from database
   ↓
4. User records a sale
   - Form submitted to /sales/new
   - Server validates & saves to DB
   - Page redirects to receipt
   - offlineManager detects online
   ↓
5. Everything works as normal
   ✓ Fast because static assets cached
   ✓ Data always current from server
```

## User Goes Offline - Queue Flow

```
┌─────────────────────────────────────────────────────────────┐
│              Connection Lost - Offline Mode                  │
└─────────────────────────────────────────────────────────────┘

1. Network drops (WiFi disconnects, 4G lost, etc)
   ↓
2. offlineManager detects: navigator.onLine = false
   ↓
3. Yellow banner appears:
   "⚠️ Offline Mode: You are offline. New sales will be queued..."
   ↓
4. User still can:
   - Browse cached pages (Dashboard, Reports, Medicines)
   - View cached data
   - Interact with UI
   ✗ Cannot: Sync server data, add new medicines, etc

   ↓
5. User wants to record a sale
   - Clicks "New Sale"
   - Form loads from cache
   - Fills out and submits
   ↓
6. offlineManager detects offline status
   - Doesn't submit to server
   - Calls offlineDB.queueSale()
   ↓
7. Sale stored in IndexedDB.offlineSalesQueue
   {
     medicine_id: 5,
     quantity: 2,
     customer_id: null,
     timestamp: 1234567890,
     synced: false
   }
   ↓
8. Message appears:
   "Sale queued for sync when online"
   ✓ Data persists even if app closes
   ✓ Can queue multiple sales offline
   ✓ All data survives browser restart
```

## User Gets Back Online - Sync Flow

```
┌─────────────────────────────────────────────────────────────┐
│          Connection Restored - Auto Sync Begins             │
└─────────────────────────────────────────────────────────────┘

1. User reconnects to WiFi or 4G
   ↓
2. offlineManager detects: navigator.onLine = true
   ↓
3. Yellow banner disappears automatically
   ✓ App now shows "online" state
   ↓
4. offlineManager.syncOfflineData() triggered
   ↓
5. Gets all unsyced sales from IndexedDB
   Query: offlineSalesQueue where synced = false
   ↓
6. For each queued sale:
   ┌──────────────────────────────────────┐
   │  POST /sales/new (JSON request)      │
   │  {                                   │
   │    medicine_id: 5,                   │
   │    quantity: 2,                      │
   │    customer_id: null                 │
   │  }                                   │
   └──────────────────────────────────────┘
   ↓
7. Server processes each request
   - Validates quantity available
   - Reduces stock
   - Records sale in DB
   - Returns success (201)
   ↓
8. offlineManager marks sale as synced
   offlineSalesQueue[sale].synced = true
   ↓
9. All sales synced successfully
   Green notification appears:
   "✓ Success! 5 offline sales synced successfully!"
   ↓
10. lastSync timestamp updated in metadata
    ↓
11. App data refreshed from server
    - Dashboard updates with new sales
    - Stock levels updated
    - All data current again
    ✓ Complete sync success
```

## State Diagram

```
                    ┌──────────────┐
                    │   STARTING   │
                    │  (app loads) │
                    └──────┬───────┘
                           │
                    ┌──────▼───────────────┐
                    │ Register Service     │
                    │ Worker & SW          │
                    │ registers successfully
                    └──────┬───────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
         ┌────▼─────────┐       ┌──────▼──────┐
         │  ONLINE      │       │   OFFLINE   │
         │  Normal Ops  │       │  Queue Ops  │
         └────┬─────────┘       └──────┬──────┘
              │                        │
    ┌─────────▼────────────────────────▼────┐
    │  User performs action (e.g., save sale)│
    └─────────┬─────────────────────────────┘
              │
         ┌────▼────────────────────────┐
    ┌────▼──────┐              ┌──────▼──────┐
    │  ONLINE?  │              │  OFFLINE?   │
    │  YES→────▶│              │  YES→──────▶│
    └───────────┘              └─────────────┘
         │                             │
    ┌────▼──────────────────┐   ┌─────▼──────────┐
    │ Submit to server      │   │ Save to IndexDB│
    │ /sales/new            │   │ Show "Queued"  │
    └────┬──────────────────┘   └──────┬─────────┘
         │                             │
    ┌────▼────────────────────────────▼──┐
    │  Return to normal state             │
    │  Wait for next user action          │
    └──────────┬──────────────────────────┘
               │
        ┌──────▼──────────────┐
        │ Connection changes? │
        │ If OFFLINE→ONLINE   │
        └──────┬──────────────┘
               │
        ┌──────▼──────────────────────┐
        │ Auto-Sync triggered         │
        │ offlineManager.syncOffline   │
        │ Data()                       │
        └──────┬──────────────────────┘
               │
        ┌──────▼──────────────────────┐
        │ Retrieve all unsyced sales  │
        │ from IndexedDB              │
        └──────┬──────────────────────┘
               │
        ┌──────▼──────────────────────┐
        │ POST each to /sales/new      │
        │ (JSON API calls)             │
        └──────┬──────────────────────┘
               │
        ┌──────▼──────────────────────┐
        │ Mark synced in IndexedDB     │
        │ Show success notification    │
        └──────┬──────────────────────┘
               │
        ┌──────▼──────────────────────┐
        │ Refresh app data from       │
        │ server                      │
        └──────┬──────────────────────┘
               │
        ┌──────▼──────────────────────┐
        │ Back to ONLINE state        │
        │ Continue normally           │
        └─────────────────────────────┘
```

## Data Flow Diagram

### Service Worker Cache Layer
```
Request from Browser
        ↓
   ┌─────────────────┐
   │ Service Worker  │
   │ Fetch Handler   │
   └────┬───────────┘
        │
    ┌───▼──────────────────┐
    │ Is it an asset?      │
    │ (CSS/JS/image)       │
    └───┬──────────┬───────┘
        │YES       │NO
    ┌───▼────┐  ┌──▼──────────────┐
    │Cache   │  │Is it HTML?      │
    │First   │  │(dynamic page)   │
    └───┬────┘  └──┬──────────┬───┘
        │         │YES       │NO
    ┌───▼────────┐│┌──▼────────────────┐
    │Check cache │││Network First      │
    │hits?       │││Then cache fallback│
    └──┬────┬────┘│└──┬──────┬────────┘
    YES│    │NO   │   │      │
       │    │     │   │      │
    ┌──▼──┐│ ┌───▼───▼──────┐│
    │Return ││Try fetch from ││
    │cached ││server         ││
    │asset ││                ││
    └──────┘└───┬─────────┬──┘│
                │SUCCESS  │   │
            ┌───▼──┐   ┌──▼──────┐
            │Cache │   │Offline? │
            │it    │   │Return   │
            └──────┘   │offline. │
                       │html     │
                       └─────────┘
```

### IndexedDB Store Flow
```
App Event (record sale)
        ↓
    Online?
    ├─YES→ Submit to server → Success → Update UI
    │                            ↓
    │                      Save to IndexedDB
    │                      (history)
    │
    └─NO → Queue in IndexedDB.offlineSalesQueue
               (synced: false)
               ↓
           Show notification
           ↓
       [Wait for online...]
           ↓
       Connection restored
           ↓
       Sync triggered
           ↓
       Fetch all unsyced
           ↓
       POST to /sales/new
           ↓
       Success?
       ├─YES → Mark synced = true
       │       Show success
       │
       └─NO → Retry next time
              Keep unsyced
```

## Example: Complete Offline Sale

```
TIME    ACTION                              STATE                  STORAGE
────────────────────────────────────────────────────────────────────────────

13:00   User goes offline                   OFFLINE               
        Banner appears                                            

13:02   User records:                       Processing...         
        - Medicine: Paracetamol                                   
        - Qty: 2                                                  
        - Customer: None                                          

13:02   offlineManager.queueSale()          QUEUE SAVE            

13:02   offlineDB.queueSale()               ✓ QUEUED              IndexedDB:
                                                                   {
                                                                    med_id: 3,
                                                                    qty: 2,
                                                                    cust_id: null,
                                                                    ts: 1234567890,
                                                                    synced: false
                                                                   }

13:02   Success notification shown          UI UPDATE             

13:15   User reconnects WiFi                RECONNECTED           

13:15   offlineManager detects online       AUTO SYNC START       

13:15   Retrieves from                      FETCHING QUEUE        
        offlineSalesQueue                                         

13:15   POST /sales/new {                   API CALL              
          med_id: 3,                                              
          qty: 2,                                                 
          ...                                                     
        }                                                         

13:15   Server receives request             VALIDATING            DB: Checking
        - Check: qty > 0 ✓                                        paracetamol
        - Check: stock >= 2 ✓                                     stock

13:15   Server processes:                   PROCESSING            
        - Reduce stock: 10 → 8                                    DB: UPDATE
        - Create Sale record                                      medicine qty
        - Return 201 ✓                                            DB: INSERT sale

13:15   Response received                   SYNC SUCCESS          

13:15   Mark synced = true                  UPDATE STORE          IndexedDB:
                                                                   {
                                                                    ...
                                                                    synced: TRUE ✓
                                                                   }

13:15   Green notification:                 UI UPDATE             
        "✓ 1 offline sales synced!"                               

13:15   Dashboard refreshed                 DATA REFRESH          
        Stock shows 8 (was 10)                                    
        Sale appears in list                                      
                                                                   
13:15   All synced and current              ONLINE ✓              
```

## Emergency Recovery (App Crash While Offline)

```
Scenario: App crashes while offline, user has queued sales

1. IndexedDB is persistent!
   - Data survives app crash
   - Data survives browser close
   - Data survives restart

2. User restarts browser

3. App loads from Service Worker cache
   - UI loads instantly (cached)
   - Offline manager initializes
   - IndexedDB queues still there
   - offlineSalesQueue unchanged

4. User checks Connection
   - If ONLINE → Auto-sync resumes
   - If OFFLINE → Can continue queuing
   - NO DATA LOSS ✓

5. Once online
   - Sync happens automatically
   - All queued sales sent
   - Server receives everything

✓ Complete offline resilience
✓ No user data lost ever
```

