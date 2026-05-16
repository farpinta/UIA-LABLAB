/**
 * URL Validation and Sanitization Utilities
 * Security-first approach to prevent command injection
 */

/**
 * Validates if a URL is a valid GitHub repository URL
 * @param url - The URL to validate
 * @returns true if valid GitHub URL, false otherwise
 */
export function validateGitHubUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Strict GitHub URL pattern: https://github.com/username/repo
  // Allows alphanumeric, hyphens, underscores, and dots
  const githubPattern = /^https:\/\/github\.com\/[\w-]+\/[\w.-]+$/;
  
  return githubPattern.test(url);
}

/**
 * Sanitizes a URL by removing potentially dangerous characters
 * @param url - The URL to sanitize
 * @returns Sanitized URL string
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  // Remove shell metacharacters that could be used for injection
  // Removes: ; & | ` $ ( ) < > \ newlines tabs
  return url
    .replace(/[;&|`$()<>\\]/g, '')
    .replace(/[\n\r\t]/g, '')
    .trim();
}

/**
 * Extracts repository owner and name from GitHub URL
 * @param url - GitHub repository URL
 * @returns Object with owner and repo name, or null if invalid
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  if (!validateGitHubUrl(url)) {
    return null;
  }

  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    
    if (pathParts.length >= 2) {
      return {
        owner: pathParts[0],
        repo: pathParts[1].replace(/\.git$/, '') // Remove .git suffix if present
      };
    }
  } catch (error) {
    return null;
  }

  return null;
}

/**
 * Validates and sanitizes a GitHub URL in one step
 * @param url - The URL to process
 * @returns Sanitized URL if valid, null if invalid
 */
export function processGitHubUrl(url: string): string | null {
  const sanitized = sanitizeUrl(url);
  
  if (!validateGitHubUrl(sanitized)) {
    return null;
  }

  return sanitized;
}
