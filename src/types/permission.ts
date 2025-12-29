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

export interface PermissionInterface {
  id: Permission;
  description?: string;
}

export const GROUP_RULES: { label: string; match: RegExp }[] = [
  { label: 'Site', match: /_site$/ },
  { label: 'Building', match: /(^|_)building(_|$)/ },
  { label: 'User', match: /_user|_users$/ },
  { label: 'Permission', match: /_permission/ },
  { label: 'Restaurant', match: /(^|_)restaurant(_|$)/ },
  { label: 'Order', match: /order/ },
  { label: 'Menu', match: /_menu$/ },
  { label: 'Dish', match: /_dish$/ },
  { label: 'Facility', match: /facility/ },
  { label: 'Parking', match: /_parking/ },
  { label: 'Bus Route', match: /bus_route/ },
  { label: 'Bus', match: /_bus(es)?$/ },
  { label: 'Booking Bus', match: /booking_bus/ },
  { label: 'Event', match: /event/ },
  { label: 'Information', match: /information/ },
  { label: 'Sales', match: /(^|_)sales(_|$)/ },
];

export interface GroupedPermission {
  group: string;
  permissions: PermissionInterface[];
}

export function groupPermissions(permissions: PermissionInterface[]): GroupedPermission[] {
  const grouped: Record<string, PermissionInterface[]> = {};

  permissions.forEach((permission) => {
    const rule = GROUP_RULES.find((r) => r.match.test(permission.id));
    const group = rule?.label ?? 'Other';
    if (!grouped[group]) {
      grouped[group] = [];
    }

    grouped[group].push(permission);
  });

  return Object.entries(grouped).map(([group, permissions]) => ({
    group,
    permissions,
  }));
}
