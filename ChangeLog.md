# ChangeLog
## [Unreleased]
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

