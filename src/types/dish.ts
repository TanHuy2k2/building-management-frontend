import { DishCategory } from './menu';
import { OrderDirection } from './restaurant';
import { ActiveStatus } from './user';

export interface Dish {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: DishCategory;
  image_urls?: string[];
  status: ActiveStatus;
  created_at: Date;
  updated_at?: Date | null;
  created_by?: string;
  updated_by?: string;
}

export type DishOrderBy = 'created_at' | 'price' | 'name' | 'category';

export interface GetDishesParams {
  page?: number;
  page_size?: number;
  order_by?: DishOrderBy;
  order?: OrderDirection;
  name?: string;
  category?: DishCategory;
  status?: ActiveStatus;
}

export interface DishForm {
  name: string;
  description?: string;
  price: number;
  category: DishCategory;
  image_urls?: string[];
  status: ActiveStatus;
}
