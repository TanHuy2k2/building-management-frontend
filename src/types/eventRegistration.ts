export enum EventRegistrationStatus {
  REGISTERED = 'registered',
  CANCELLED = 'cancelled',
  CLOSED = 'closed',
}

export interface EventRegistration {
  id: string;
  event_booking_id: string;
  user_id: string;
  status: EventRegistrationStatus;
  created_at: Date;
  updated_at: Date;
}

export type EventCardType = 'joined' | 'created';
