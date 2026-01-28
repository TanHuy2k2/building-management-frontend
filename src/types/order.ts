import { OrderDirection } from './restaurant';

export enum PickupMethod {
  DINE_IN = 'dine_in',
  TAKEAWAY = 'takeaway',
  DELIVERY = 'delivery',
}

export enum OrderStatus {
  PENDING = 'pending',
  PREPARING = 'preparing',
  DELIVERING = 'delivering',
  COMPLETED = 'completed',
}

export interface OrderDetail {
  id: string;
  order_id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  created_at: Date;
  updated_at?: Date;
}

export interface Order {
  id: string;
  user_id: string;
  base_amount: number;
  vat_charge: number;
  discount: number;
  points_used: number;
  total_amount: number;
  points_earned: number;
  pickup_method: PickupMethod;
  delivery_address?: {
    building?: string;
    floor?: number;
    room?: string;
  };
  delivery_info?: {
    contact_name?: string;
    contact_phone?: string;
    notes?: string;
  };
  status: OrderStatus;
  payment_id?: string;
  created_at: Date;
  updated_at?: Date;
}

export interface GetOrdersParams {
  date?: string;
  status?: OrderStatus;
  pickup_method?: PickupMethod;
  order?: OrderDirection;
  page?: number;
  page_size?: number;
}

export interface CreateOrderDetailDto {
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export interface DeliveryAddress {
  building?: string;
  floor?: number;
  room?: string;
}

export interface DeliveryInfo {
  contact_name?: string;
  contact_phone?: string;
  notes?: string;
}

export interface CreateOrderDto {
  pickup_method: PickupMethod;
  points_used?: number;
  delivery_address?: DeliveryAddress;
  delivery_info?: DeliveryInfo;
  order_details: CreateOrderDetailDto[];
}
