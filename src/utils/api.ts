
// This file is now a compatibility layer. All logic has been split into focused modules.
// All previous implementation code has been removed. Only re-exports remain.
export * from './tmdb-api';
export * from './video-sources';
export * from './formatters';

/**
 * Refactor rationale:
 * - This file previously contained all API logic, video source definitions, and formatting utilities.
 * - To improve maintainability and follow the Single Responsibility Principle, it is now split into:
 *   - tmdb-api.ts: All TMDB API logic and types
 *   - video-sources.ts: All video source provider definitions
 *   - formatters.ts: All formatting utilities for TMDB media items
 * - This compatibility layer re-exports for gradual migration. Prefer importing from the new modules directly.
 */

