// ─── Enums ────────────────────────────────────────────────────────────────────

export enum Role {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  USER  = 'USER',
}

export enum OrderStatus {
  PENDING   = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  PAID      = 'PAID',
}

export enum TourStatus {
  ACTIVE   = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  FULL     = 'FULL',
}

// ─── Core entities ────────────────────────────────────────────────────────────

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  roleName: Role;
  isAccountVerified: boolean;
  createdAt?: string;
}

export interface Tour {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: string;
  maxSlots: number;
  availableSlots: number;
  imageUrl: string;
  destination: string;
  status: TourStatus;
  startDate: string;
  endDate: string;
}

export interface Hotel {
  id: number;
  name: string;
  description: string;
  address: string;
  city: string;
  imageUrl: string;
  rating: number;
  amenities: string[];
}

export interface Room {
  id: number;
  hotelId: number;
  type: string;
  price: number;
  capacity: number;
  imageUrl: string;
  available: boolean;
}

export interface Restaurant {
  id: number;
  name: string;
  description: string;
  address: string;
  city: string;
  imageUrl: string;
  cuisine: string;
  priceRange: string;
  rating: number;
  openTime: string;
  closeTime: string;
}

export interface Order {
  id: number;
  userId: number;
  type: 'TOUR' | 'HOTEL' | 'RESTAURANT';
  referenceId: number;
  status: OrderStatus;
  totalPrice: number;
  bookingDate: string;
  checkInDate?: string;
  checkOutDate?: string;
  guestCount?: number;
  notes?: string;
}

export interface Review {
  id: number;
  userId: number;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Destination {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  country: string;
  region: string;
}

// ─── API response wrappers ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  message: string;
  data: T;
  success: boolean;
}

export interface PagedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}
