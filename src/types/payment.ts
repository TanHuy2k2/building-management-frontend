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
