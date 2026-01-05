import { OrderDirection } from './restaurant';

export enum BusStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
}

export enum BusSeatStatus {
  AVAILABLE = 'available',
  RESERVED = 'reserved',
}

export interface Bus {
  id: string;
  type_name: string;
  number: number;
  plate_number: string;
  capacity: number;
  description?: string;
  image_urls?: string[];
  model: string;
  features?: string[];
  driver_id?: string;
  status: BusStatus;
  seats?: BusSeat[];
  created_at: Date;
  updated_at?: Date;
}

export interface BusSeat {
  seat_number: string;
  status: BusSeatStatus;
}

export interface GetBusParams {
  type_name?: string;
  status?: string;
  page?: number;
  page_size?: number;
  order_by?: string;
  order?: OrderDirection;
}
