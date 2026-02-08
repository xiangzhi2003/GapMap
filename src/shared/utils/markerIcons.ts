const CATEGORY_COLORS: Record<string, string> = {
  restaurant: '#ef4444',
  cafe: '#f59e0b',
  bar: '#8b5cf6',
  hotel: '#3b82f6',
  store: '#10b981',
  shopping_mall: '#10b981',
  bakery: '#fb923c',
  gym: '#06b6d4',
  spa: '#ec4899',
  hair_care: '#a855f7',
  clothing_store: '#22c55e',
  shoe_store: '#14b8a6',
  electronics_store: '#6366f1',
  fast_food: '#dc2626',
  default: '#00f0ff',
};

export function getCategoryColor(types?: string[]): string {
  if (!types || types.length === 0) return CATEGORY_COLORS.default;

  for (const type of types) {
    if (CATEGORY_COLORS[type]) {
      return CATEGORY_COLORS[type];
    }
  }

  return CATEGORY_COLORS.default;
}
