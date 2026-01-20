import { ActiveStatus } from './user';

export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
}

export enum DishCategory {
  MAIN = 'main_dish',
  SIDE = 'side_dish',
  DRINK = 'drink',
  DESSERT = 'dessert',
  COMBO = 'combo',
  OTHER = 'other',
  APPETIZER = 'appetizer',
}

export interface MenuSchedule {
  id: DayOfWeek;
  created_at: Date;
  created_by: string;
  updated_at?: Date;
  updated_by?: string;
  items: MenuItem[];
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: DishCategory;
  quantity: number;
  image_urls?: string[];
  created_at: Date;
  created_by?: string;
  updated_at?: Date;
  updated_by?: string;
}

export interface MenuForm {
  schedules: MenuScheduleForm[];
  images: File[];
}

export interface MenuScheduleForm {
  id: DayOfWeek;
  items: MenuItemForm[];
}

export interface MenuItemForm {
  name: string;
  category: DishCategory;
  price: number;
  quantity: number;
  description?: string;
  image_urls?: string[];
  status?: ActiveStatus;
}

export interface MenuItem extends MenuItemForm {
  id: string;
}
