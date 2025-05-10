# Analytics System Documentation

The analytics system is designed to track and analyze user preferences between movies and TV shows, providing insights into user behavior and content engagement.

## Features

- **Media View Tracking**: Tracks when users view media content
- **Media Completion Tracking**: Records when users complete watching content
- **Media Preference Analysis**: Analyzes user preferences between movies and TV shows
- **Engagement Metrics**: Tracks user interactions like pausing, resuming, and seeking
- **Caching System**: Prevents duplicate event submissions within a 5-minute window
- **Type-Safe Analytics**: Fully typed analytics events and parameters
- **Batch Processing**: Groups events for efficient processing
- **Automatic Retry**: Handles failed events with exponential backoff
- **Async Support**: All tracking functions are async for better performance
- **Offline Support**: Queues events when offline and syncs when connection is restored
- **Storage Optimization**: Manages queue size and handles storage limits

## Usage

### Basic Event Tracking

```typescript
import { trackEvent } from '@/lib/analytics';

// All tracking functions are async and work offline
await trackEvent({
  name: 'custom_event',
  params: {
    // Your event parameters
  }
});
```

### Media View Tracking

```typescript
import { trackMediaView } from '@/lib/analytics';

await trackMediaView({
  mediaType: 'movie', // or 'tv'
  mediaId: 'movie123',
  title: 'Movie Title',
  duration: 7200 // optional, in seconds
});
```

### Media Preference Tracking

```typescript
import { trackMediaPreference } from '@/lib/analytics';

await trackMediaPreference('movie', 'select');

// Multiple tracking calls can be made in parallel
await Promise.all([
  trackMediaPreference('movie', 'select'),
  trackMediaView({
    mediaType: 'movie',
    mediaId: 'movie123',
    title: 'Movie Title'
  })
]);
```

### Using the Media Preferences Hook

```typescript
import { useMediaPreferences } from '@/hooks/use-media-preferences';

const {
  stats,
  preference,
  moviePercentage,
  tvPercentage,
  loading,
  error,
  refresh,
  setTimePeriod
} = useMediaPreferences({
  period: 'month',
  autoRefresh: true
});
```

## Implementation Details

### Event Caching

Events are cached to prevent duplicate submissions within a 5-minute window. This helps reduce unnecessary API calls and improves data accuracy.

### Offline Support

The system includes robust offline support:

- Events are automatically queued when offline
- Queued events are stored in localStorage with size management
- Events are synced when connection is restored
- Failed events are retried with exponential backoff
- Queue size is limited to prevent storage issues
- Duplicate events are prevented using caching

### Type Safety

The system uses TypeScript to ensure type safety across all analytics events and parameters. This helps catch potential errors at compile time.

### Performance Optimization

- Event batching for better performance
- Automatic retry for failed events with exponential backoff
- Efficient data storage in Firestore
- Async operations with proper error handling
- Parallel tracking when multiple events need to be sent
- Optimized storage usage for offline queue
- Smart queue processing to prevent memory issues

## Firebase Analytics Events

| Event Name | Description | Parameters |
|------------|-------------|------------|
| media_view | Tracks media views | content_type, item_id, title, duration |
| media_complete | Tracks completed views | content_type, item_id, title, watch_time |
| media_preference | Tracks user preferences | content_type, action |
| media_engagement | Tracks user engagement | content_type, item_id, action |

## Best Practices

1. Always use `await` with tracking functions or handle the promise appropriately
2. Use `Promise.all` when sending multiple events together
3. Use `void` operator for fire-and-forget tracking in useEffect
4. Handle errors appropriately in analytics callbacks
5. Test analytics events in development before deploying
6. Test offline functionality by simulating network issues
7. Monitor queue size in high-traffic scenarios
8. Implement proper error boundaries for analytics failures
9. Use the provided hooks and utilities instead of direct Firebase calls
