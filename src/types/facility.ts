export enum FacilityStatus {
  AVAILABLE = 'available',
  MAINTENANCE = 'maintenance',
  RESERVED = 'reserved',
}

export enum FacilityType {
  FIELD = 'field',
  ROOM = 'room',
}

export interface FacilityLocation {
  floor: string;
  outdoor: boolean;
  area: string;
}

export interface Facility {
  id: string;
  building_id: string;
  name: string;
  facility_type: FacilityType;
  description: string;
  capacity: number;
  location: FacilityLocation;
  base_price: number;
  service_charge: number;
  status: FacilityStatus;
  created_at: Date;
  updated_at?: Date | null;
  created_by?: string;
  updated_by?: string;
}

export interface FacilityForm {
  id?: string;
  name: string;
  building_id?: string;
  facility_type: FacilityType;
  description: string;
  capacity: number;
  location: FacilityLocation;
  base_price: number;
  service_charge: number;
}
