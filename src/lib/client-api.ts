import { toast } from 'sonner';

/**
 * Standard API error handler - shows toast and logs to console
 */
export function handleApiError(context: string, error: unknown): void {
  console.error(`Failed to ${context}:`, error);
  toast.error(`Failed to ${context}`);
}

/**
 * Standard API success handler - shows toast and optionally refreshes
 */
export function handleApiSuccess(message: string, refresh = false): void {
  toast.success(message);
  if (refresh) {
    window.location.reload();
  }
}

/**
 * Standard fetch wrapper with error handling
 */
export async function apiFetch<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      ...options,
    });
    const data = await res.json();

    if (!res.ok) {
      return { success: false, error: data.error || 'Request failed' };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * GET request helper
 */
export async function apiGet<T = unknown>(
  url: string
): Promise<{ success: boolean; data?: T; error?: string }> {
  return apiFetch<T>(url, { method: 'GET' });
}

/**
 * POST request helper
 */
export async function apiPost<T = unknown, B = unknown>(
  url: string,
  body: B
): Promise<{ success: boolean; data?: T; error?: string }> {
  return apiFetch<T>(url, { method: 'POST', body: JSON.stringify(body) });
}

/**
 * PATCH request helper
 */
export async function apiPatch<T = unknown, B = unknown>(
  url: string,
  body: B
): Promise<{ success: boolean; data?: T; error?: string }> {
  return apiFetch<T>(url, { method: 'PATCH', body: JSON.stringify(body) });
}

/**
 * DELETE request helper
 */
export async function apiDelete<T = unknown>(
  url: string
): Promise<{ success: boolean; data?: T; error?: string }> {
  return apiFetch<T>(url, { method: 'DELETE' });
}
