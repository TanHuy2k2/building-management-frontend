import { OrderDirection } from './restaurant';

export enum InformationCategory {
  NOTIFICATION = 'notification',
  INFO = 'info',
  NEWS = 'news',
  EVENT = 'event',
}

export enum InformationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
}

export enum InformationTarget {
  ALL = 'all',
  MANAGER = 'manager',
}

export enum InformationStatus {
  SCHEDULED = 'scheduled',
  SENT = 'sent',
}

export interface Information {
  id: string;
  title: string;
  content: string;
  category: InformationCategory;
  priority: InformationPriority;
  target: InformationTarget;
  schedule_at: Date;
  status: InformationStatus;
  created_at: Date;
  created_by: string;
  updated_at?: Date | null;
  updated_by?: string;
}

export interface GetInformationParams {
  status?: InformationStatus;
  category?: InformationCategory;
  priority?: InformationPriority;
  target?: InformationTarget;
  schedule_from?: string;
  schedule_to?: string;
  page?: number;
  page_size?: number;
  order_by?: keyof Information;
  order?: OrderDirection;
}

export type CreateInformationDto = Pick<
  Information,
  'title' | 'content' | 'category' | 'priority' | 'target'
> & {
  schedule_at?: string;
};
