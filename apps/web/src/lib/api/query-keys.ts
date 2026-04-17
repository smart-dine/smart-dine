export const queryKeys = {
  admin: {
    restaurants: () => ['admin', 'restaurants'] as const,
    users: (params: { search?: string; offset?: number; limit?: number }) =>
      ['admin', 'users', params] as const,
  },
  staff: {
    myRestaurants: () => ['staff', 'my-restaurants'] as const,
    restaurantStaff: (restaurantId: string) => ['staff', 'restaurant', restaurantId] as const,
  },
  restaurants: {
    list: (params: { search?: string; offset?: number; limit?: number }) =>
      ['restaurants', 'list', params] as const,
    detail: (restaurantId: string) => ['restaurants', 'detail', restaurantId] as const,
    menu: (restaurantId: string) => ['restaurants', 'menu', restaurantId] as const,
    floorMap: (restaurantId: string) => ['restaurants', 'floor-map', restaurantId] as const,
    reservations: (restaurantId: string) => ['restaurants', 'reservations', restaurantId] as const,
    orders: (restaurantId: string, params: { status?: string }) =>
      ['restaurants', 'orders', restaurantId, params] as const,
  },
} as const;
