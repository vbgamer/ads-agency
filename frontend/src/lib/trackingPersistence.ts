/**
 * ADSSIMSIM Tracking Persistence Module
 * Stores tracking_id in localStorage + cookie for 30-day persistence
 * Handles cross-session tracking for improved conversion attribution
 */

const STORAGE_KEY = 'adssimsim_tracking';
const COOKIE_NAME = 'adssimsim_ref';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

interface TrackingData {
  trackingId: string;
  campaignId: string;
  clickedAt: string;
  expiresAt: string;
  source?: string;
}

/**
 * Set a cookie with the tracking ID
 */
function setCookie(trackingId: string): void {
  const expiresDate = new Date(Date.now() + COOKIE_MAX_AGE * 1000);
  document.cookie = `${COOKIE_NAME}=${trackingId}; expires=${expiresDate.toUTCString()}; path=/; SameSite=Lax; Secure`;
}

/**
 * Get tracking ID from cookie
 */
function getCookie(): string | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === COOKIE_NAME) {
      return value;
    }
  }
  return null;
}

/**
 * Clear the tracking cookie
 */
function clearCookie(): void {
  document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

/**
 * Store tracking data in localStorage and cookie
 */
export function storeTrackingData(trackingId: string, campaignId: string, source?: string): void {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + COOKIE_MAX_AGE * 1000);
  
  const data: TrackingData = {
    trackingId,
    campaignId,
    clickedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    source,
  };

  try {
    // Store in localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    
    // Also set cookie as backup
    setCookie(trackingId);
    
    console.log('[ADSSIMSIM] Tracking data stored:', { trackingId, campaignId });
  } catch (error) {
    console.warn('[ADSSIMSIM] Failed to store tracking data:', error);
  }
}

/**
 * Retrieve tracking data from storage
 * Checks localStorage first, then cookie as fallback
 */
export function getTrackingData(): TrackingData | null {
  try {
    // Try localStorage first
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data: TrackingData = JSON.parse(stored);
      
      // Check if expired
      if (new Date(data.expiresAt) > new Date()) {
        return data;
      } else {
        // Expired, clean up
        clearTrackingData();
        return null;
      }
    }

    // Fallback to cookie
    const cookieTrackingId = getCookie();
    if (cookieTrackingId) {
      return {
        trackingId: cookieTrackingId,
        campaignId: '',
        clickedAt: '',
        expiresAt: new Date(Date.now() + COOKIE_MAX_AGE * 1000).toISOString(),
      };
    }

    return null;
  } catch (error) {
    console.warn('[ADSSIMSIM] Failed to retrieve tracking data:', error);
    return null;
  }
}

/**
 * Get just the tracking ID (convenience method)
 */
export function getStoredTrackingId(): string | null {
  const data = getTrackingData();
  return data?.trackingId || null;
}

/**
 * Clear all tracking data
 */
export function clearTrackingData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    clearCookie();
    console.log('[ADSSIMSIM] Tracking data cleared');
  } catch (error) {
    console.warn('[ADSSIMSIM] Failed to clear tracking data:', error);
  }
}

/**
 * Check if there's active tracking
 */
export function hasActiveTracking(): boolean {
  return getTrackingData() !== null;
}

/**
 * Extract tracking ID from URL parameters
 */
export function extractTrackingFromUrl(): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('ref') || urlParams.get('tracking_id') || urlParams.get('trk');
}

/**
 * Initialize tracking from URL if present
 * Call this on app load to capture tracking IDs from campaign links
 */
export function initializeTracking(): void {
  const urlTrackingId = extractTrackingFromUrl();
  
  if (urlTrackingId) {
    // Extract campaign ID from URL if available
    const urlParams = new URLSearchParams(window.location.search);
    const campaignId = urlParams.get('campaign') || '';
    const source = urlParams.get('utm_source') || 'direct';
    
    storeTrackingData(urlTrackingId, campaignId, source);
    
    // Optionally clean URL (remove tracking params)
    // This prevents users from sharing tracked URLs
    // Uncomment if desired:
    // cleanTrackingFromUrl();
  }
}

/**
 * Remove tracking parameters from URL without page reload
 */
export function cleanTrackingFromUrl(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete('ref');
  url.searchParams.delete('tracking_id');
  url.searchParams.delete('trk');
  
  window.history.replaceState({}, '', url.toString());
}

/**
 * Get tracking info for conversion reporting
 */
export function getTrackingForConversion(): { trackingId: string; campaignId: string } | null {
  const data = getTrackingData();
  if (!data?.trackingId) return null;
  
  return {
    trackingId: data.trackingId,
    campaignId: data.campaignId,
  };
}

/**
 * Mark tracking as converted (prevents duplicate conversions)
 */
export function markAsConverted(): void {
  const data = getTrackingData();
  if (data) {
    // Store conversion timestamp
    const convertedData = {
      ...data,
      convertedAt: new Date().toISOString(),
    };
    localStorage.setItem(`${STORAGE_KEY}_converted`, JSON.stringify(convertedData));
    
    // Clear active tracking to prevent duplicates
    clearTrackingData();
  }
}

/**
 * Check if this tracking ID was already converted
 */
export function wasAlreadyConverted(trackingId: string): boolean {
  try {
    const converted = localStorage.getItem(`${STORAGE_KEY}_converted`);
    if (converted) {
      const data = JSON.parse(converted);
      return data.trackingId === trackingId;
    }
    return false;
  } catch {
    return false;
  }
}
