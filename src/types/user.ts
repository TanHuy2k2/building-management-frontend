export enum UserRole {
  MANAGER = 'manager',
  USER = 'user',
}

export enum UserRank {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
}

export enum RankDiscount {
  BRONZE = 0,
  SILVER = 2,
  GOLD = 5,
  PLATINUM = 10,
}

export enum ActiveStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum Permission {
  CREATE_SITE = 'create_site',
  UPDATE_SITE = 'update_site',
  CREATE_BUILDING = 'create_building',
  UPDATE_BUILDING = 'update_building',
  GET_ALL_USERS = 'get_all_users',
  GET_USER_DETAIL = 'get_user_detail',
  UPDATE_USER = 'update_user',
  CREATE_USER = 'create_user',
  GET_ALL_PERMISSIONS = 'get_all_permissions',
  GET_PERMISSION = 'get_permission',
  CREATE_PERMISSION = 'create_permission',
  UPDATE_PERMISSION = 'update_permission',
  CREATE_RESTAURANT = 'create_restaurant',
  UPDATE_RESTAURANT = 'update_restaurant',
  VIEW_SALES = 'view_sales',
  VIEW_ORDER_LIST = 'view_order_list',
  UPDATE_ORDER_STATUS = 'update_order_status',
  CREATE_DISH = 'create_dish',
  UPDATE_DISH = 'update_dish',
  VIEW_MENU = 'view_menu',
  CREATE_MENU = 'create_menu',
  UPDATE_MENU = 'update_menu',
  CREATE_PARKING_SPACE = 'create_parking_space',
  UPDATE_PARKING_SPACE = 'update_parking_space',
  CREATE_FACILITY = 'create_facility',
  UPDATE_FACILITY = 'update_facility',
  UPDATE_EVENT_BOOKING_STATUS = 'update_event_booking_status',
  CREATE_BUS = 'create_bus',
  GET_ALL_BUSES = 'get_all_buses',
  GET_BUS = 'get_bus',
  UPDATE_BUS = 'update_bus',
  CREATE_BUS_ROUTE = 'create_bus_route',
  GET_ALL_BUS_ROUTES = 'get_all_bus_routes',
  GET_BUS_ROUTE_DETAIL = 'get_bus_route_detail',
  UPDATE_BUS_ROUTE = 'update_bus_route',
  UPDATE_BUS_ROUTE_STATUS = 'update_bus_route_status',
  GET_EVENT_PARTICIPANTS = 'get_event_participants',
  GET_BOOKING_BUS_DETAIL = 'get_booking_bus_detail',
  GET_ALL_BOOKING_BUS = 'get_all_booking_bus',
  CREATE_BOOKING_BUS = 'create_booking_bus',
  CREATE_INFORMATION = 'create_information',
  VIEW_INFORMATION_LIST = 'view_information_list',
}

export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  phone: string;
  image_url?: string | null;
  rank?: UserRank;
  points?: number | null;
  role: UserRole;
  permissions?: string[] | null;
  status: ActiveStatus;
  created_at?: Date;
  updated_at?: Date | null;
  created_by?: string;
  updated_by?: string | null;
}

export interface CreateUserDto extends Pick<
  User,
  'email' | 'username' | 'full_name' | 'phone' | 'role' | 'permissions'
> {
  password: string;
  confirm_password: string;
}
