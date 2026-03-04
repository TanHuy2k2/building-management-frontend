export enum PaymentMethod {
  CASH = 'cash',
  WALLET = 'wallet',
}

export enum PaymentServiceProvider {
  MOMO = 'momo',
  VNPAY = 'vnpay',
}

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentReferenceType {
  ORDER = 'order',
  BUS_SUBSCRIPTION = 'bus_subscription',
  PARKING_SUBSCRIPTION = 'parking_subscription',
  FACILITY_RESERVATION = 'facility_reservation',
}

export interface PaymentForm {
  reference_id: string;
  reference_type: PaymentReferenceType;
  method: PaymentMethod;
}

export interface PaymentUrlForm {
  payment_id: string;
  amount: number;
  return_url: string;
}

export enum VATRate {
  FOOD = 10,
  DEFAULT = 5,
}

export interface GetPaymentsParams {
  from?: string;
  to?: string;
}

export interface Payment {
  id: string;
  user_id: string;
  service_id: string;
  amount: number;
  service_type: PaymentServiceProvider;
  reference_id: string;
  reference_type: PaymentReferenceType;
  method: PaymentMethod;
  status: PaymentStatus;
  transaction_time: Date;
  created_at: Date;
}
