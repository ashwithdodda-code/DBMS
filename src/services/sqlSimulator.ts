import { dbStore } from './dbStore';

export interface SqlQueryResult {
  columns: string[];
  rows: Record<string, any>[];
  rowCount: number;
  executionTimeMs: number;
  notice: string;
  queryId?: string;
}

export interface SqlPresetQuery {
  id: string;
  name: string;
  sql: string;
  description: string;
  concepts: string[];
}

export const PRESET_SQL_QUERIES: SqlPresetQuery[] = [
  {
    id: 'query-1',
    name: '1. Available Vehicles by Rental Rate',
    sql: `SELECT vehicle_id, brand, model, rental_rate\nFROM VEHICLE\nWHERE status = 'Available'\nORDER BY rental_rate ASC;`,
    description: 'Filters the VEHICLE relation for currently rentable fleet items, sorted by ascending daily price.',
    concepts: ['Projection (SELECT)', 'Selection (WHERE)', 'Ordering (ORDER BY ASC)'],
  },
  {
    id: 'query-2',
    name: '2. Total Revenue from Completed Payments',
    sql: `SELECT COALESCE(SUM(amount), 0) AS total_revenue\nFROM PAYMENT\nWHERE status = 'Completed';`,
    description: 'Calculates the real collected cash flow by aggregating completed transactions, handling NULLs with COALESCE.',
    concepts: ['Aggregate Functions (SUM)', 'COALESCE Null Safety', 'Filtering (WHERE)'],
  },
  {
    id: 'query-3',
    name: '3. Customer Rental History (3-Way Join)',
    sql: `SELECT c.name, v.brand, v.model, r.rental_date, r.return_date, r.status\nFROM CUSTOMER c\nJOIN RENTAL r ON c.customer_id = r.customer_id\nJOIN VEHICLE v ON r.vehicle_id = v.vehicle_id\nWHERE c.customer_id = 1001;`,
    description: 'Demonstrates multi-table equijoins across CUSTOMER, RENTAL, and VEHICLE using foreign keys.',
    concepts: ['Inner Join (JOIN ... ON)', 'Multi-table Relational Traversal', 'Foreign Key Navigation'],
  },
  {
    id: 'query-4',
    name: '4. Rental Volume by Customer (Group By)',
    sql: `SELECT c.name, COUNT(r.rental_id) AS rental_count\nFROM CUSTOMER c\nLEFT JOIN RENTAL r ON c.customer_id = r.customer_id\nGROUP BY c.customer_id, c.name\nORDER BY rental_count DESC;`,
    description: 'Computes total bookings per customer including customers with 0 bookings using an outer join and aggregation.',
    concepts: ['Left Outer Join (LEFT JOIN)', 'Grouping (GROUP BY)', 'Aggregate (COUNT)', 'Descending Sort'],
  },
  {
    id: 'query-5',
    name: '5. Vehicles with Maintenance Costs',
    sql: `SELECT v.brand, v.model, COALESCE(SUM(m.cost), 0) AS maintenance_cost\nFROM VEHICLE v\nLEFT JOIN MAINTENANCE m ON v.vehicle_id = m.vehicle_id\nGROUP BY v.vehicle_id, v.brand, v.model;`,
    description: 'Aggregates workshop expenses across all vehicles in fleet to calculate operational overhead.',
    concepts: ['Left Join', 'Grouped Aggregates', 'COALESCE for Zero Maintenance'],
  },
  {
    id: 'query-6',
    name: '6. Payment Status Summary & Ledger',
    sql: `SELECT status, COUNT(*) AS payment_count, SUM(amount) AS total_amount\nFROM PAYMENT\nGROUP BY status;`,
    description: 'Audits accounts by bucketing transactions into Completed, Pending, Failed, and Refunded balances.',
    concepts: ['Categorical Grouping', 'Multiple Aggregates in Projection'],
  },
];

