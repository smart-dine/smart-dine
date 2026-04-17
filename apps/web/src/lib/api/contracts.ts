import type { InferSelectModel, schema } from '@smartdine/db';

type Jsonify<T> = T extends Date
  ? string
  : T extends Array<infer U>
    ? Array<Jsonify<U>>
    : T extends object
      ? { [K in keyof T]: Jsonify<T[K]> }
      : T;

type RestaurantRow = InferSelectModel<typeof schema.restaurants>;
type RestaurantTableRow = InferSelectModel<typeof schema.restaurantTables>;
type MenuItemRow = InferSelectModel<typeof schema.menuItems>;
type StaffRoleRow = InferSelectModel<typeof schema.staffRoles>;
type UserRow = InferSelectModel<typeof schema.users>;
type ReservationRow = InferSelectModel<typeof schema.reservations>;
type OrderRow = InferSelectModel<typeof schema.orders>;
type OrderItemRow = InferSelectModel<typeof schema.orderItems>;

export type UserRole = UserRow['role'];
export type StaffRole = StaffRoleRow['role'];
export type TableShape = RestaurantTableRow['shape'];
export type ReservationStatus = ReservationRow['status'];
export type OrderStatus = OrderRow['status'];

export type OpeningHours = Jsonify<RestaurantRow['openingHours']>;

export type AdminUser = Jsonify<Pick<UserRow, 'id' | 'name' | 'email' | 'image' | 'role'>>;

export type AdminRestaurant = Jsonify<
  RestaurantRow & {
    staffRoles: Array<
      StaffRoleRow & {
        user: Pick<UserRow, 'id' | 'name' | 'email' | 'image'>;
      }
    >;
  }
>;

export type DeleteRestaurantResult = Jsonify<{
  deleted: boolean;
  restaurantId: string;
}>;

export type PublicRestaurantListItem = Jsonify<
  Pick<
    RestaurantRow,
    'id' | 'name' | 'description' | 'address' | 'phone' | 'images' | 'openingHours' | 'createdAt'
  >
>;

export type PublicRestaurantDetail = Jsonify<
  RestaurantRow & {
    menuItems: Array<
      Pick<MenuItemRow, 'id' | 'name' | 'description' | 'price' | 'image' | 'isAvailable'>
    >;
  }
>;

export type RestaurantMenuItem = Jsonify<MenuItemRow>;

export type RestaurantFloorTable = Jsonify<
  Pick<
    RestaurantTableRow,
    'id' | 'tableNumber' | 'capacity' | 'xCoordinate' | 'yCoordinate' | 'shape'
  >
>;

export type RestaurantFloorMap = Jsonify<
  Pick<RestaurantRow, 'id' | 'name' | 'openingHours'> & {
    tables: Array<
      Pick<
        RestaurantTableRow,
        'id' | 'tableNumber' | 'capacity' | 'xCoordinate' | 'yCoordinate' | 'shape'
      >
    >;
  }
>;

export type StaffMembership = Jsonify<
  StaffRoleRow & {
    restaurant: Pick<RestaurantRow, 'id' | 'name' | 'description' | 'address' | 'phone' | 'images'>;
  }
>;

export type RestaurantStaffAssignment = Jsonify<
  StaffRoleRow & {
    user: Pick<UserRow, 'id' | 'name' | 'email' | 'image' | 'role'>;
  }
>;

export type RestaurantReservation = Jsonify<
  ReservationRow & {
    table: Pick<RestaurantTableRow, 'id' | 'tableNumber' | 'capacity'>;
    customer: Pick<UserRow, 'id' | 'name' | 'email' | 'image'>;
  }
>;

export type ReservationStatusUpdated = Jsonify<ReservationRow>;

export type RestaurantOrder = Jsonify<
  OrderRow & {
    table: Pick<RestaurantTableRow, 'id' | 'tableNumber' | 'capacity'>;
    operator?: Pick<UserRow, 'id' | 'name' | 'email'>;
    orderItems: Array<
      Pick<OrderItemRow, 'id' | 'quantity' | 'specialInstructions'> & {
        menuItem: Pick<MenuItemRow, 'id' | 'name' | 'price' | 'image'>;
      }
    >;
  }
>;

export interface PaginationQueryInput {
  offset?: number;
  limit?: number;
  search?: string;
}

export interface CreateAdminRestaurantInput {
  name: string;
  description?: string;
  address: string;
  phone: string;
  openingHours: OpeningHours;
  images?: string[];
  ownerUserId: string;
}

export interface UpdateRestaurantOwnerInput {
  ownerUserId: string;
}

export interface UpdateRestaurantInput {
  name?: string;
  description?: string;
  address?: string;
  phone?: string;
  openingHours?: OpeningHours;
  images?: string[];
}

export interface CreateMenuItemInput {
  name: string;
  description?: string;
  price: number;
  isAvailable?: boolean;
  image?: string;
}

export type UpdateMenuItemInput = Partial<CreateMenuItemInput>;

export interface FloorPlanTableInput {
  id?: string;
  tableNumber: string;
  capacity: number;
  xCoordinate: number;
  yCoordinate: number;
  shape: TableShape;
}

export interface ReplaceFloorPlanInput {
  tables: FloorPlanTableInput[];
}

export interface UpsertStaffRoleInput {
  userId: string;
  role: StaffRole;
}

export interface UpdateStaffRoleInput {
  role: StaffRole;
}

export interface UpdateReservationStatusInput {
  status: ReservationStatus;
}

export interface UpdateOrderStatusInput {
  status: OrderStatus;
}

export interface CreateOrderItemInput {
  menuItemId: string;
  quantity: number;
  specialInstructions?: string;
}

export interface CreateOrderInput {
  tableId: string;
  items: CreateOrderItemInput[];
}
