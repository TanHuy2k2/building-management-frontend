import { OrderDirection } from './restaurant';

export enum EventBookingStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export interface EventBooking {
  id: string;
  event_title: string;
  description?: string;
  location?: string;
  facility_reservation_id?: string;
  current_participants: number;
  max_participants: number;
  start_time: Date;
  end_time: Date;
  status: EventBookingStatus;
  approved_by?: string;
  deadline: Date;
  created_by: string;
  created_at: Date;
  updated_by?: string;
  updated_at?: Date;
}

export interface GetEventParams {
  event_title?: string;
  status?: string;
  page?: number;
  page_size?: number;
  order_by?: string;
  order?: OrderDirection;
}

export interface EventBookingUI extends EventBooking {
  creator_name?: string;
  facility_name?: string;
}
