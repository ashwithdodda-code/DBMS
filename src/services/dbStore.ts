import {
  Vehicle,
  Customer,
  Staff,
  Rental,
  Payment,
  Maintenance,
  AuditEvent,
  NotificationItem,
  AppSettings,
  StaffRole,
} from '../types';
import {
  INITIAL_VEHICLES,
  INITIAL_CUSTOMERS,
  INITIAL_STAFF,
  INITIAL_RENTALS,
  INITIAL_PAYMENTS,
  INITIAL_MAINTENANCE,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SETTINGS,
} from '../data/seedData';

const STORAGE_KEY = 'velocity_os_db_v2';

interface DatabaseSchema {
  vehicles: Vehicle[];
  customers: Customer[];
  staff: Staff[];
  rentals: Rental[];
  payments: Payment[];
  maintenance: Maintenance[];
  auditLogs: AuditEvent[];
  notifications: NotificationItem[];
  settings: AppSettings;
}

type Listener = () => void;

class DBStore {
  private data: DatabaseSchema;
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.data = this.loadFromStorage();
  }

  private loadFromStorage(): DatabaseSchema {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.vehicles && parsed.customers && parsed.rentals) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read from localStorage, using initial seeds', e);
    }

    return {
      vehicles: [...INITIAL_VEHICLES],
      customers: [...INITIAL_CUSTOMERS],
      staff: [...INITIAL_STAFF],
      rentals: [...INITIAL_RENTALS],
      payments: [...INITIAL_PAYMENTS],
      maintenance: [...INITIAL_MAINTENANCE],
      auditLogs: [...INITIAL_AUDIT_LOGS],
      notifications: [...INITIAL_NOTIFICATIONS],
      settings: { ...INITIAL_SETTINGS },
    };
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Failed to persist to localStorage', e);
    }
    this.notify();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('Listener callback error', err);
      }
    });
  }

  // ==================== AUDIT & NOTIFICATION ====================
  public logAudit(
    action: string,
    actor_role: StaffRole | 'Customer' | 'System',
    entity_type: AuditEvent['entity_type'],
    entity_id: string | number,
    description: string
  ) {
    const event: AuditEvent = {
      event_id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
      action,
      actor_role,
      entity_type,
      entity_id,
      timestamp: new Date().toISOString(),
      description,
    };
    this.data.auditLogs.unshift(event);
    if (this.data.auditLogs.length > 200) {
      this.data.auditLogs.pop();
    }
  }

  public addNotification(
    title: string,
    message: string,
    type: NotificationItem['type'] = 'info',
    link?: string
  ) {
    const item: NotificationItem = {
      id: `NOTIF-${Date.now()}`,
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false,
      link,
    };
    this.data.notifications.unshift(item);
  }

  public markNotificationAsRead(id: string) {
    const n = this.data.notifications.find((item) => item.id === id);
    if (n) {
      n.read = true;
      this.persist();
    }
  }

  public markAllNotificationsAsRead() {
    this.data.notifications.forEach((n) => (n.read = true));
    this.persist();
  }

  // ==================== VEHICLES ====================
  public getVehicles(): Vehicle[] {
    return [...this.data.vehicles];
  }

  public getVehicleById(id: number): Vehicle | undefined {
    return this.data.vehicles.find((v) => v.vehicle_id === id);
  }

  public addVehicle(vehicle: Omit<Vehicle, 'vehicle_id' | 'created_at'>): Vehicle {
    const existsReg = this.data.vehicles.some(
      (v) => v.registration_no.toLowerCase() === vehicle.registration_no.toLowerCase()
    );
    if (existsReg) {
      throw new Error(`Registration number "${vehicle.registration_no}" is already registered.`);
    }

    const nextId =
      this.data.vehicles.length > 0
        ? Math.max(...this.data.vehicles.map((v) => v.vehicle_id)) + 1
        : 101;

    const newVehicle: Vehicle = {
      ...vehicle,
      vehicle_id: nextId,
      created_at: new Date().toISOString(),
    };

    this.data.vehicles.push(newVehicle);
    this.logAudit(
      'VEHICLE_CREATED',
      this.data.settings.activeRole,
      'VEHICLE',
      nextId,
      `Added vehicle ${newVehicle.brand} ${newVehicle.model} (${newVehicle.registration_no})`
    );
    this.persist();
    return newVehicle;
  }

  public updateVehicle(id: number, updates: Partial<Vehicle>): Vehicle {
    const idx = this.data.vehicles.findIndex((v) => v.vehicle_id === id);
    if (idx === -1) throw new Error(`Vehicle #${id} not found.`);

    if (updates.registration_no) {
      const conflict = this.data.vehicles.some(
        (v) =>
          v.vehicle_id !== id &&
          v.registration_no.toLowerCase() === updates.registration_no!.toLowerCase()
      );
      if (conflict) {
        throw new Error(`Registration number "${updates.registration_no}" is already used by another vehicle.`);
      }
    }

    const existing = this.data.vehicles[idx];
    const updated: Vehicle = { ...existing, ...updates };
    this.data.vehicles[idx] = updated;

    this.logAudit(
      'VEHICLE_UPDATED',
      this.data.settings.activeRole,
      'VEHICLE',
      id,
      `Updated details for ${updated.brand} ${updated.model}`
    );
    this.persist();
    return updated;
  }

  public archiveVehicle(id: number): boolean {
    const activeRental = this.data.rentals.find(
      (r) => r.vehicle_id === id && (r.status === 'Active' || r.status === 'Confirmed')
    );
    if (activeRental) {
      throw new Error(
        `Cannot archive vehicle #${id}: It is currently assigned to an active/confirmed rental (#${activeRental.rental_id}).`
      );
    }

    const vehicle = this.getVehicleById(id);
    if (!vehicle) throw new Error(`Vehicle #${id} not found.`);

    vehicle.status = 'Inactive';
    this.logAudit(
      'VEHICLE_ARCHIVED',
      this.data.settings.activeRole,
      'VEHICLE',
      id,
      `Archived vehicle ${vehicle.brand} ${vehicle.model} (status set to Inactive)`
    );
    this.persist();
    return true;
  }

  // ==================== AVAILABILITY ENGINE ====================
  /**
   * Enforces business rule: No overlapping bookings or maintenance for same dates.
   */
  public checkVehicleAvailability(
    vehicleId: number,
    pickupDate: string,
    returnDate: string,
    excludeRentalId?: number
  ): { available: boolean; conflictReason?: string } {
    const vehicle = this.getVehicleById(vehicleId);
    if (!vehicle) return { available: false, conflictReason: 'Vehicle not found.' };

    if (vehicle.status === 'Inactive') {
      return { available: false, conflictReason: 'Vehicle is currently archived/inactive in fleet.' };
    }

    const reqStart = new Date(pickupDate).getTime();
    const reqEnd = new Date(returnDate).getTime();

    if (reqEnd <= reqStart) {
      return { available: false, conflictReason: 'Return date must be strictly after pickup date.' };
    }

    // Check overlapping rentals
    const conflictingRental = this.data.rentals.find((r) => {
      if (r.vehicle_id !== vehicleId) return false;
      if (excludeRentalId && r.rental_id === excludeRentalId) return false;
      if (r.status === 'Cancelled' || r.status === 'Completed') return false;

      const rStart = new Date(r.rental_date).getTime();
      const rEnd = new Date(r.return_date).getTime();

      // Check date range intersection: [reqStart, reqEnd] overlaps with [rStart, rEnd]
      return reqStart < rEnd && reqEnd > rStart;
    });

    if (conflictingRental) {
      return {
        available: false,
        conflictReason: `Conflicting ${conflictingRental.status.toLowerCase()} booking (#${conflictingRental.rental_id}) from ${conflictingRental.rental_date} to ${conflictingRental.return_date}.`,
      };
    }

    // Check active maintenance restrictions
    const conflictingMaintenance = this.data.maintenance.find((m) => {
      if (m.vehicle_id !== vehicleId) return false;
      if (m.status === 'Completed') return false;

      const mDate = new Date(m.date).getTime();
      // Assume maintenance blocks at least that scheduled day
      return reqStart <= mDate && reqEnd >= mDate;
    });

    if (conflictingMaintenance) {
      return {
        available: false,
        conflictReason: `Vehicle has scheduled service/maintenance on ${conflictingMaintenance.date}.`,
      };
    }

    return { available: true };
  }

  // ==================== CUSTOMERS ====================
  public getCustomers(): Customer[] {
    return [...this.data.customers];
  }

  public getCustomerById(id: number): Customer | undefined {
    return this.data.customers.find((c) => c.customer_id === id);
  }

  public addCustomer(customer: Omit<Customer, 'customer_id' | 'created_at'>): Customer {
    const emailNorm = customer.email.trim().toLowerCase();
    const licenseNorm = customer.driving_license.trim().toUpperCase();

    if (this.data.customers.some((c) => c.email.trim().toLowerCase() === emailNorm)) {
      throw new Error(`Customer with email "${customer.email}" already exists.`);
    }

    if (this.data.customers.some((c) => c.driving_license.trim().toUpperCase() === licenseNorm)) {
      throw new Error(`Customer with driving license "${customer.driving_license}" already registered.`);
    }

    const nextId =
      this.data.customers.length > 0
        ? Math.max(...this.data.customers.map((c) => c.customer_id)) + 1
        : 1001;

    const newCustomer: Customer = {
      ...customer,
      email: emailNorm,
      driving_license: licenseNorm,
      customer_id: nextId,
      created_at: new Date().toISOString(),
    };

    this.data.customers.push(newCustomer);
    this.logAudit(
      'CUSTOMER_CREATED',
      this.data.settings.activeRole,
      'CUSTOMER',
      nextId,
      `Registered customer ${newCustomer.name} (${newCustomer.email})`
    );
    this.persist();
    return newCustomer;
  }

  public updateCustomer(id: number, updates: Partial<Customer>): Customer {
    const idx = this.data.customers.findIndex((c) => c.customer_id === id);
    if (idx === -1) throw new Error(`Customer #${id} not found.`);

    if (updates.email) {
      const emailNorm = updates.email.trim().toLowerCase();
      const conflict = this.data.customers.some(
        (c) => c.customer_id !== id && c.email.trim().toLowerCase() === emailNorm
      );
      if (conflict) throw new Error(`Email "${updates.email}" is already used by another customer.`);
      updates.email = emailNorm;
    }

    if (updates.driving_license) {
      const licenseNorm = updates.driving_license.trim().toUpperCase();
      const conflict = this.data.customers.some(
        (c) => c.customer_id !== id && c.driving_license.trim().toUpperCase() === licenseNorm
      );
      if (conflict) throw new Error(`Driving license "${updates.driving_license}" is already in use.`);
      updates.driving_license = licenseNorm;
    }

    const updated = { ...this.data.customers[idx], ...updates };
    this.data.customers[idx] = updated;
    this.logAudit(
      'CUSTOMER_UPDATED',
      this.data.settings.activeRole,
      'CUSTOMER',
      id,
      `Updated profile for customer ${updated.name}`
    );
    this.persist();
    return updated;
  }

  // ==================== STAFF ====================
  public getStaff(): Staff[] {
    return [...this.data.staff];
  }

  public getStaffById(id: number): Staff | undefined {
    return this.data.staff.find((s) => s.staff_id === id);
  }

  public updateStaff(id: number, updates: Partial<Staff>): Staff {
    const idx = this.data.staff.findIndex((s) => s.staff_id === id);
    if (idx === -1) throw new Error(`Staff #${id} not found.`);

    const updated = { ...this.data.staff[idx], ...updates };
    this.data.staff[idx] = updated;
    this.logAudit(
      'STAFF_UPDATED',
      this.data.settings.activeRole,
      'SYSTEM',
      id,
      `Staff ${updated.name} updated (Role: ${updated.role}, Active: ${updated.active})`
    );
    this.persist();
    return updated;
  }

  // ==================== RENTALS & TRANSACTIONAL BOOKING ====================
  public getRentals(): Rental[] {
    return [...this.data.rentals];
  }

  public getRentalById(id: number): Rental | undefined {
    return this.data.rentals.find((r) => r.rental_id === id);
  }

  /**
   * ACID-style transactional booking:
   * 1. Validate customer & vehicle exist
   * 2. Re-check availability (lock check)
   * 3. Insert rental record
   * 4. Record payment (or pending payment)
   * 5. Derived status update on vehicle
   * 6. Commit or rollback on error
   */
  public createReservationTransactional(params: {
    customerData: {
      name: string;
      email: string;
      phone: string;
      driving_license: string;
      address?: string;
    };
    vehicle_id: number;
    pickup_date: string;
    return_date: string;
    pickup_location: string;
    total_amount: number;
    special_requests?: string;
    paymentMethod: Payment['method'];
    simulatePaymentFailure?: boolean;
    assignedStaffId?: number;
  }): { rental: Rental; payment: Payment } {
    // 1. Availability validation
    const avail = this.checkVehicleAvailability(params.vehicle_id, params.pickup_date, params.return_date);
    if (!avail.available) {
      throw new Error(`Reservation conflict: ${avail.conflictReason}`);
    }

    // 2. Resolve or create customer
    let customer = this.data.customers.find(
      (c) => c.email.trim().toLowerCase() === params.customerData.email.trim().toLowerCase()
    );

    if (!customer) {
      // Check if license is in use
      const licenseConflict = this.data.customers.find(
        (c) => c.driving_license.trim().toUpperCase() === params.customerData.driving_license.trim().toUpperCase()
      );
      if (licenseConflict) {
        throw new Error(`Driving license "${params.customerData.driving_license}" is already registered to ${licenseConflict.name}.`);
      }

      customer = this.addCustomer({
        name: params.customerData.name,
        email: params.customerData.email,
        phone: params.customerData.phone,
        driving_license: params.customerData.driving_license,
        address: params.customerData.address || 'Local Booking Address',
      });
    }

    const vehicle = this.getVehicleById(params.vehicle_id);
    if (!vehicle) throw new Error('Vehicle record missing.');

    // 3. Determine Staff Assignment
    const staffId = params.assignedStaffId || (this.data.staff.find((s) => s.role === 'Rental Agent' && s.active)?.staff_id || 503);

    // 4. Create Rental
    const nextRentalId =
      this.data.rentals.length > 0
        ? Math.max(...this.data.rentals.map((r) => r.rental_id)) + 1
        : 7001;

    // Is the rental starting today?
    const todayStr = new Date().toISOString().split('T')[0];
    const isStartingToday = params.pickup_date <= todayStr;
    const initialStatus = isStartingToday ? 'Active' : 'Confirmed';

    const newRental: Rental = {
      rental_id: nextRentalId,
      customer_id: customer.customer_id,
      vehicle_id: params.vehicle_id,
      staff_id: staffId,
      rental_date: params.pickup_date,
      return_date: params.return_date,
      total_amount: params.total_amount,
      status: initialStatus,
      pickup_location: params.pickup_location,
      special_requests: params.special_requests,
      created_at: new Date().toISOString(),
    };

    // 5. Create Payment
    const nextPaymentId =
      this.data.payments.length > 0
        ? Math.max(...this.data.payments.map((p) => p.payment_id)) + 1
        : 9001;

    const paymentFailed = !!params.simulatePaymentFailure;
    const paymentStatus: Payment['status'] = paymentFailed
      ? 'Failed'
      : params.paymentMethod === 'Cash'
      ? 'Pending'
      : 'Completed';

    const newPayment: Payment = {
      payment_id: nextPaymentId,
      rental_id: nextRentalId,
      amount: params.total_amount,
      payment_date: new Date().toISOString(),
      method: params.paymentMethod,
      status: paymentStatus,
      transaction_reference: `TXN_${params.paymentMethod.toUpperCase()}_${Date.now().toString().slice(-6)}`,
      created_at: new Date().toISOString(),
      notes: paymentFailed ? 'Simulated payment gateway card decline.' : undefined,
    };

    // Atomic insert
    this.data.rentals.push(newRental);
    this.data.payments.push(newPayment);

    // If starting today and payment successful or pending cash, update vehicle status to Rented
    if (isStartingToday && paymentStatus !== 'Failed') {
      vehicle.status = 'Rented';
    }

    this.logAudit(
      'RENTAL_CREATED',
      'Customer',
      'RENTAL',
      nextRentalId,
      `Created booking #${nextRentalId} for ${customer.name} - ${vehicle.brand} ${vehicle.model} (Total: ₹${params.total_amount})`
    );

    this.addNotification(
      'New Booking Received',
      `Booking #${nextRentalId} created for ${vehicle.brand} ${vehicle.model} by ${customer.name}.`,
      'info',
      '/admin/rentals'
    );

    this.persist();
    return { rental: newRental, payment: newPayment };
  }

  public updateRentalStatus(
    rentalId: number,
    newStatus: Rental['status'],
    actualReturnDate?: string,
    returnNotes?: string
  ): Rental {
    const rental = this.getRentalById(rentalId);
    if (!rental) throw new Error(`Rental #${rentalId} not found.`);

    if (rental.status === 'Completed' && newStatus !== 'Completed') {
      throw new Error('A completed rental cannot be transitioned back to another state.');
    }
    if (rental.status === 'Cancelled' && newStatus === 'Active') {
      throw new Error('A cancelled rental cannot be directly activated.');
    }

    const previousStatus = rental.status;
    rental.status = newStatus;
    if (actualReturnDate) rental.actual_return_date = actualReturnDate;
    if (returnNotes) rental.return_notes = returnNotes;

    // Recalculate derived vehicle availability
    const vehicle = this.getVehicleById(rental.vehicle_id);
    if (vehicle) {
      if (newStatus === 'Active') {
        vehicle.status = 'Rented';
      } else if (newStatus === 'Completed' || newStatus === 'Cancelled') {
        // Check if there are other current active rentals or maintenance for this vehicle
        const otherActive = this.data.rentals.find(
          (r) => r.rental_id !== rentalId && r.vehicle_id === vehicle.vehicle_id && r.status === 'Active'
        );
        const hasMaintenance = this.data.maintenance.find(
          (m) => m.vehicle_id === vehicle.vehicle_id && m.status === 'In Progress'
        );

        if (otherActive) {
          vehicle.status = 'Rented';
        } else if (hasMaintenance) {
          vehicle.status = 'Maintenance';
        } else {
          vehicle.status = 'Available';
        }
      }
    }

    this.logAudit(
      'RENTAL_STATUS_CHANGED',
      this.data.settings.activeRole,
      'RENTAL',
      rentalId,
      `Rental #${rentalId} transitioned from "${previousStatus}" to "${newStatus}"`
    );

    if (newStatus === 'Completed') {
      this.addNotification(
        'Vehicle Return Completed',
        `Rental #${rentalId} return successfully processed for ${vehicle?.brand} ${vehicle?.model}.`,
        'success',
        '/admin/rentals'
      );
    }

    this.persist();
    return rental;
  }

  public assignStaffToRental(rentalId: number, staffId: number): Rental {
    const rental = this.getRentalById(rentalId);
    if (!rental) throw new Error(`Rental #${rentalId} not found.`);
    const staff = this.getStaffById(staffId);
    if (!staff) throw new Error(`Staff #${staffId} not found.`);

    rental.staff_id = staffId;
    this.logAudit(
      'RENTAL_STAFF_ASSIGNED',
      this.data.settings.activeRole,
      'RENTAL',
      rentalId,
      `Assigned staff ${staff.name} (${staff.role}) to Rental #${rentalId}`
    );
    this.persist();
    return rental;
  }

  // ==================== PAYMENTS ====================
  public getPayments(): Payment[] {
    return [...this.data.payments];
  }

  public getPaymentById(id: number): Payment | undefined {
    return this.data.payments.find((p) => p.payment_id === id);
  }

  public recordPayment(params: {
    rental_id: number;
    amount: number;
    method: Payment['method'];
    status: Payment['status'];
    transaction_reference?: string;
    notes?: string;
  }): Payment {
    const rental = this.getRentalById(params.rental_id);
    if (!rental) throw new Error(`Linked rental #${params.rental_id} does not exist.`);

    const nextId =
      this.data.payments.length > 0
        ? Math.max(...this.data.payments.map((p) => p.payment_id)) + 1
        : 9001;

    const ref =
      params.transaction_reference ||
      `TXN_${params.method.toUpperCase()}_${Date.now().toString().slice(-6)}`;

    // Ensure reference uniqueness if provided
    const existsRef = this.data.payments.some((p) => p.transaction_reference === ref);
    if (existsRef) {
      throw new Error(`Transaction reference "${ref}" is already recorded.`);
    }

    const newPayment: Payment = {
      payment_id: nextId,
      rental_id: params.rental_id,
      amount: params.amount,
      payment_date: new Date().toISOString(),
      method: params.method,
      status: params.status,
      transaction_reference: ref,
      created_at: new Date().toISOString(),
      notes: params.notes,
    };

    this.data.payments.push(newPayment);

    this.logAudit(
      'PAYMENT_RECORDED',
      this.data.settings.activeRole,
      'PAYMENT',
      nextId,
      `Recorded ${params.status} payment of ₹${params.amount} via ${params.method} for Rental #${params.rental_id}`
    );

    this.persist();
    return newPayment;
  }

  public retryPayment(paymentId: number): Payment {
    const payment = this.getPaymentById(paymentId);
    if (!payment) throw new Error(`Payment #${paymentId} not found.`);
    if (payment.status !== 'Failed') {
      throw new Error('Only failed transactions can be retried.');
    }

    payment.status = 'Completed';
    payment.payment_date = new Date().toISOString();
    payment.transaction_reference = `RETRY_SUCCESS_${Date.now().toString().slice(-6)}`;
    payment.notes = 'Successfully retried by customer.';

    this.logAudit(
      'PAYMENT_RETRIED',
      'Customer',
      'PAYMENT',
      paymentId,
      `Payment #${paymentId} retried and completed successfully`
    );

    this.persist();
    return payment;
  }

  public refundPayment(paymentId: number, reason = 'Customer requested refund'): Payment {
    const payment = this.getPaymentById(paymentId);
    if (!payment) throw new Error(`Payment #${paymentId} not found.`);
    if (payment.status !== 'Completed') {
      throw new Error('Only completed payments can be refunded.');
    }

    payment.status = 'Refunded';
    payment.notes = reason;

    this.logAudit(
      'PAYMENT_REFUNDED',
      this.data.settings.activeRole,
      'PAYMENT',
      paymentId,
      `Refunded payment #${paymentId} (₹${payment.amount}). Reason: ${reason}`
    );

    this.persist();
    return payment;
  }

  // ==================== MAINTENANCE ====================
  public getMaintenance(): Maintenance[] {
    return [...this.data.maintenance];
  }

  public scheduleMaintenance(params: {
    vehicle_id: number;
    staff_id?: number;
    date: string;
    cost: number;
    description: string;
  }): Maintenance {
    const vehicle = this.getVehicleById(params.vehicle_id);
    if (!vehicle) throw new Error(`Vehicle #${params.vehicle_id} not found.`);

    if (params.cost < 0) {
      throw new Error('Maintenance cost cannot be negative.');
    }

    const nextId =
      this.data.maintenance.length > 0
        ? Math.max(...this.data.maintenance.map((m) => m.maintenance_id)) + 1
        : 4001;

    const staffId =
      params.staff_id ||
      (this.data.staff.find((s) => s.role === 'Maintenance Staff' && s.active)?.staff_id || 504);

    const newMaintenance: Maintenance = {
      maintenance_id: nextId,
      vehicle_id: params.vehicle_id,
      staff_id: staffId,
      date: params.date,
      cost: params.cost,
      description: params.description,
      status: 'Scheduled',
    };

    this.data.maintenance.push(newMaintenance);

    this.logAudit(
      'MAINTENANCE_SCHEDULED',
      this.data.settings.activeRole,
      'MAINTENANCE',
      nextId,
      `Scheduled service for ${vehicle.brand} ${vehicle.model} on ${params.date} (Est. cost: ₹${params.cost})`
    );

    this.persist();
    return newMaintenance;
  }

  public updateMaintenanceStatus(
    id: number,
    status: Maintenance['status'],
    notes?: string
  ): Maintenance {
    const m = this.data.maintenance.find((item) => item.maintenance_id === id);
    if (!m) throw new Error(`Maintenance #${id} not found.`);

    m.status = status;
    if (status === 'Completed') {
      m.completion_date = new Date().toISOString().split('T')[0];
    }
    if (notes) {
      m.description = `${m.description} [Update: ${notes}]`;
    }

    // Vehicle derived status update
    const vehicle = this.getVehicleById(m.vehicle_id);
    if (vehicle) {
      if (status === 'In Progress') {
        vehicle.status = 'Maintenance';
      } else if (status === 'Completed') {
        // Re-evaluate vehicle status
        const activeRental = this.data.rentals.find(
          (r) => r.vehicle_id === vehicle.vehicle_id && r.status === 'Active'
        );
        vehicle.status = activeRental ? 'Rented' : 'Available';
      }
    }

    this.logAudit(
      'MAINTENANCE_STATUS_CHANGED',
      this.data.settings.activeRole,
      'MAINTENANCE',
      id,
      `Maintenance #${id} status changed to ${status}`
    );

    this.persist();
    return m;
  }

  // ==================== AUDIT & SETTINGS ====================
  public getAuditLogs(): AuditEvent[] {
    return [...this.data.auditLogs];
  }

  public getNotifications(): NotificationItem[] {
    return [...this.data.notifications];
  }

  public getSettings(): AppSettings {
    return { ...this.data.settings };
  }

  public updateSettings(updates: Partial<AppSettings>): AppSettings {
    this.data.settings = { ...this.data.settings, ...updates };
    this.logAudit(
      'SETTINGS_UPDATED',
      this.data.settings.activeRole,
      'SYSTEM',
      0,
      `Updated settings: Tax rate=${this.data.settings.taxRatePercent}%, Active Role=${this.data.settings.activeRole}`
    );
    this.persist();
    return { ...this.data.settings };
  }

  public setActiveRole(role: StaffRole) {
    this.data.settings.activeRole = role;
    this.persist();
  }

  public setActiveCustomerId(customerId: number) {
    this.data.settings.activeCustomerId = customerId;
    this.persist();
  }

  public resetDemoData() {
    this.data = {
      vehicles: [...INITIAL_VEHICLES],
      customers: [...INITIAL_CUSTOMERS],
      staff: [...INITIAL_STAFF],
      rentals: [...INITIAL_RENTALS],
      payments: [...INITIAL_PAYMENTS],
      maintenance: [...INITIAL_MAINTENANCE],
      auditLogs: [...INITIAL_AUDIT_LOGS],
      notifications: [...INITIAL_NOTIFICATIONS],
      settings: { ...INITIAL_SETTINGS },
    };
    this.persist();
  }
}

export const dbStore = new DBStore();
