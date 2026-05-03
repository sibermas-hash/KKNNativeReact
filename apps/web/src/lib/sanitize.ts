/**
 * Sanitize HTML content to prevent XSS attacks.
 * Removes script tags, event handlers, and dangerous attributes.
 * Allows safe HTML tags for content formatting.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';

  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove event handlers (onclick, onload, onerror, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript\s*:/gi, '');

  // Remove data: protocol (can be used for XSS)
  sanitized = sanitized.replace(/data\s*:/gi, '');

  // Remove vbscript: protocol
  sanitized = sanitized.replace(/vbscript\s*:/gi, '');

  // Remove formaction attribute
  sanitized = sanitized.replace(/\s*formaction\s*=\s*["'][^"']*["']/gi, '');

  // Remove style attributes with expression()
  sanitized = sanitized.replace(/\s*style\s*=\s*["'][^"']*expression\s*\([^"']*["']/gi, '');

  return sanitized;
}