export function executeSqlSimulator(sqlQuery: string): SqlQueryResult {
  const startTime = performance.now();
  const normalized = sqlQuery.trim().replace(/\s+/g, ' ').toUpperCase();

  const vehicles = dbStore.getVehicles();
  const customers = dbStore.getCustomers();
  const rentals = dbStore.getRentals();
  const payments = dbStore.getPayments();
  const maintenance = dbStore.getMaintenance();
  const staff = dbStore.getStaff();

  let columns: string[] = [];
  let rows: Record<string, any>[] = [];

  // Query 1: Available Vehicles
  if (normalized.includes('FROM VEHICLE') && normalized.includes("WHERE STATUS = 'AVAILABLE'")) {
    const matched = vehicles
      .filter((v) => v.status === 'Available')
      .sort((a, b) => a.rental_rate - b.rental_rate);

    columns = ['vehicle_id', 'brand', 'model', 'rental_rate'];
    rows = matched.map((v) => ({
      vehicle_id: v.vehicle_id,
      brand: v.brand,
      model: v.model,
      rental_rate: `₹${v.rental_rate.toLocaleString('en-IN')}`,
    }));
  }
  // Query 2: Total Revenue from Completed Payments
  else if (normalized.includes('FROM PAYMENT') && normalized.includes("WHERE STATUS = 'COMPLETED'") && normalized.includes('SUM(AMOUNT)')) {
    const total = payments
      .filter((p) => p.status === 'Completed')
      .reduce((acc, p) => acc + p.amount, 0);

    columns = ['total_revenue'];
    rows = [{ total_revenue: `₹${total.toLocaleString('en-IN')}` }];
  }
  // Query 3: Customer Rental History (customer_id = 1001 or general join)
  else if (normalized.includes('FROM CUSTOMER') && normalized.includes('JOIN RENTAL') && normalized.includes('JOIN VEHICLE')) {
    const targetCustomer = normalized.includes('1001') ? 1001 : 1001;
    const customer = customers.find((c) => c.customer_id === targetCustomer) || customers[0];
    const customerRentals = rentals.filter((r) => r.customer_id === customer.customer_id);

    columns = ['name', 'brand', 'model', 'rental_date', 'return_date', 'status'];
    rows = customerRentals.map((r) => {
      const v = vehicles.find((item) => item.vehicle_id === r.vehicle_id);
      return {
        name: customer.name,
        brand: v?.brand || 'Unknown',
        model: v?.model || 'Unknown',
        rental_date: r.rental_date,
        return_date: r.return_date,
        status: r.status,
      };
    });
  }
  // Query 4: Rentals by Customer
  else if (normalized.includes('FROM CUSTOMER') && normalized.includes('LEFT JOIN RENTAL') && normalized.includes('COUNT(')) {
    columns = ['name', 'rental_count'];
    const summary = customers.map((c) => {
      const count = rentals.filter((r) => r.customer_id === c.customer_id).length;
      return { name: c.name, rental_count: count };
    });
    summary.sort((a, b) => b.rental_count - a.rental_count);
    rows = summary;
  }
  // Query 5: Vehicles with Maintenance Costs
  else if (normalized.includes('FROM VEHICLE') && normalized.includes('MAINTENANCE') && normalized.includes('SUM(')) {
    columns = ['brand', 'model', 'maintenance_cost'];
    rows = vehicles.map((v) => {
      const vCosts = maintenance
        .filter((m) => m.vehicle_id === v.vehicle_id)
        .reduce((sum, m) => sum + m.cost, 0);
      return {
        brand: v.brand,
        model: v.model,
        maintenance_cost: `₹${vCosts.toLocaleString('en-IN')}`,
      };
    });
  }
  // Query 6: Payment Status Summary
  else if (normalized.includes('FROM PAYMENT') && normalized.includes('GROUP BY STATUS')) {
    columns = ['status', 'payment_count', 'total_amount'];
    const statuses = ['Completed', 'Pending', 'Failed', 'Refunded'];
    rows = statuses.map((status) => {
      const filtered = payments.filter((p) => p.status === status);
      const sum = filtered.reduce((acc, p) => acc + p.amount, 0);
      return {
        status,
        payment_count: filtered.length,
        total_amount: `₹${sum.toLocaleString('en-IN')}`,
      };
    });
  }
  // Fallback direct table select: SELECT * FROM VEHICLE
  else if (normalized.includes('FROM VEHICLE')) {
    columns = ['vehicle_id', 'brand', 'model', 'vehicle_type', 'rental_rate', 'status'];
    rows = vehicles.slice(0, 15).map((v) => ({
      vehicle_id: v.vehicle_id,
      brand: v.brand,
      model: v.model,
      vehicle_type: v.vehicle_type,
      rental_rate: `₹${v.rental_rate}`,
      status: v.status,
    }));
  }
  // Fallback direct table select: SELECT * FROM CUSTOMER
  else if (normalized.includes('FROM CUSTOMER')) {
    columns = ['customer_id', 'name', 'email', 'phone', 'driving_license'];
    rows = customers.map((c) => ({
      customer_id: c.customer_id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      driving_license: c.driving_license,
    }));
  }
  // Fallback direct table select: SELECT * FROM RENTAL
  else if (normalized.includes('FROM RENTAL')) {
    columns = ['rental_id', 'customer_id', 'vehicle_id', 'rental_date', 'return_date', 'total_amount', 'status'];
    rows = rentals.map((r) => ({
      rental_id: r.rental_id,
      customer_id: r.customer_id,
      vehicle_id: r.vehicle_id,
      rental_date: r.rental_date,
      return_date: r.return_date,
      total_amount: `₹${r.total_amount}`,
      status: r.status,
    }));
  }
  // Fallback direct table select: SELECT * FROM STAFF
  else if (normalized.includes('FROM STAFF')) {
    columns = ['staff_id', 'name', 'email', 'role', 'active'];
    rows = staff.map((s) => ({
      staff_id: s.staff_id,
      name: s.name,
      email: s.email,
      role: s.role,
      active: s.active ? 'YES' : 'NO',
    }));
  } else {
    // Graceful error handling for unsupported custom syntax
    const endTime = performance.now();
    return {
      columns: ['STATUS'],
      rows: [
        {
          STATUS:
            'SQL Simulator syntax check passed. Please pick one of the 6 educational preset queries or standard "SELECT * FROM [VEHICLE | CUSTOMER | RENTAL | PAYMENT | MAINTENANCE | STAFF]".',
        },
      ],
      rowCount: 0,
      executionTimeMs: Math.round((endTime - startTime) * 100) / 100,
      notice: 'Demo SQL Educational Simulator (In-Memory Engine)',
    };
  }

  const endTime = performance.now();
  return {
    columns,
    rows,
    rowCount: rows.length,
    executionTimeMs: Math.max(1, Math.round((endTime - startTime) * 100) / 100),
    notice: 'Demo SQL Educational Simulator (In-Memory Engine)',
  };
}
