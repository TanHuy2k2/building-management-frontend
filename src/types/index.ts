// User Types
export type UserRole = 'manager' | 'user';

export type RankTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  avatar?: string;
  rank: RankTier;
  points: number;
  totalSpent: number;
  createdAt: string;
}

// Notification Types
export type NotificationType = 'emergency' | 'service' | 'community';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  createdAt: string;
  read: boolean;
  targetAudience: 'all' | 'managers' | 'users';
}

// Order Types
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  items: { menuItem: MenuItem; quantity: number }[];
  total: number;
  discount: number;
  finalAmount: number;
  status: OrderStatus;
  deliveryType: 'pickup' | 'delivery';
  deliveryAddress?: string;
  createdAt: string;
  updatedAt: string;
}

// Reservation Types
export type ReservationType = 'field' | 'room' | 'other';
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Reservation {
  id: string;
  userId: string;
  userName: string;
  type: ReservationType;
  facilityName: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number; // hours
  price: number;
  deposit: number;
  status: ReservationStatus;
  createdAt: string;
}

// Parking Types
export type ParkingType = 'monthly' | 'daily';
export type ParkingStatus = 'active' | 'expired' | 'cancelled';

export interface ParkingSlot {
  id: string;
  slotNumber: string;
  area: string;
  occupied: boolean;
  userId?: string;
}

export interface ParkingRegistration {
  id: string;
  userId: string;
  userName: string;
  slotId: string;
  slotNumber: string;
  area: string;
  vehicleNumber: string;
  type: ParkingType;
  price: number;
  status: ParkingStatus;
  startDate: string;
  endDate: string;
  createdAt: string;
}

// Bus Types
export type BusBookingStatus = 'confirmed' | 'cancelled' | 'completed';

export interface BusRoute {
  id: string;
  name: string;
  startPoint: string;
  endPoint: string;
  stops: string[];
  duration: number; // minutes
  price: number;
}

export interface BusSchedule {
  id: string;
  routeId: string;
  busNumber: string;
  driver: string;
  departureTime: string;
  capacity: number;
  bookedSeats: number;
}

export interface BusBooking {
  id: string;
  userId: string;
  userName: string;
  scheduleId: string;
  routeId: string;
  routeName: string;
  busNumber: string;
  date: string;
  departureTime: string;
  pickupStop: string;
  dropoffStop: string;
  seats: number;
  price: number;
  status: BusBookingStatus;
  createdAt: string;
}

// Event Types
export type EventStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';

export interface Event {
  id: string;
  title: string;
  description: string;
  organizerId: string;
  organizerName: string;
  location: string;
  startDate: string;
  endDate: string;
  maxParticipants: number;
  currentParticipants: number;
  status: EventStatus;
  isPublic: boolean;
  createdAt: string;
  image?: string;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  registeredAt: string;
  attended: boolean;
}

// Payment Types
export type PaymentMethod = 'cash' | 'momo' | 'zalopay' | 'bank_transfer' | 'points';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type TransactionType = 'order' | 'reservation' | 'parking' | 'bus' | 'event';

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  type: TransactionType;
  referenceId: string;
  amount: number;
  discount: number;
  finalAmount: number;
  pointsEarned: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  createdAt: string;
}

// Statistics Types
export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalReservations: number;
  totalUsers: number;
  activeParking: number;
  todayBusBookings: number;
  upcomingEvents: number;
  unreadNotifications: number;
}

export interface RevenueByService {
  service: string;
  revenue: number;
  transactions: number;
}
