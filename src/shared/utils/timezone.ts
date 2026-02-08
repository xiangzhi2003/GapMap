/**
 * Time Zone API Utility
 * Fetches timezone information for any location.
 * Useful for multi-country analysis and accurate operating hours display.
 */

export interface TimezoneData {
  timeZoneId: string; // e.g. "Asia/Kuala_Lumpur"
  timeZoneName: string; // e.g. "Malaysia Time"
  rawOffset: number; // seconds offset from UTC
  dstOffset: number; // daylight saving offset in seconds
  localTime: string; // formatted local time string
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const timezoneCache = new Map<string, TimezoneData>();

/**
 * Get timezone information for a location.
 */
export async function getTimezone(
  lat: number,
  lng: number
): Promise<TimezoneData | null> {
  const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  if (timezoneCache.has(cacheKey)) {
    return timezoneCache.get(cacheKey)!;
  }

  if (!API_KEY) return null;

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lng}&timestamp=${timestamp}&key=${API_KEY}`
    );

    if (!response.ok) {
      console.warn('Time Zone API error:', response.status);
      return null;
    }

    const data = await response.json();

    if (data.status !== 'OK') {
      console.warn('Time Zone API status:', data.status);
      return null;
    }

    // Calculate local time
    const utcMs = Date.now();
    const localMs = utcMs + (data.rawOffset + data.dstOffset) * 1000;
    const localDate = new Date(localMs);
    const localTime = localDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC', // We already applied the offset
    });

    const result: TimezoneData = {
      timeZoneId: data.timeZoneId,
      timeZoneName: data.timeZoneName,
      rawOffset: data.rawOffset,
      dstOffset: data.dstOffset,
      localTime,
    };

    timezoneCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Time Zone API error:', error);
    return null;
  }
}

/**
 * Format a time in a specific timezone for display.
 */
export function formatTimeInZone(date: Date, timeZoneId: string): string {
  try {
    return date.toLocaleString('en-US', {
      timeZone: timeZoneId,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return date.toLocaleTimeString();
  }
}
