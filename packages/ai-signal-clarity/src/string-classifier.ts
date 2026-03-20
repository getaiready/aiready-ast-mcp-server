/**
 * String Literal Classifier for AI Signal Clarity.
 *
 * Classifies string literals into categories to distinguish between:
 * - Meaningful magic literals (should be extracted into named constants)
 * - UI/Display strings (OK to keep inline)
 *
 * @lastUpdated 2026-03-20
 */

/**
 * Categories for string literal classification
 */
export enum StringCategory {
  /** Configuration values, API endpoints, business logic constants - should extract */
  Meaningful = 'meaningful',
  /** UI strings like button labels, tooltips, headers - OK to keep inline */
  UiDisplay = 'ui-display',
  /** Strings that should be ignored entirely */
  Ignore = 'ignore',
}

/**
 * Common UI action words that indicate a string is likely a UI label/action
 */
const UI_ACTION_WORDS = new Set([
  'click',
  'tap',
  'press',
  'select',
  'choose',
  'add',
  'remove',
  'delete',
  'save',
  'cancel',
  'close',
  'submit',
  'ok',
  'yes',
  'no',
  'next',
  'previous',
  'back',
  'continue',
  'finish',
  'done',
  'loading',
  'please',
  'wait',
  'help',
  'about',
  'settings',
  'options',
  'menu',
  'home',
  'search',
  'filter',
  'sort',
  'refresh',
  'reset',
  'clear',
  'undo',
  'redo',
  'copy',
  'paste',
  'cut',
  'edit',
  'view',
  'show',
  'hide',
  'expand',
  'collapse',
  'open',
  'new',
  'create',
  'update',
  'modify',
  'change',
  'apply',
  'confirm',
  'decline',
  'accept',
  'reject',
  'retry',
  'ignore',
  'skip',
  'start',
  'stop',
  'pause',
  'resume',
  'play',
  'record',
  'upload',
  'download',
  'import',
  'export',
  'print',
  'share',
  'send',
  'receive',
  'login',
  'logout',
  'sign',
  'register',
  'subscribe',
  'unsubscribe',
  'enable',
  'disable',
  'activate',
  'deactivate',
  'lock',
  'unlock',
]);

/**
 * Common UI nouns that indicate a string is likely a UI label
 */
const UI_NOUN_WORDS = new Set([
  'error',
  'success',
  'warning',
  'info',
  'notice',
  'alert',
  'notification',
  'message',
  'status',
  'result',
  'feedback',
  'comment',
  'note',
  'description',
  'details',
  'summary',
  'overview',
  'name',
  'title',
  'label',
  'placeholder',
  'hint',
  'tip',
  'help',
  'example',
  'sample',
  'preview',
  'demo',
  'test',
  'user',
  'email',
  'password',
  'username',
  'account',
  'profile',
  'settings',
  'preferences',
  'notifications',
  'privacy',
  'security',
  'billing',
  'payment',
  'dashboard',
  'reports',
  'analytics',
  'logs',
  'history',
  'activity',
]);

/**
 * Patterns that indicate meaningful (should-extract) strings
 */
const MEANINGFUL_PATTERNS: RegExp[] = [
  // API endpoints and URLs
  /^\/api\//i,
  /^https?:\/\//i,
  /^\/v\d+\//i,
  // Configuration keys
  /^(DATABASE_URL|API_KEY|SECRET|TOKEN|HOST|PORT|TIMEOUT|RETRY|MAX_|MIN_|DEFAULT_)/i,
  // Environment values
  /^(production|development|staging|test|dev|prod|qa)$/i,
  // MIME types
  /^application\//i,
  /^text\//i,
  // HTTP headers (not methods, which are often used as UI labels)
  /^(Authorization|Content-Type|Accept)$/i,
  // Error codes
  /^[A-Z_]+_ERROR$/i,
  /^[A-Z_]+_CODE$/i,
];

/**
 * Patterns that indicate UI display strings (should NOT be flagged as magic literals)
 */
const UI_DISPLAY_PATTERNS: RegExp[] = [
  // Strings ending with "..." are typically UI placeholders or expandable actions
  /\.\.\.$/,
];

/**
 * Classify a string literal into a category
 */
export function classifyStringLiteral(value: string): StringCategory {
  // Very short or very long strings are typically not UI labels
  if (value.length === 0 || value.length > 100) {
    return StringCategory.Ignore;
  }

  // Check if it matches meaningful patterns first
  for (const pattern of MEANINGFUL_PATTERNS) {
    if (pattern.test(value)) {
      return StringCategory.Meaningful;
    }
  }

  // Check for UI display patterns first
  for (const pattern of UI_DISPLAY_PATTERNS) {
    if (pattern.test(value)) {
      return StringCategory.UiDisplay;
    }
  }

  // Check for URLs, paths, emails (meaningful) - but not if it's clearly a UI string
  if (/[/.@]/.test(value) && !value.includes(' ')) {
    // Don't classify as meaningful if it looks like UI text with dots (e.g., "Filter...")
    if (!value.endsWith('...')) {
      return StringCategory.Meaningful;
    }
  }

  // Check for numeric strings that look like config values
  if (/^\d+(\.\d+)?$/.test(value)) {
    return StringCategory.Meaningful;
  }

  // Check for all-caps constants (meaningful) - including short ones like HTTP methods
  if (
    value === value.toUpperCase() &&
    value.length >= 3 &&
    /[A-Z]/.test(value)
  ) {
    return StringCategory.Meaningful;
  }

  // Check for camelCase or PascalCase identifiers (meaningful)
  if (
    /^[a-z]+([A-Z][a-z]+)+$/.test(value) ||
    /^([A-Z][a-z]+){2,}$/.test(value)
  ) {
    return StringCategory.Meaningful;
  }

  // Split into words for further analysis
  const words = value.toLowerCase().split(/\s+/);

  // Check if it's a single word that looks like a UI label
  if (words.length === 1) {
    const word = words[0].replace(/[.]+$/, ''); // Remove trailing dots
    if (UI_ACTION_WORDS.has(word) || UI_NOUN_WORDS.has(word)) {
      return StringCategory.UiDisplay;
    }
  }

  // Check if it starts with a UI action word
  if (words.length > 0 && UI_ACTION_WORDS.has(words[0].replace(/[.]+$/, ''))) {
    return StringCategory.UiDisplay;
  }

  // Check if it contains UI noun words
  for (const word of words) {
    if (UI_NOUN_WORDS.has(word)) {
      return StringCategory.UiDisplay;
    }
  }

  // Short phrases (1-5 words) that are capitalized like titles are likely UI
  if (words.length >= 1 && words.length <= 5) {
    const isTitleCase = value
      .split(/\s+/)
      .every(
        (w) =>
          w.length === 0 ||
          /^[A-Z]/.test(w) ||
          /^(a|an|the|and|or|but|in|on|at|to|for|of|with|by)$/i.test(w)
      );
    if (isTitleCase && /[a-zA-Z]/.test(value)) {
      return StringCategory.UiDisplay;
    }
  }

  // Default: treat as meaningful if it has reasonable length and looks like it could be a constant
  if (
    value.length >= 3 &&
    value.length <= 50 &&
    /^[a-zA-Z0-9_-]+$/.test(value)
  ) {
    return StringCategory.Meaningful;
  }

  return StringCategory.Ignore;
}
