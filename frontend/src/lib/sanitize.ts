import DOMPurify from 'dompurify';

// Pattern to detect HTML tags and dangerous content
const HTML_TAG_PATTERN = /<[^>]*>|javascript:|data:|on\w+\s*=/gi;

/**
 * Sanitize user input to prevent XSS attacks
 * Strips all HTML tags while preserving normal text and spaces
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // First, check if input contains any HTML tags
  const hasHtmlTags = HTML_TAG_PATTERN.test(input);
  
  // If no HTML tags, return the trimmed input as-is
  if (!hasHtmlTags) {
    return input.trim();
  }
  
  // Use DOMPurify to strip tags, then decode HTML entities
  const sanitized = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
  });
  
  // Decode HTML entities that DOMPurify creates
  const textArea = document.createElement('textarea');
  textArea.innerHTML = sanitized;
  return textArea.value.trim();
}

/**
 * Sanitize HTML content while allowing safe formatting tags
 * Use for rich text content like descriptions
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
  });
}

/**
 * Validate email format
 * Returns true if email is valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  
  // RFC 5322 compliant email regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  // Additional checks for SQL injection patterns
  const sqlPatterns = /('|--|;|DROP|DELETE|INSERT|UPDATE|SELECT|UNION|OR\s+1=1)/i;
  
  if (sqlPatterns.test(email)) {
    return false;
  }
  
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate URL - only allow http/https protocols
 * Prevents javascript: and data: protocol attacks
 */
export function isValidUrl(url: string): boolean {
  if (!url) return false;
  
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Sanitize URL to prevent protocol injection
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';
  
  const trimmed = url.trim();
  
  // Only allow http/https URLs
  if (isValidUrl(trimmed)) {
    return trimmed;
  }
  
  // If no protocol, assume https
  if (!trimmed.includes('://')) {
    const withProtocol = `https://${trimmed}`;
    if (isValidUrl(withProtocol)) {
      return withProtocol;
    }
  }
  
  return '';
}

/**
 * Validate and sanitize numeric input within range
 */
export function sanitizeNumber(value: number, min: number, max: number): number {
  if (isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}
