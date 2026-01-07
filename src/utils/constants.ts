import { DayOfWeek } from '../types';

export const DEFAULT_PAGE_SIZE = 6;
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_TOTAL = 1;
export const DEFAULT_ORDER_BY = 'created_at';
export const DEFAULT_AVATAR_URL = '/images/default-avatar.svg';
export const DEFAULT_FOOD_IMG_URL = '/images/default-food-image.jpg';
export const POINT_VALUE = 1000;
export const HTTP_PREFIX = 'http';
export const ENV = {
  BE_URL: process.env.BE_URL ?? '',
  BE_API_URL: process.env.BE_API_URL ?? '',
} as const;

export const DAY_LABEL: Record<DayOfWeek, string> = {
  [DayOfWeek.MONDAY]: 'Monday',
  [DayOfWeek.TUESDAY]: 'Tuesday',
  [DayOfWeek.WEDNESDAY]: 'Wednesday',
  [DayOfWeek.THURSDAY]: 'Thursday',
  [DayOfWeek.FRIDAY]: 'Friday',
};

export const DAY_ORDER: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
];

export const WEEK_DAYS = [
  { key: 'monday', label: '2' },
  { key: 'tuesday', label: '3' },
  { key: 'wednesday', label: '4' },
  { key: 'thursday', label: '5' },
  { key: 'friday', label: '6' },
  { key: 'saturday', label: '7' },
  { key: 'sunday', label: 'CN' },
];
