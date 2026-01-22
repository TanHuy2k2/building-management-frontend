export * from './user';
export * from './permission';
export * from './response';
export * from './building';
export * from './facility';
export * from './restaurant';
export * from './facilityReservation';
export * from './parkingSpace';
export * from './parkingSubscription';
export * from './bus';
export * from './menu';
export * from './busRoute';
export * from './busSubscription';
export * from './eventBooking';
export * from './dish';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  items: { menuItem: MenuItem; quantity: number }[];
  total: number;
  discount: number;
  finalAmount: number;
  status: OrderStatus;
  deliveryType: 'pickup' | 'delivery';
  deliveryAddress?: string;
  createdAt: string;
  updatedAt: string;
}

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}
