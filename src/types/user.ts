export enum UserRole {
  MANAGER = 'manager',
  USER = 'user',
}

export enum UserRank {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
}

export enum RankDiscount {
  BRONZE = 0,
  SILVER = 2,
  GOLD = 5,
  PLATINUM = 10,
}

export enum ActiveStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export interface User {
  id: string;
  uid: string;
  email: string;
  username: string;
  password?: string;
  fullName: string;
  phone: string;
  image_urls?: string[] | null;
  ranks?: UserRank;
  points?: number | null;
  roles: UserRole;
  permissions?: string[] | null;
  status: ActiveStatus;
  created_at: Date;
  updated_at?: Date;
  created_by: string;
  updated_by?: string | null;
}
