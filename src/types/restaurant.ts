export enum RestaurantStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export interface OperatingHours {
  open: string;
  close: string;
  days?: string[];
}

export interface ContactInfo {
  phone?: string;
  email?: string;
  facebook?: string;
  zalo?: string;
}

export interface Restaurant {
  id: string;
  building_id: string;
  floor: number;
  name: string;
  description?: string;
  operating_hours?: OperatingHours;
  contact?: ContactInfo;
  status: RestaurantStatus;
  created_at?: Date | null;
  updated_at?: Date | null;
  created_by?: string;
  updated_by?: string;
}

export interface RestaurantForm extends Pick<
  Restaurant,
  'building_id' | 'floor' | 'operating_hours' | 'contact' | 'name' | 'description'
> {
  id?: string;
}

export interface UpdateStatusDto {
  status?: RestaurantStatus;
}
