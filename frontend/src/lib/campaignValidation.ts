import { z } from 'zod';
import DOMPurify from 'dompurify';

// Maximum size for base64 data URLs (5MB encoded)
const MAX_BASE64_SIZE = 5 * 1024 * 1024 * 1.37; // Base64 encoding increases size by ~37%

// Sanitize string to prevent XSS
const sanitizeString = (val: string | null | undefined): string => {
  if (!val) return '';
  return DOMPurify.sanitize(val, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim();
};

// Custom sanitized string schema
const sanitizedString = (maxLength: number) => z.string()
  .max(maxLength)
  .transform(sanitizeString);

// Validate URL - only allow http/https protocols (prevent javascript: and data: URLs)
const safeUrlSchema = z.string()
  .trim()
  .min(1, 'Destination URL is required for tracking conversions')
  .max(2000, 'URL is too long')
  .refine(
    (val) => {
      try {
        const url = new URL(val);
        return ['http:', 'https:'].includes(url.protocol);
      } catch {
        return false;
      }
    },
    { message: 'Please enter a valid URL (e.g., https://your-site.com/promo). Only http/https URLs are allowed.' }
  );

// Validate that a string is within safe size limits if it's a data URL
// Regular HTTPS URLs from storage are always accepted
const dataUrlSchema = z.string().optional().refine(
  (val) => {
    if (!val) return true;
    // HTTPS URLs (from storage) are always valid
    if (val.startsWith('http://') || val.startsWith('https://')) return true;
    // Data URLs must be within size limit
    return val.length <= MAX_BASE64_SIZE;
  },
  { message: 'File size exceeds 5MB limit' }
);

// Campaign validation schema matching database constraints
// Simplified: tracking is now entirely based on destination_url
export const campaignSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .transform(sanitizeString),
  
  description: z.string()
    .max(2000, 'Description must be less than 2000 characters')
    .transform(sanitizeString)
    .nullable()
    .optional(),
  
  cash_allotment: z.number()
    .positive('Cash allotment must be greater than 0')
    .max(1000000, 'Cash allotment exceeds maximum limit')
    .refine(val => Number.isFinite(val) && !Number.isNaN(val), 'Invalid number'),
  
  category: z.string()
    .max(100, 'Category is too long')
    .transform(sanitizeString)
    .nullable()
    .optional(),
  
  ad_format: z.enum(['landscape', 'reel', 'display'])
    .nullable()
    .optional(),
  
  image_url: dataUrlSchema,
  video_url: dataUrlSchema,
  
  start_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  
  end_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  
  code: z.string()
    .max(50, 'Promo code must be less than 50 characters')
    .regex(/^[A-Z0-9]*$/, 'Promo code must contain only uppercase letters and numbers')
    .nullable()
    .optional(),
  
  status: z.enum(['draft', 'active', 'paused', 'expired'])
    .nullable()
    .optional(),

  reward_hold_days: z.number()
    .int('Must be a whole number')
    .min(1, 'Minimum hold period is 1 day')
    .max(90, 'Maximum hold period is 90 days')
    .default(7),

  // Required destination URL for proper conversion tracking
  // All tracking flows through this URL with appended ref parameter
  destination_url: safeUrlSchema,
}).refine(
  (data) => new Date(data.end_date) >= new Date(data.start_date),
  { 
    message: 'End date must be on or after start date',
    path: ['end_date']
  }
);

export type CampaignValidationInput = z.infer<typeof campaignSchema>;

/**
 * Validates campaign data before submission
 * Returns validation result with errors if invalid
 */
export function validateCampaignData(data: unknown) {
  return campaignSchema.safeParse(data);
}

/**
 * Formats zod validation errors into user-friendly messages
 */
export function formatValidationErrors(errors: z.ZodError): string[] {
  return errors.errors.map(err => err.message);
}

/**
 * Generates the webhook callback URL for a campaign
 * Brands can share this URL with their tracking partners
 */
export function getWebhookCallbackUrl(campaignId: string): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  return `${supabaseUrl}/functions/v1/conversion-webhook?campaign_id=${campaignId}`;
}
