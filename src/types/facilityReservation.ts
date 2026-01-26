import { Building, Facility, OrderDirection, User } from '.';

export enum FacilityReservationStatus {
  PENDING = 'pending',
  RESERVED = 'reserved',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export interface FacilityReservation {
  id: string;
  user_id: string;
  facility_id: string;
  start_time: Date;
  end_time: Date;
  base_amount: number;
  vat_charge: number;
  discount: number;
  points_used: number;
  total_amount: number;
  point_earned: number;
  status: FacilityReservationStatus;
  created_at: Date;
  updated_at?: Date | null;
  created_by?: string;
  updated_by?: string;
}
export interface ReservationView extends FacilityReservation {
  user?: User;
  facility?: Facility;
  building?: Building;
}

export interface GetReservationParams {
  name?: string;
  status?: string;
  page?: number;
  page_size?: number;
  order_by?: string;
  order?: OrderDirection;
}

export interface FacilityReservationForm {
  facility_id: string;
  start_date?: Date;
  hour_duration: number;
  points_used: number;
}

export type ViewMode = 'reserve' | 'history';
