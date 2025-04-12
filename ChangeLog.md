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

### New video source

> Added a new video source using the custom API. This source provides a simple and reliable way to access movie and TV show data. The API is designed to be used with the following providers: "embedsu", "2embed", "autoembed", "vidsrcsu"

You can find reference documentation for the new video source in the `src/lib/CUSTOM-API.md` file.

We are also going to use proxy for the new CUSTOM API video source. The proxy is designed to facilitate requests to the custom streaming API, ensuring a seamless experience for users using m3u8 videos.
You can find reference documentation for the new proxy in the `src/lib/PROXY.md` file.

Current video sources use iframe embeds, which are not supported by the new custom API. So we will need to update our implementation to accommodate this change and ensure that the new video source works seamlessly with the existing codebase as new video source is going to use HLS library to show the video stream.

We need to make sure the current video sources are not affected by this change. The new video source should be added as a separate option in the app, and the existing video sources should continue to work as they currently do.
We will also need to update the app's UI to reflect the new video source and ensure that users can easily switch between the existing video sources and the new custom API video source and new one.

Make sure you create environment variables for proxy and custom API in the `.env` file. The proxy URL should be set to `VITE_PROXY_URL` and the custom API URL should be set to `VITE_CUSTOM_API_URL`.

Develop a new video source integration within the existing application, leveraging a custom API to access movie and TV show data. This new source should support providers such as "embedsu", "2embed", "autoembed", and "vidsrcsu", and utilize an HLS library for video streaming, differentiating it from the current iframe-based video sources. The implementation must ensure that the existing video sources remain fully functional and unaffected by the integration of the new source. The new video source should be presented as a distinct option within the application's interface, allowing users to select it alongside the existing options. The integration should be seamless, ensuring that the new video source functions correctly within the application's existing codebase and user experience. Update the application's UI to reflect the new video source and ensure that users can easily switch between the existing video sources and the new custom API video source. We are also going to use proxy for the new CUSTOM API video source. You can find reference documentation for the new video source in the `src/lib/CUSTOM-API.md` file. You can find reference documentation for the new proxy in the `src/lib/PROXY.md` file.
