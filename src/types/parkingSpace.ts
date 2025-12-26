export interface ParkingSpaceLocation {
  floor: number;
  area: string;
}

export enum ParkingSpaceType {
  MOTORBIKE = 'motorbike',
  CAR = 'car',
}

export enum ParkingSpaceStatus {
  AVAILABLE = 'available',
  MAINTENANCE = 'maintenance',
  RESERVED = 'reserved',
}

export interface ParkingSpace {
  id?: string;
  building_id: string;
  location: ParkingSpaceLocation;
  code: string;
  type: ParkingSpaceType;
  status: ParkingSpaceStatus;
  created_at?: Date;
  created_by?: string;
  updated_at?: Date;
  updated_by?: string;
}

export interface GetParkingParams {
  building_id: string;
}
