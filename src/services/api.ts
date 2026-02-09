import { ENV } from '../utils/constants';

export async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${ENV.BE_API_URL}${endpoint}`, {
    ...options,
  });

  return response.json();
}

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh-token',

  // Permissions
  PERMISSIONS: '/permissions',

  // Users
  USERS: '/users',
  USERS_STATS: '/users/stats',
  CREATE_USER: '/users/create',
  PROFILE: '/users/profile',
  UPDATE_PASSWORD: '/users/update-password',
  USER_BY_ID: (id: string) => `/users/${id}`,
  USER_DETAIL_BY_ID: (id: string) => `/users/${id}/detail`,
  USER_PERMISSIONS_BY_ID: (id: string) => `/users/${id}/permissions`,
  USERS_BY_ROLE: (role: string) => `/users?role=${role}`,

  // Buildings
  BUILDINGS: '/buildings',
  BUILDING_BY_ID: (id: string) => `/buildings/${id}`,
  CREATE_BUILDING: '/buildings/create',
  UPDATE_BUILDING: (id: string) => `/buildings/update/${id}`,
  UPDATE_BUILDING_STATUS: (id: string) => `/buildings/update-status/${id}`,
  BUILDING_STATS: '/buildings/stats',

  // Facilities
  FACILITIES: '/facilities',
  FACILITY_BY_ID: (id: string) => `/facilities/${id}`,
  CREATE_FACILITY: '/facilities/create',
  UPDATE_FACILITY: (id: string) => `/facilities/update/${id}`,
  UPDATE_FACILITY_STATUS: (id: string) => `/facilities/update-status/${id}`,
  FACILITY_STATS: '/facilities/stats',

  // Reservations
  RESERVATIONS: '/facility_reservations',
  RESERVATION_BY_ID: (id: string) => `/facility_reservations/${id}`,
  CREATE_FACILITY_RESERVATION: '/facility_reservations/create',
  RESERVATION_BY_USER: '/facility_reservations/user',

  // Parking spaces
  PARKING_SPACES: '/parking_spaces',
  PARKING_SPACE_STATS: '/parking_spaces/stats',

  // Parking subscriptions
  PARKING_SUBSCRIPTION: (parkingId: string) => `/parking_spaces/${parkingId}/parking_subscriptions`,
  CURRENT_PARKING_SUBSCRIPTION: (parkingId: string) =>
    `/parking_spaces/${parkingId}/parking_subscriptions/current`,
  CREATE_SUBSCRIPTION: (parkingId: string) =>
    `/parking_spaces/${parkingId}/parking_subscriptions/create`,

  // Restaurants
  RESTAURANTS: '/restaurants',
  RESTAURANT_CREATE: '/restaurants/create',
  RESTAURANT_STATS: '/restaurants/stats',
  RESTAURANT_BY_ID: (id: string) => `/restaurants/${id}`,
  RESTAURANT_MENU: (id: string) => `/restaurants/${id}/menu`,
  RESTAURANT_DAILY_SALE: (id: string) => `/restaurants/${id}/daily-sale`,
  RESTAURANT_DISH_SALE: (id: string) => `/restaurants/${id}/dish-sale`,
  RESTAURANT_UPDATE: (id: string) => `/restaurants/update/${id}`,
  RESTAURANT_UPDATE_STATUS: (id: string) => `/restaurants/update-status/${id}`,

  // Menu Schedules
  MENU_SCHEDULES: '/menu_schedules',
  MENU_SCHEDULE_CREATE: '/menu_schedules/create',
  MENU_SCHEDULES_BY_ID: (id: string) => `/menu_schedules/${id}`,
  MENU_SCHEDULES_ITEMS: (id: string) => `/menu_schedules/${id}/items`,
  MENU_SCHEDULES_ITEMS_BY_ID: (id: string, itemId: string) =>
    `/menu_schedules/${id}/items/${itemId}`,

  // ===== DISH =====
  DISHES: '/available_dishes',
  DISH_CREATE: '/available_dishes/create',
  DISH_BY_ID: (dishId: string) => `/available_dishes/${dishId}`,
  UPDATE_DISH_BY_ID: (dishId: string) => `/available_dishes/update/${dishId}`,

  // Orders
  ORDERS: '/orders',
  ORDERS_LIST_BY_USER: '/orders/me',
  ORDERS_HISTORY_BY_USER: '/orders/history',
  ORDERS_CREATE: '/orders/create',
  ORDER_BY_ID: (id: string) => `/orders/${id}`,
  UPDATE_ORDER_BY_ID: (id: string) => `/orders/update/${id}`,
  UPDATE_ORDER_STATUS: (id: string) => `/orders/update-status/${id}`,

  // Parking
  PARKING_SLOTS: '/parking/slots',
  PARKING_REGISTRATIONS: '/parking/registrations',
  CREATE_PARKING_REGISTRATION: '/parking/registrations',

  // Bus
  BUS: '/buses',
  BUS_STATS: '/buses/stats',
  BUS_SCHEDULES: '/bus/schedules',
  BUS_BOOKINGS: '/bus/bookings',
  CREATE_BUS_BOOKING: '/bus/bookings',
  CREATE_BUS: '/buses',
  UPDATE_BUS: (id: string) => `/buses/${id}`,
  UPDATE_BUS_STATUS: (id: string) => `/buses/update-status/${id}`,
  BUS_BY_ID: (id: string) => `/buses/${id}`,

  // Bus Route
  BUS_ROUTES: '/bus_routes',
  UPDATE_BUS_ROUTE: (id: string) => `/bus_routes/${id}`,

  // Bus Subscription
  BUS_SUBSCRIPTION: '/bus_subscriptions',

  // Events
  EVENTS: '/event_bookings',
  EVENT_BY_ID: (id: string) => `/event_bookings/${id}`,
  CREATE_EVENT: '/event_bookings/create',
  UPDATE_EVENT_STATUS: (id: string) => `/event_bookings/update-status/${id}`,

  // Events Registration
  EVENT_REGISTRATIONS_BY_USER: `/event_registrations/user`,
  CREATE_EVENT_REGISTRATIONS: `/event_registrations/create`,
  CANCEL_EVENT_REGISTRATIONS: (id: string) => `/event_registrations/${id}/cancel`,

  // Notifications
  INFORMATION: '/information',
  CREATE_INFORMATION: '/information/create',
  INFORMATION_BY_ID: (id: string) => `/information/${id}`,

  // Transactions
  TRANSACTIONS: '/transactions',
  USER_TRANSACTIONS: (userId: string) => `/users/${userId}/transactions`,

  // Dashboard
  DASHBOARD_STATS: '/dashboard/stats',
  REVENUE_BY_SERVICE: '/dashboard/revenue-by-service',
};
