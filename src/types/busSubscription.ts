import { OrderDirection } from './restaurant';

export enum BusSubscriptionStatus {
  PENDING = 'pending',
  RESERVED = 'reserved',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export interface BusSubscription {
  id: string;
  user_id: string;
  route_id: string;
  bus_id: string;
  start_time: Date;
  end_time: Date;
  status: BusSubscriptionStatus;
  payment_id: string;
  seat_number: string;
  notes?: string;
  created_at: Date;
  updated_at?: Date;
}

export interface GetBusSubscriptionParams {
  route_id?: string;
  page?: number;
  page_size?: number;
  order_by?: string;
  order?: OrderDirection;
}

export interface BusSubscriptionForm {
  id?: string;
  route_id: string;
  bus_id: string;
  start_time?: Date;
  month_duration: number;
  base_amount: number;
  points_used?: number;
  seat_number: string;
}
