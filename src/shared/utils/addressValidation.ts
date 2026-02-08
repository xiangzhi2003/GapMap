/**
 * Address Validation API Utility
 * Validates and corrects Malaysian addresses before geocoding.
 * Catches typos and suggests corrections.
 */

export interface AddressValidationResult {
  isValid: boolean;
  formattedAddress: string;
  addressComponents: {
    streetNumber?: string;
    route?: string;
    locality?: string;
    administrativeArea?: string;
    postalCode?: string;
    country?: string;
  };
  location?: { lat: number; lng: number };
  verdict: 'confirmed' | 'corrected' | 'unconfirmed';
  corrections: string[];
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

/**
 * Validate an address using Google Address Validation API.
 * Returns validation result with corrections if any.
 */
export async function validateAddress(
  address: string,
  regionCode: string = 'MY' // Default to Malaysia
): Promise<AddressValidationResult | null> {
  if (!API_KEY) return null;

  try {
    const response = await fetch(
      `https://addressvalidation.googleapis.com/v1:validateAddress?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: {
            addressLines: [address],
            regionCode,
          },
        }),
      }
    );

    if (!response.ok) {
      console.warn('Address Validation API error:', response.status);
      return null;
    }

    const data = await response.json();
    const result = data.result;

    if (!result) return null;

    const verdict = result.verdict;
    const geocode = result.geocode;
    const addressObj = result.address;

    // Extract address components
    const components: AddressValidationResult['addressComponents'] = {};
    if (addressObj?.addressComponents) {
      for (const comp of addressObj.addressComponents) {
        const type = comp.componentType;
        const name = comp.componentName?.text || '';
        if (type === 'street_number') components.streetNumber = name;
        if (type === 'route') components.route = name;
        if (type === 'locality') components.locality = name;
        if (type === 'administrative_area_level_1') components.administrativeArea = name;
        if (type === 'postal_code') components.postalCode = name;
        if (type === 'country') components.country = name;
      }
    }

    // Collect corrections
    const corrections: string[] = [];
    if (addressObj?.addressComponents) {
      for (const comp of addressObj.addressComponents) {
        if (comp.replaced || comp.spellCorrected) {
          corrections.push(`"${comp.componentName?.text}" was corrected`);
        }
      }
    }

    const isValid =
      verdict?.addressComplete === true ||
      verdict?.validationGranularity === 'PREMISE' ||
      verdict?.validationGranularity === 'SUB_PREMISE';

    let verdictStr: AddressValidationResult['verdict'];
    if (corrections.length === 0 && isValid) {
      verdictStr = 'confirmed';
    } else if (corrections.length > 0) {
      verdictStr = 'corrected';
    } else {
      verdictStr = 'unconfirmed';
    }

    return {
      isValid,
      formattedAddress: addressObj?.formattedAddress || address,
      addressComponents: components,
      location: geocode?.location
        ? { lat: geocode.location.latitude, lng: geocode.location.longitude }
        : undefined,
      verdict: verdictStr,
      corrections,
    };
  } catch (error) {
    console.error('Address Validation error:', error);
    return null;
  }
}
