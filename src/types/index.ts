export type VehicleCategory = 'Economy' | 'Sedan' | 'SUV' | 'Luxury' | 'Electric' | 'Premium Sports';
export type FuelType = 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid';
export type Transmission = 'Automatic' | 'Manual';
export type VehicleStatus = 'Available' | 'Rented' | 'Maintenance' | 'Inactive';

export interface Vehicle {
  vehicle_id: number;
  registration_no: string;
  brand: string;
  model: string;
  model_year: number;
  vehicle_type: VehicleCategory;
  rental_rate: number; // INR per day
  fuel_type: FuelType;
  transmission: Transmission;
  seating_capacity: number;
  image_url: string;
  status: VehicleStatus;
  created_at: string;
  mileage_km?: number;
}

export interface Customer {
  customer_id: number;
  name: string;
  email: string;
  phone: string;
  driving_license: string;
  address: string;
  created_at: string;
}

export type StaffRole = 'Admin' | 'Manager' | 'Rental Agent' | 'Maintenance Staff';

export interface Staff {
  staff_id: number;
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
  active: boolean;
}

export type RentalStatus = 'Pending Confirmation' | 'Confirmed' | 'Active' | 'Completed' | 'Cancelled';

export interface Rental {
  rental_id: number;
  customer_id: number;
  vehicle_id: number;
  staff_id: number;
  rental_date: string; // YYYY-MM-DD
  return_date: string; // YYYY-MM-DD
  total_amount: number;
  status: RentalStatus;
  pickup_location: string;
  special_requests?: string;
  created_at: string;
  actual_return_date?: string;
  return_notes?: string;
}

export type PaymentMethod = 'UPI' | 'Card' | 'Cash' | 'Bank Transfer';
export type PaymentStatus = 'Pending' | 'Completed' | 'Failed' | 'Refunded';

export interface Payment {
  payment_id: number;
  rental_id: number;
  amount: number;
  payment_date: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transaction_reference: string;
  created_at: string;
  notes?: string;
}

export type MaintenanceStatus = 'Scheduled' | 'In Progress' | 'Completed';

export interface Maintenance {
  maintenance_id: number;
  vehicle_id: number;
  staff_id: number;
  date: string; // YYYY-MM-DD
  cost: number;
  description: string;
  status: MaintenanceStatus;
  completion_date?: string;
}

export interface AuditEvent {
  event_id: string;
  action: string;
  actor_role: StaffRole | 'Customer' | 'System';
  entity_type: 'VEHICLE' | 'CUSTOMER' | 'RENTAL' | 'PAYMENT' | 'MAINTENANCE' | 'SYSTEM';
  entity_id: string | number;
  timestamp: string;
  description: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  timestamp: string;
  read: boolean;
  link?: string;
}

export interface AppSettings {
  taxRatePercent: number; // default 18 (GST)
  damageWaiverDailyRate: number; // default 499
  demoMode: boolean;
  activeRole: StaffRole;
  activeCustomerId: number;
}
