import { PlaceResult } from '@/shared/types/chat';

export function renderRichInfoWindow(place: PlaceResult): string {
  const photoUrl = place.photos?.[0]?.getUrl({ maxWidth: 300 }) || '';
  const priceLevel = place.priceLevel ? '$'.repeat(place.priceLevel) : '';
  const openNowText = place.openNow === true
    ? '<span style="color: #22c55e;">🟢 Open now</span>'
    : place.openNow === false
    ? '<span style="color: #ef4444;">🔴 Closed</span>'
    : '';

  // PlaceOpeningHours has periods, not weekdayDescriptions
  const hours = place.openingHours?.periods?.map((period: google.maps.places.PlaceOpeningHoursPeriod) => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const open = period.open;
    const close = period.close;
    if (!open) return '';
    const dayName = dayNames[open.day];
    const openTime = `${open.hours?.toString().padStart(2, '0')}:${open.minutes?.toString().padStart(2, '0')}`;
    const closeTime = close ? `${close.hours?.toString().padStart(2, '0')}:${close.minutes?.toString().padStart(2, '0')}` : 'Open 24h';
    return `<div style="font-size: 11px; color: #999;">${dayName}: ${openTime} - ${closeTime}</div>`;
  }).join('') || '';

  const reviews = place.reviews?.map(review => `
    <div style="border-top: 1px solid #2a2a3a; padding: 8px 0;">
      <div style="font-size: 12px; color: #00f0ff; font-weight: 600;">${review.author_name}</div>
      <div style="font-size: 11px; color: #999;">⭐ ${review.rating}/5</div>
      <div style="font-size: 11px; color: #ccc; margin-top: 4px;">${review.text?.substring(0, 150)}${review.text && review.text.length > 150 ? '...' : ''}</div>
    </div>
  `).join('') || '';

  // Build service badges from enhanced Places API (New) data
  const serviceBadges = buildServiceBadges(place);

  // Build environment badges (elevation, air quality, timezone)
  const environmentBadges = buildEnvironmentBadges(place);

  return `
    <div style="background: #12121a; color: white; padding: 0; border-radius: 8px; font-family: system-ui; min-width: 300px; max-width: 400px; overflow: hidden;">
      ${photoUrl ? `<img src="${photoUrl}" style="width: 100%; height: 180px; object-fit: cover;">` : ''}

      <div style="padding: 14px;">
        <h3 style="margin: 0 0 6px; color: #00f0ff; font-size: 16px;">${place.name}</h3>

        ${place.rating ? `
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span style="font-size: 14px;">⭐ ${place.rating.toFixed(1)}</span>
            <span style="font-size: 12px; color: #999;">(${place.userRatingsTotal || 0} reviews)</span>
            ${priceLevel ? `<span style="color: #00f0ff; font-size: 13px;">${priceLevel}</span>` : ''}
          </div>
        ` : ''}

        ${openNowText ? `<div style="margin-bottom: 8px; font-size: 13px;">${openNowText}</div>` : ''}

        ${serviceBadges ? `<div style="margin-bottom: 10px;">${serviceBadges}</div>` : ''}

        <p style="margin: 8px 0; font-size: 12px; color: #aaa;">${place.address}</p>

        ${environmentBadges ? `<div style="margin-bottom: 10px;">${environmentBadges}</div>` : ''}

        ${place.phoneNumber ? `
          <div style="margin: 8px 0;">
            <a href="tel:${place.phoneNumber}" style="color: #00f0ff; font-size: 13px; text-decoration: none;">
              📞 ${place.phoneNumber}
            </a>
          </div>
        ` : ''}

        ${place.website ? `
          <div style="margin: 8px 0;">
            <a href="${place.website}" target="_blank" rel="noopener" style="color: #00f0ff; font-size: 13px; text-decoration: none;">
              🌐 Visit Website
            </a>
          </div>
        ` : ''}

        ${hours ? `
          <details style="margin-top: 12px;">
            <summary style="cursor: pointer; font-size: 13px; color: #00f0ff; font-weight: 600;">Opening Hours</summary>
            <div style="margin-top: 8px; padding-left: 8px;">
              ${hours}
            </div>
          </details>
        ` : ''}

        ${reviews ? `
          <details style="margin-top: 12px;">
            <summary style="cursor: pointer; font-size: 13px; color: #00f0ff; font-weight: 600;">Reviews</summary>
            ${reviews}
          </details>
        ` : ''}

        ${place.url ? `
          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #2a2a3a;">
            <a href="${place.url}" target="_blank" rel="noopener" style="color: #ff00ff; font-size: 13px; text-decoration: none;">
              🗺️ View on Google Maps →
            </a>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * Build service badges from Places API (New) enhanced fields.
 * Shows delivery, takeout, dine-in, outdoor seating, wheelchair access, parking.
 */
function buildServiceBadges(place: PlaceResult): string {
  const badges: string[] = [];

  const badgeStyle = (color: string) =>
    `display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; margin: 2px; border: 1px solid ${color}33; color: ${color}; background: ${color}15;`;

  if (place.dineIn) badges.push(`<span style="${badgeStyle('#22c55e')}">🍽️ Dine-in</span>`);
  if (place.takeout) badges.push(`<span style="${badgeStyle('#f59e0b')}">📦 Takeout</span>`);
  if (place.delivery) badges.push(`<span style="${badgeStyle('#3b82f6')}">🚚 Delivery</span>`);
  if (place.outdoorSeating) badges.push(`<span style="${badgeStyle('#06b6d4')}">☀️ Outdoor</span>`);
  if (place.wheelchairAccessible) badges.push(`<span style="${badgeStyle('#8b5cf6')}">♿ Accessible</span>`);
  if (place.parkingOptions && place.parkingOptions.length > 0) {
    badges.push(`<span style="${badgeStyle('#64748b')}">🅿️ Parking</span>`);
  }

  return badges.length > 0
    ? `<div style="display: flex; flex-wrap: wrap; gap: 2px;">${badges.join('')}</div>`
    : '';
}

/**
 * Build environment badges from elevation, air quality, and timezone data.
 */
function buildEnvironmentBadges(place: PlaceResult): string {
  const badges: string[] = [];

  const badgeStyle = (color: string) =>
    `display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; margin: 2px; border: 1px solid ${color}33; color: ${color}; background: ${color}15;`;

  if (place.elevation !== undefined) {
    const elevColor = place.elevation < 10 ? '#ef4444' : place.elevation < 30 ? '#f59e0b' : '#22c55e';
    const riskLabel = place.elevation < 10 ? 'Flood Risk' : place.elevation < 30 ? 'Low Area' : '';
    badges.push(`<span style="${badgeStyle(elevColor)}">⛰️ ${place.elevation.toFixed(0)}m${riskLabel ? ` - ${riskLabel}` : ''}</span>`);
  }

  if (place.airQualityIndex !== undefined && place.airQualityCategory) {
    const aqiColor = place.airQualityIndex <= 50 ? '#22c55e' : place.airQualityIndex <= 100 ? '#eab308' : '#ef4444';
    badges.push(`<span style="${badgeStyle(aqiColor)}">🌬️ AQI ${place.airQualityIndex} - ${place.airQualityCategory}</span>`);
  }

  if (place.localTime && place.timezone) {
    badges.push(`<span style="${badgeStyle('#64748b')}">🕐 ${place.localTime} (${place.timezone})</span>`);
  }

  return badges.length > 0
    ? `<div style="display: flex; flex-wrap: wrap; gap: 2px;">${badges.join('')}</div>`
    : '';
}
