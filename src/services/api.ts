const API_BASE_URL = process.env.BE_API_URL;

export async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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

  // Users
  USERS: '/users',
  CREATE_USER: '/users/create',
  PROFILE: '/users/profile',
  USER_BY_ID: (id: string) => `/users/${id}`,
  USER_DETAIL_BY_ID: (id: string) => `/users/${id}/detail`,

  // Orders
  ORDERS: '/orders',
  ORDER_BY_ID: (id: string) => `/orders/${id}`,
  CREATE_ORDER: '/orders',
  UPDATE_ORDER_STATUS: (id: string) => `/orders/${id}/status`,

  // Menu
  MENU_ITEMS: '/menu',
  MENU_ITEM_BY_ID: (id: string) => `/menu/${id}`,

  // Reservations
  RESERVATIONS: '/reservations',
  RESERVATION_BY_ID: (id: string) => `/reservations/${id}`,
  CREATE_RESERVATION: '/reservations',
  UPDATE_RESERVATION_STATUS: (id: string) => `/reservations/${id}/status`,

  // Parking
  PARKING_SLOTS: '/parking/slots',
  PARKING_REGISTRATIONS: '/parking/registrations',
  CREATE_PARKING_REGISTRATION: '/parking/registrations',

  // Bus
  BUS_ROUTES: '/bus/routes',
  BUS_SCHEDULES: '/bus/schedules',
  BUS_BOOKINGS: '/bus/bookings',
  CREATE_BUS_BOOKING: '/bus/bookings',

  // Events
  EVENTS: '/events',
  EVENT_BY_ID: (id: string) => `/events/${id}`,
  CREATE_EVENT: '/events',
  UPDATE_EVENT_STATUS: (id: string) => `/events/${id}/status`,
  EVENT_REGISTRATIONS: (id: string) => `/events/${id}/registrations`,

  // Notifications
  NOTIFICATIONS: '/notifications',
  CREATE_NOTIFICATION: '/notifications',
  MARK_NOTIFICATION_READ: (id: string) => `/notifications/${id}/read`,

  // Transactions
  TRANSACTIONS: '/transactions',
  USER_TRANSACTIONS: (userId: string) => `/users/${userId}/transactions`,

  // Dashboard
  DASHBOARD_STATS: '/dashboard/stats',
  REVENUE_BY_SERVICE: '/dashboard/revenue-by-service',
};
