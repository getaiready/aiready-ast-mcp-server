/**
 * AI-Ready Constants
 *
 * Named constants to replace magic literals for improved AI signal clarity.
 * These constants help AI models understand intent without guessing semantics.
 */

// HTTP Content Types
/** Standard JSON content type for API requests/responses */
export const CONTENT_TYPE_JSON = 'application/json';

/** SVG image content type for badge generation */
export const CONTENT_TYPE_SVG = 'image/svg+xml';

/** Markdown content type for documentation responses */
export const CONTENT_TYPE_MARKDOWN = 'text/markdown';

/** CORS header for allowed request headers */
export const CORS_ALLOW_HEADERS = 'Content-Type';

// Timeout durations in milliseconds
/** Short delay for UI feedback (e.g., copy confirmation) - 2 seconds */
export const UI_DELAY_SHORT_MS = 2000;

/** Medium delay for status updates - 3 seconds */
export const UI_DELAY_MEDIUM_MS = 3000;

/** Longer delay for processing operations - 4 seconds */
export const UI_DELAY_LONG_MS = 4000;
