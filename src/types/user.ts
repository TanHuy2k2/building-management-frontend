import { Permission } from './permission';
import { OrderDirection } from './restaurant';

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
  rank: UserRank;
  points: number;
  role: UserRole;
  permissions?: Permission[] | null;
  status: ActiveStatus;
  created_at?: Date;
  updated_at?: Date | null;
  created_by?: string;
  updated_by?: string | null;
}

export interface CreateUserDto extends Pick<
  User,
  'email' | 'username' | 'full_name' | 'phone' | 'role' | 'permissions'
> {
  password: string;
  confirm_password: string;
}

export interface UserForm extends Pick<
  User,
  'email' | 'username' | 'full_name' | 'phone' | 'role' | 'permissions'
> {
  id?: string;
  password?: string;
  confirm_password?: string;
  rank?: UserRank;
  points?: number;
  image_url?: string | null;
}

export interface UpdatePasswordDto {
  password: string;
  confirm_password: string;
}

export type UserModalMode = 'create' | 'edit' | 'view' | null;

export interface GetUsersParams {
  search_text?: string;
  search_field?: 'full_name' | 'email';
  role?: UserRole;
  rank?: UserRank;
  status?: ActiveStatus;
  page?: number;
  page_size?: number;
  order_by?: string;
  order?: OrderDirection;
}
