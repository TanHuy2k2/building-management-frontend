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
  email: string;
  username: string;
  full_name: string;
  phone: string;
  image_url?: string | null;
  rank?: UserRank;
  points?: number | null;
  role: UserRole;
  permissions?: string[] | null;
  status: ActiveStatus;
  created_at?: Date;
  updated_at?: Date | null;
  created_by?: string;
  updated_by?: string | null;
}
