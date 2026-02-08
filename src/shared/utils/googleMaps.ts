import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

let isLoaded = false;
let optionsSet = false;

export async function loadGoogleMaps(): Promise<void> {
  if (isLoaded) return;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Debug logging
  if (!apiKey) {
    console.error('❌ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set!');
    throw new Error('Google Maps API key is missing. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment variables.');
  }

  console.log('✅ Google Maps API key found:', apiKey.substring(0, 10) + '...');

  // Set options only once before loading any library
  if (!optionsSet) {
    setOptions({
      key: apiKey,
      v: 'weekly',
    });
    optionsSet = true;
  }

  try {
    console.log('Loading Google Maps libraries...');
    await importLibrary('maps');
    await importLibrary('places');
    await importLibrary('visualization');
    await importLibrary('routes');
    await importLibrary('geocoding');
    isLoaded = true;
    console.log('✅ Google Maps loaded successfully (maps, places, visualization, routes, geocoding)');
  } catch (error) {
    console.error('❌ Failed to load Google Maps:', error);
    throw error;
  }
}
