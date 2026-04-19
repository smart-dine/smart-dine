import { staffQueryOptions } from '#/lib/api/staff';
import { authClient } from '#/lib/auth-client';
import { useQuery } from '@tanstack/react-query';

export type RestaurantRouteAccess = 'admin' | 'cashier' | 'kiosk';

export const useAuthSession = () => authClient.useSession();

export const useRestaurantRouteAccess = (
  restaurantId: string,
  routeAccess: RestaurantRouteAccess,
) => {
  const sessionQuery = authClient.useSession();

  const membershipsQuery = useQuery({
    ...staffQueryOptions.myRestaurants(),
    enabled: Boolean(sessionQuery.data?.user),
  });

  const user = sessionQuery.data?.user;
  const isAuthenticated = Boolean(user);
  const isAdmin = user?.role === 'admin';

  const membership = membershipsQuery.data?.find(
    (entry) => entry.restaurantId === restaurantId || entry.restaurant.id === restaurantId,
  );

  const isOwner = membership?.role === 'owner';
  const canAccessCashier = isAdmin || Boolean(membership);
  const canAccessAdmin = isAdmin || isOwner;

  return {
    isLoading: sessionQuery.isPending || (isAuthenticated && membershipsQuery.isPending),
    isAuthenticated,
    canAccess: routeAccess === 'admin' ? canAccessAdmin : canAccessCashier,
    membership,
    user,
    membershipsQuery,
  };
};
