import { PlaceData } from '@/shared/types';

// Mock places data around SS15 Subang Jaya area for demo/fallback
export function getMockPlaces(type: string): PlaceData[] {
  const basePlaces: PlaceData[] = [
    // High opportunity: Low rating, high reviews (bad supply, high demand)
    {
      placeId: 'mock_1',
      name: `SS15 ${capitalize(type)} Corner`,
      location: { lat: 3.0745, lng: 101.5875 },
      rating: 2.8,
      userRatingCount: 245,
      types: [type],
    },
    {
      placeId: 'mock_2',
      name: `Old Town ${capitalize(type)} SS15`,
      location: { lat: 3.0728, lng: 101.5895 },
      rating: 3.1,
      userRatingCount: 189,
      types: [type],
    },
    {
      placeId: 'mock_3',
      name: `Subang ${capitalize(type)} House`,
      location: { lat: 3.0755, lng: 101.5868 },
      rating: 3.2,
      userRatingCount: 156,
      types: [type],
    },
    // Medium opportunity: Average rating, medium reviews
    {
      placeId: 'mock_4',
      name: `SS15 Central ${capitalize(type)}`,
      location: { lat: 3.0738, lng: 101.5883 },
      rating: 3.8,
      userRatingCount: 89,
      types: [type],
    },
    {
      placeId: 'mock_5',
      name: `Taylor's ${capitalize(type)}`,
      location: { lat: 3.0720, lng: 101.5910 },
      rating: 3.6,
      userRatingCount: 124,
      types: [type],
    },
    {
      placeId: 'mock_6',
      name: `Subang Parade ${capitalize(type)}`,
      location: { lat: 3.0765, lng: 101.5850 },
      rating: 3.9,
      userRatingCount: 67,
      types: [type],
    },
    {
      placeId: 'mock_7',
      name: `Avenue ${capitalize(type)} SS15`,
      location: { lat: 3.0712, lng: 101.5898 },
      rating: 4.0,
      userRatingCount: 45,
      types: [type],
    },
    // Saturated: High rating, high reviews (good supply, satisfied demand)
    {
      placeId: 'mock_8',
      name: `Premium ${capitalize(type)} Lounge`,
      location: { lat: 3.0750, lng: 101.5920 },
      rating: 4.9,
      userRatingCount: 312,
      types: [type],
    },
    {
      placeId: 'mock_9',
      name: `Golden ${capitalize(type)} Subang`,
      location: { lat: 3.0732, lng: 101.5865 },
      rating: 4.8,
      userRatingCount: 278,
      types: [type],
    },
    {
      placeId: 'mock_10',
      name: `Elite ${capitalize(type)} Center`,
      location: { lat: 3.0770, lng: 101.5892 },
      rating: 4.7,
      userRatingCount: 198,
      types: [type],
    },
    // Mixed: Various combinations
    {
      placeId: 'mock_11',
      name: `New ${capitalize(type)} Spot SS15`,
      location: { lat: 3.0725, lng: 101.5878 },
      rating: 4.2,
      userRatingCount: 23,
      types: [type],
    },
    {
      placeId: 'mock_12',
      name: `Hidden ${capitalize(type)} Gem`,
      location: { lat: 3.0758, lng: 101.5905 },
      rating: 2.5,
      userRatingCount: 312,
      types: [type],
    },
    {
      placeId: 'mock_13',
      name: `${capitalize(type)} Express SS15`,
      location: { lat: 3.0715, lng: 101.5862 },
      rating: 3.3,
      userRatingCount: 178,
      types: [type],
    },
    {
      placeId: 'mock_14',
      name: `Metro ${capitalize(type)} Subang`,
      location: { lat: 3.0742, lng: 101.5915 },
      rating: 4.5,
      userRatingCount: 89,
      types: [type],
    },
    {
      placeId: 'mock_15',
      name: `Urban ${capitalize(type)} Co. SS15`,
      location: { lat: 3.0768, lng: 101.5872 },
      rating: 3.0,
      userRatingCount: 234,
      types: [type],
    },
  ];

  return basePlaces;
}

function capitalize(str: string): string {
  return str
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
