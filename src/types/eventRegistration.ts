export enum EventRegistrationsStatus {
  REGISTERED = 'registered',
  CANCELLED = 'cancelled',
  CLOSED = 'closed',
}

export interface EventRegistration {
  id: string;
  event_booking_id: string;
  user_id: string;
  status: EventRegistrationsStatus;
  created_at: Date;
  updated_at: Date;
}
