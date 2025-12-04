import { Order, OrderStatus, MenuItem } from '../types';
import { mockOrders, mockMenuItems } from '../data/mockData';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get all orders
 * Backend API: GET /api/orders
 */
export async function getOrders(): Promise<Order[]> {
  await delay(300);
  // TODO: Replace with actual API call
  // return apiRequest<Order[]>(API_ENDPOINTS.ORDERS);
  return mockOrders;
}

/**
 * Get order by ID
 * Backend API: GET /api/orders/:id
 */
export async function getOrderById(id: string): Promise<Order | null> {
  await delay(200);
  // TODO: Replace with actual API call
  // return apiRequest<Order>(API_ENDPOINTS.ORDER_BY_ID(id));
  return mockOrders.find(order => order.id === id) || null;
}

/**
 * Create new order
 * Backend API: POST /api/orders
 */
export async function createOrder(orderData: Partial<Order>): Promise<Order> {
  await delay(500);
  // TODO: Replace with actual API call
  // return apiRequest<Order>(API_ENDPOINTS.CREATE_ORDER, {
  //   method: 'POST',
  //   body: JSON.stringify(orderData),
  // });
  
  const newOrder: Order = {
    id: `ORD${Date.now()}`,
    userId: orderData.userId || '',
    userName: orderData.userName || '',
    items: orderData.items || [],
    total: orderData.total || 0,
    discount: orderData.discount || 0,
    finalAmount: orderData.finalAmount || 0,
    status: 'pending',
    deliveryType: orderData.deliveryType || 'pickup',
    deliveryAddress: orderData.deliveryAddress,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  return newOrder;
}

/**
 * Update order status
 * Backend API: PATCH /api/orders/:id/status
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<Order> {
  await delay(300);
  // TODO: Replace with actual API call
  // return apiRequest<Order>(API_ENDPOINTS.UPDATE_ORDER_STATUS(orderId), {
  //   method: 'PATCH',
  //   body: JSON.stringify({ status }),
  // });
  
  const order = mockOrders.find(o => o.id === orderId);
  if (!order) throw new Error('Order not found');
  
  return {
    ...order,
    status,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Get menu items
 * Backend API: GET /api/menu
 */
export async function getMenuItems(): Promise<MenuItem[]> {
  await delay(200);
  // TODO: Replace with actual API call
  // return apiRequest<MenuItem[]>(API_ENDPOINTS.MENU_ITEMS);
  return mockMenuItems;
}

/**
 * Get orders by user ID
 * Backend API: GET /api/users/:userId/orders
 */
export async function getOrdersByUserId(userId: string): Promise<Order[]> {
  await delay(300);
  // TODO: Replace with actual API call
  // return apiRequest<Order[]>(`/users/${userId}/orders`);
  return mockOrders.filter(order => order.userId === userId);
}
