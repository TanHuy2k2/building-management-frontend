export enum BuildingStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export interface Building {
  id: string;
  name: string;
  code: string;
  address: string;
  manager_id: string;
  status: BuildingStatus;
  created_at: Date;
  updated_at?: Date | null;
  created_by: string;
  updated_by?: string | null;
}

export interface CreateBuildingDto {
  name: string;
  code: string;
  address: string;
  manager_id: string;
}
