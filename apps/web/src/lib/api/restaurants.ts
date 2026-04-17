import { queryOptions } from '@tanstack/react-query';
import type {
  CreateMenuItemInput,
  FloorPlanTableInput,
  PaginationQueryInput,
  PublicRestaurantDetail,
  PublicRestaurantListItem,
  ReplaceFloorPlanInput,
  RestaurantFloorMap,
  RestaurantFloorTable,
  RestaurantMenuItem,
  UpdateMenuItemInput,
  UpdateRestaurantInput,
} from './contracts';
import { apiRequest } from './http';
import { queryKeys } from './query-keys';

export interface RestaurantListQuery extends PaginationQueryInput {}

const normalizeRestaurantListQuery = (query: RestaurantListQuery) => ({
  search: query.search,
  offset: query.offset ?? 0,
  limit: query.limit ?? 20,
});

export const getRestaurants = (query: RestaurantListQuery = {}) =>
  apiRequest<PublicRestaurantListItem[]>('/restaurants', {
    query: normalizeRestaurantListQuery(query),
  });

export const getRestaurant = (restaurantId: string) =>
  apiRequest<PublicRestaurantDetail>(`/restaurants/${restaurantId}`);

export const getRestaurantMenu = (restaurantId: string) =>
  apiRequest<RestaurantMenuItem[]>(`/restaurants/${restaurantId}/menu-items`);

export const getRestaurantFloorMap = (restaurantId: string) =>
  apiRequest<RestaurantFloorMap>(`/restaurants/${restaurantId}/floor-map`);

export const updateRestaurant = (restaurantId: string, input: UpdateRestaurantInput) =>
  apiRequest<PublicRestaurantDetail>(`/restaurants/${restaurantId}`, {
    method: 'PATCH',
    body: input,
  });

export const replaceFloorPlan = (restaurantId: string, input: ReplaceFloorPlanInput) =>
  apiRequest<RestaurantFloorTable[]>(`/restaurants/${restaurantId}/floor-plan`, {
    method: 'PATCH',
    body: input,
  });

export const addRestaurantImageUrl = (restaurantId: string, url: string) =>
  apiRequest<PublicRestaurantDetail>(`/restaurants/${restaurantId}/images`, {
    method: 'POST',
    body: { url },
  });

export const removeRestaurantImageUrl = (restaurantId: string, url: string) =>
  apiRequest<PublicRestaurantDetail>(`/restaurants/${restaurantId}/images`, {
    method: 'DELETE',
    body: { url },
  });

export const uploadRestaurantImage = (restaurantId: string, file: File) => {
  const formData = new FormData();
  formData.append('image', file);

  return apiRequest<PublicRestaurantDetail>(`/restaurants/${restaurantId}/images/upload`, {
    method: 'POST',
    body: formData,
  });
};

export const createMenuItem = (restaurantId: string, input: CreateMenuItemInput) =>
  apiRequest<RestaurantMenuItem>(`/restaurants/${restaurantId}/menu-items`, {
    method: 'POST',
    body: input,
  });

export const updateMenuItem = (
  restaurantId: string,
  menuItemId: string,
  input: UpdateMenuItemInput,
) =>
  apiRequest<RestaurantMenuItem>(`/restaurants/${restaurantId}/menu-items/${menuItemId}`, {
    method: 'PATCH',
    body: input,
  });

export const deleteMenuItem = (restaurantId: string, menuItemId: string) =>
  apiRequest<RestaurantMenuItem>(`/restaurants/${restaurantId}/menu-items/${menuItemId}`, {
    method: 'DELETE',
  });

export const uploadMenuItemImage = (restaurantId: string, menuItemId: string, file: File) => {
  const formData = new FormData();
  formData.append('image', file);

  return apiRequest<RestaurantMenuItem>(
    `/restaurants/${restaurantId}/menu-items/${menuItemId}/image/upload`,
    {
      method: 'POST',
      body: formData,
    },
  );
};

export const restaurantsQueryOptions = {
  list: (query: RestaurantListQuery = {}) => {
    const normalized = normalizeRestaurantListQuery(query);

    return queryOptions({
      queryKey: queryKeys.restaurants.list(normalized),
      queryFn: () => getRestaurants(normalized),
    });
  },
  detail: (restaurantId: string) =>
    queryOptions({
      queryKey: queryKeys.restaurants.detail(restaurantId),
      queryFn: () => getRestaurant(restaurantId),
      enabled: Boolean(restaurantId),
    }),
  menu: (restaurantId: string) =>
    queryOptions({
      queryKey: queryKeys.restaurants.menu(restaurantId),
      queryFn: () => getRestaurantMenu(restaurantId),
      enabled: Boolean(restaurantId),
    }),
  floorMap: (restaurantId: string) =>
    queryOptions({
      queryKey: queryKeys.restaurants.floorMap(restaurantId),
      queryFn: () => getRestaurantFloorMap(restaurantId),
      enabled: Boolean(restaurantId),
    }),
};

export const toReplaceFloorPlanInput = (tables: FloorPlanTableInput[]): ReplaceFloorPlanInput => ({
  tables,
});
