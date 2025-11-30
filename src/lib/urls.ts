/**
 * Get the base URL for the application
 * Uses APP_URL environment variable, with fallbacks for different environments
 */
export function getBaseUrl(): string {
  // Server-side: use APP_URL
  if (typeof window === 'undefined') {
    return process.env.APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  }

  // Client-side: use window.location
  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  // Fallback
  return 'http://localhost:3000'
}

/**
 * Get the full URL for a path
 * @param path - The path to append to the base URL (should start with /)
 */
export function getFullUrl(path: string): string {
  const baseUrl = getBaseUrl()
  return `${baseUrl}${path}`
}