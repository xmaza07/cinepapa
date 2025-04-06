# ChangeLog
## [released]
### Added


> The major improvements I've made to fix the watch history implementation:

```
Separated Rate Limiters: Instead of using a single rate limiter, there are now three separate rate limiters:
Read operations: 200 requests per 5 minutes
Write operations: 100 requests per 5 minutes
Delete operations: 50 requests per 5 minutes
Improved Offline Support: Added a queue system that:
Stores operations when offline or rate-limited
Automatically processes queued operations when back online
Maintains data consistency between local and remote states
Better Progress Updates:
Reduced minimum update interval from 60s to 30s
Reduced significant progress threshold from 120s to 60s
Added batched updates for watch position changes
Implemented a queue for position updates to prevent data loss
Local Storage Improvements:
Increased local storage limit from 10 to 50 items
Improved offline fallback behavior
Added proper error handling for storage quota issues
Rate Limit Handling:
Added graceful degradation when rate limits are hit
Queues operations instead of dropping them
Shows appropriate user feedback via toasts
These changes should resolve any issues with favorites and watchlist not being added to Firestore while also making the watch history tracking more robust and efficient.
```



```
comprehensive service worker management system with:

A new sw-manager.ts utility that provides route-based cache cleanup, expired cache management, and cache refresh functionality
Updated the main service worker registration to include periodic cache cleanup
Enhanced the update notification component to handle async updates and show loading states
Added cache management controls to the debug panel

The key features now include:

Route-specific caching strategies:

User-specific routes use NetworkFirst with a 24-hour expiration
Dynamic content uses StaleWhileRevalidate with a 12-hour expiration
API requests use NetworkFirst with a 72-hour expiration
Static assets (images, fonts) use appropriate caching strategies
Automatic cache cleanup:

Hourly checks for expired caches
Pre-update cache cleanup
Route-based cache invalidation
Cache storage quota management
Debug capabilities:

Manual cache cleanup through the debug panel
Cache status monitoring
Update progress indicators
To continue the iteration, the service worker will now properly handle cache cleanup and updates, improving the application's offline capabilities while managing storage efficiently. The system will automatically clean up outdated caches and handle route-specific cache invalidation based on the configured expiration times.

The service worker is now ready for more advanced features. Would you like to continue with implementing background sync functionality or push notifications next?


```


### Changed strategy for watch history tracking:
```
Remove the previous logic that attempted to track watch progress using postMessage from the embedded video source, as this was identified as the likely reason history wasn't being recorded (the sources weren't sending the required messages).
Implement the "Track on Player Load" strategy: Now, when the player successfully loads the details for a movie or TV episode, it automatically calls addToWatchHistory with a position of 0. This ensures that the watch history is updated even if the user doesn't interact with the player.
This change should help ensure that the watch history is recorded correctly and consistently, even if the user doesn't manually trigger the tracking function. The new logic will also help reduce the number of unnecessary calls to addToWatchHistory when the user is not actively watching content. This should improve performance and reduce the risk of hitting rate limits on the Firestore database. 
```

