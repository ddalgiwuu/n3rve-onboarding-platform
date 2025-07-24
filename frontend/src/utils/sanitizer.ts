import DOMPurify from 'dompurify';

/**
 * Sanitize user input to prevent XSS attacks
 */

// Configure DOMPurify
const config = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
};

// Sanitize HTML content
export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, config);
}

// Sanitize plain text (removes all HTML)
export function sanitizeText(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
}

// Sanitize URL
export function sanitizeURL(url: string): string {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    return parsed.href;
  } catch {
    return '';
  }
}

// Sanitize for use in HTML attributes
export function sanitizeAttribute(value: string): string {
  return value.replace(/[^\w\s-]/gi, '');
}

// Sanitize object keys and values
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const sanitizedKey = sanitizeAttribute(key);
    
    if (typeof value === 'string') {
      sanitized[sanitizedKey] = sanitizeText(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[sanitizedKey] = sanitizeObject(value);
    } else {
      sanitized[sanitizedKey] = value;
    }
  }
  
  return sanitized;
}