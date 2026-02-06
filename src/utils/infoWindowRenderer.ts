import { PlaceResult } from '@/types/chat';

export function renderRichInfoWindow(place: PlaceResult): string {
  const photoUrl = place.photos?.[0]?.getUrl({ maxWidth: 300 }) || '';
  const priceLevel = place.priceLevel ? '$'.repeat(place.priceLevel) : '';
  const openNowText = place.openNow === true
    ? '<span style="color: #22c55e;">🟢 Open now</span>'
    : place.openNow === false
    ? '<span style="color: #ef4444;">🔴 Closed</span>'
    : '';

  // PlaceOpeningHours has periods, not weekdayDescriptions
  // We need to format the opening hours differently
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

        <p style="margin: 8px 0; font-size: 12px; color: #aaa;">${place.address}</p>

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
