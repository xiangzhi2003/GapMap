import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { lat, lng, address, radiusKm } = body;

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 });
    }

    // Distance Matrix API is called client-side via Google Maps JS SDK
    // This route serves as a proxy for future server-side enrichment
    // (e.g., combining with census data, foot traffic estimates)
    return NextResponse.json({
      targetLocation: { lat, lng },
      targetAddress: address || '',
      radiusKm: radiusKm || 3,
      message: 'Use client-side Distance Matrix API for real-time accessibility calculation',
    });
  } catch (error) {
    console.error('Accessibility API error:', error);
    const message = error instanceof Error ? error.message : 'Failed to process accessibility request';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
