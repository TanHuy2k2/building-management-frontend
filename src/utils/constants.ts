import { DayOfWeek } from '../types';

export const DEFAULT_PAGE_SIZE = 6;
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_TOTAL = 1;
export const DEFAULT_ORDER_BY = 'created_at';
export const DEFAULT_AVATAR_URL = '/images/default-avatar.svg';

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
