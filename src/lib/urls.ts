/**
 * Get the base URL for the application
 * Uses APP_URL environment variable, with fallbacks for different environments
 */
export function getBaseUrl(): string {
  return process.env.APP_URL || "http://localhost:3000";
}

/**
 * Get the full URL for a path
 * @param path - The path to append to the base URL (should start with /)
 */
export function getFullUrl(path: string): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}${path}`;
}
