import React, { useState } from 'react';
import {
  Database,
  Key,
  Link,
  Layers,
  ArrowRight,
  Info,
  CheckCircle2,
  Table as TableIcon,
  ChevronRight,
} from 'lucide-react';
import { dbStore } from '../../services/dbStore';

interface TableDefinition {
  name: string;
  description: string;
  primaryKey: string;
  foreignKeys: { column: string; references: string }[];
  uniqueKeys: string[];
  columns: { name: string; type: string; nullable: boolean; isPk?: boolean; isFk?: boolean; ref?: string; note?: string }[];
  relationNotation: string;
}

const SCHEMA_DEFINITIONS: TableDefinition[] = [
  {
    name: 'CUSTOMER',
    description: 'Stores verified automotive renters, contact details, and driving credentials.',
    primaryKey: 'customer_id',
    foreignKeys: [],
    uniqueKeys: ['email', 'driving_license'],
    relationNotation: 'CUSTOMER(customer_id PK, name, email UNIQUE, phone, driving_license UNIQUE, address, created_at)',
    columns: [
      { name: 'customer_id', type: 'INT', nullable: false, isPk: true, note: 'Primary Key (Auto-increment)' },
      { name: 'name', type: 'VARCHAR(100)', nullable: false, note: 'Customer Full Name' },
      { name: 'email', type: 'VARCHAR(150)', nullable: false, note: 'Unique Email Address' },
      { name: 'phone', type: 'VARCHAR(20)', nullable: false, note: 'Contact Number' },
      { name: 'driving_license', type: 'VARCHAR(50)', nullable: false, note: 'Unique Government Driving License' },
      { name: 'address', type: 'VARCHAR(255)', nullable: true, note: 'Residential Address' },
      { name: 'created_at', type: 'TIMESTAMP', nullable: false, note: 'Record Creation Timestamp' },
    ],
  },
  {
    name: 'VEHICLE',
    description: 'Fleet physical assets, technical specifications, daily tariffs, and operational states.',
    primaryKey: 'vehicle_id',
    foreignKeys: [],
    uniqueKeys: ['registration_no'],
    relationNotation: 'VEHICLE(vehicle_id PK, registration_no UNIQUE, brand, model, vehicle_type, rental_rate, status, fuel_type, transmission, seating_capacity)',
    columns: [
      { name: 'vehicle_id', type: 'INT', nullable: false, isPk: true, note: 'Primary Key' },
      { name: 'registration_no', type: 'VARCHAR(25)', nullable: false, note: 'Unique State Registration Plate' },
      { name: 'brand', type: 'VARCHAR(50)', nullable: false, note: 'Automotive Manufacturer' },
      { name: 'model', type: 'VARCHAR(80)', nullable: false, note: 'Model Variant Name' },
      { name: 'model_year', type: 'INT', nullable: false, note: 'Manufacturing Year' },
      { name: 'vehicle_type', type: 'VARCHAR(40)', nullable: false, note: 'Category: Economy | Sedan | SUV | Luxury | Electric | Sports' },
      { name: 'rental_rate', type: 'DECIMAL(10,2)', nullable: false, note: 'Daily Base Tariff in INR' },
      { name: 'fuel_type', type: 'VARCHAR(30)', nullable: false, note: 'Petrol | Diesel | Electric | Hybrid' },
      { name: 'transmission', type: 'VARCHAR(30)', nullable: false, note: 'Automatic | Manual' },
      { name: 'seating_capacity', type: 'INT', nullable: false, note: 'Passenger Capacity' },
      { name: 'status', type: 'VARCHAR(30)', nullable: false, note: 'Available | Rented | Maintenance | Inactive' },
    ],
  },
  {
    name: 'STAFF',
    description: 'Internal operations employees, role-based authorization hierarchies, and duty stations.',
    primaryKey: 'staff_id',
    foreignKeys: [],
    uniqueKeys: ['email'],
    relationNotation: 'STAFF(staff_id PK, name, email UNIQUE, phone, role, active)',
    columns: [
      { name: 'staff_id', type: 'INT', nullable: false, isPk: true, note: 'Primary Key' },
      { name: 'name', type: 'VARCHAR(100)', nullable: false, note: 'Staff Member Name' },
      { name: 'email', type: 'VARCHAR(150)', nullable: false, note: 'Internal Velocity OS Email' },
      { name: 'phone', type: 'VARCHAR(20)', nullable: false, note: 'Direct Mobile' },
      { name: 'role', type: 'VARCHAR(50)', nullable: false, note: 'Admin | Manager | Rental Agent | Maintenance Staff' },
      { name: 'active', type: 'BOOLEAN', nullable: false, note: 'Active Employment Status' },
    ],
  },
  {
    name: 'RENTAL',
    description: 'Contractual transaction linking a customer, assigned vehicle, and authorizing staff member.',
    primaryKey: 'rental_id',
    foreignKeys: [
      { column: 'customer_id', references: 'CUSTOMER.customer_id' },
      { column: 'vehicle_id', references: 'VEHICLE.vehicle_id' },
      { column: 'staff_id', references: 'STAFF.staff_id' },
    ],
    uniqueKeys: [],
    relationNotation: 'RENTAL(rental_id PK, customer_id FK, vehicle_id FK, staff_id FK, rental_date, return_date, total_amount, status, created_at)',
    columns: [
      { name: 'rental_id', type: 'INT', nullable: false, isPk: true, note: 'Primary Key' },
      { name: 'customer_id', type: 'INT', nullable: false, isFk: true, ref: 'CUSTOMER.customer_id', note: 'Foreign Key to CUSTOMER' },
      { name: 'vehicle_id', type: 'INT', nullable: false, isFk: true, ref: 'VEHICLE.vehicle_id', note: 'Foreign Key to VEHICLE' },
      { name: 'staff_id', type: 'INT', nullable: false, isFk: true, ref: 'STAFF.staff_id', note: 'Foreign Key to STAFF' },
      { name: 'rental_date', type: 'DATE', nullable: false, note: 'Reservation Pickup Date' },
      { name: 'return_date', type: 'DATE', nullable: false, note: 'Scheduled Return Date' },
      { name: 'total_amount', type: 'DECIMAL(10,2)', nullable: false, note: 'Calculated Billable Total (Days × Rate + Tax)' },
      { name: 'status', type: 'VARCHAR(40)', nullable: false, note: 'Pending | Confirmed | Active | Completed | Cancelled' },
      { name: 'created_at', type: 'TIMESTAMP', nullable: false, note: 'Transaction Timestamp' },
    ],
  },
  {
    name: 'PAYMENT',
    description: 'Financial cash-flow ledger referencing specific rental agreements.',
    primaryKey: 'payment_id',
    foreignKeys: [{ column: 'rental_id', references: 'RENTAL.rental_id' }],
    uniqueKeys: ['transaction_reference'],
    relationNotation: 'PAYMENT(payment_id PK, rental_id FK, amount, payment_date, method, status, transaction_reference UNIQUE)',
    columns: [
      { name: 'payment_id', type: 'INT', nullable: false, isPk: true, note: 'Primary Key' },
      { name: 'rental_id', type: 'INT', nullable: false, isFk: true, ref: 'RENTAL.rental_id', note: 'Foreign Key to RENTAL' },
      { name: 'amount', type: 'DECIMAL(10,2)', nullable: false, note: 'Transaction Monetary Amount' },
      { name: 'payment_date', type: 'TIMESTAMP', nullable: false, note: 'Payment Capture Timestamp' },
      { name: 'method', type: 'VARCHAR(40)', nullable: false, note: 'UPI | Card | Cash | Bank Transfer' },
      { name: 'status', type: 'VARCHAR(40)', nullable: false, note: 'Pending | Completed | Failed | Refunded' },
      { name: 'transaction_reference', type: 'VARCHAR(100)', nullable: false, note: 'Unique Payment Gateway ID' },
    ],
  },
  {
    name: 'MAINTENANCE',
    description: 'Workshop service logs, scheduled safety inspections, and vehicle maintenance costs.',
    primaryKey: 'maintenance_id',
    foreignKeys: [
      { column: 'vehicle_id', references: 'VEHICLE.vehicle_id' },
      { column: 'staff_id', references: 'STAFF.staff_id' },
    ],
    uniqueKeys: [],
    relationNotation: 'MAINTENANCE(maintenance_id PK, vehicle_id FK, staff_id FK, date, cost, description, status)',
    columns: [
      { name: 'maintenance_id', type: 'INT', nullable: false, isPk: true, note: 'Primary Key' },
      { name: 'vehicle_id', type: 'INT', nullable: false, isFk: true, ref: 'VEHICLE.vehicle_id', note: 'Foreign Key to VEHICLE' },
      { name: 'staff_id', type: 'INT', nullable: false, isFk: true, ref: 'STAFF.staff_id', note: 'Foreign Key to STAFF' },
      { name: 'date', type: 'DATE', nullable: false, note: 'Workshop Service Date' },
      { name: 'cost', type: 'DECIMAL(10,2)', nullable: false, note: 'Labor & Parts Invoice Cost' },
      { name: 'description', type: 'TEXT', nullable: false, note: 'Scope of Service & Maintenance' },
      { name: 'status', type: 'VARCHAR(40)', nullable: false, note: 'Scheduled | In Progress | Completed' },
    ],
  },
];

export const DatabaseExplorer: React.FC = () => {
  const [selectedTable, setSelectedTable] = useState<TableDefinition>(SCHEMA_DEFINITIONS[0]);

  // Live row counts from reactive dbStore
  const rowCounts: Record<string, number> = {
    CUSTOMER: dbStore.getCustomers().length,
    VEHICLE: dbStore.getVehicles().length,
    STAFF: dbStore.getStaff().length,
    RENTAL: dbStore.getRentals().length,
    PAYMENT: dbStore.getPayments().length,
    MAINTENANCE: dbStore.getMaintenance().length,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono text-[#C7F36B] uppercase tracking-wider">DBMS Architecture Review</span>
            <span className="text-slate-600">·</span>
            <span className="text-[11px] text-[#93A1B2]">3NF Normalized Relational Model</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#F4F7FA]">Interactive Relational Schema Explorer</h1>
          <p className="text-xs text-[#93A1B2]">
            Six core normalized entities connected by referential integrity foreign key constraints.
          </p>
        </div>
      </div>

      {/* Visual ER Diagram Grid */}
      <div className="bg-[#121821] border border-[#263241] rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-[#263241]">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#55D6E8]" />
            <h2 className="text-xs font-bold text-[#F4F7FA] uppercase tracking-wider">
              Entity-Relationship (ER) Visual Map
            </h2>
          </div>
          <span className="text-[11px] text-[#93A1B2] font-mono">Click any table card to inspect columns</span>
        </div>

        {/* ER Diagram Representation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {SCHEMA_DEFINITIONS.map((def) => {
            const isSelected = selectedTable.name === def.name;
            const count = rowCounts[def.name] || 0;

            return (
              <div
                key={def.name}
                onClick={() => setSelectedTable(def)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#18212C] border-[#C7F36B] shadow-lg shadow-[#C7F36B]/5 ring-1 ring-[#C7F36B]'
                    : 'bg-[#0D1118] border-[#263241] hover:border-slate-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TableIcon className={`w-4 h-4 ${isSelected ? 'text-[#C7F36B]' : 'text-[#55D6E8]'}`} />
                    <span className="font-mono font-bold text-sm text-[#F4F7FA]">{def.name}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#121821] text-[#93A1B2] border border-[#263241]">
                    {count} live rows
                  </span>
                </div>

                <p className="text-[11px] text-[#93A1B2] line-clamp-2 mb-3 leading-relaxed">
                  {def.description}
                </p>

                <div className="space-y-1 pt-2 border-t border-[#263241]/70 text-[10px] font-mono">
                  <div className="flex items-center gap-1.5 text-[#C7F36B]">
                    <Key className="w-3 h-3 shrink-0" />
                    <span>PK: {def.primaryKey}</span>
                  </div>

                  {def.foreignKeys.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[#55D6E8]">
                      <Link className="w-3 h-3 shrink-0" />
                      <span>FK: {def.foreignKeys.map((fk) => fk.column).join(', ')}</span>
                    </div>
                  )}

                  {def.uniqueKeys.length > 0 && (
                    <div className="text-amber-400">
                      UNIQUE: {def.uniqueKeys.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Relational Relationships Summary */}
        <div className="p-4 rounded-xl bg-[#0D1118] border border-[#263241] grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-[#93A1B2]">
          <div className="flex items-center gap-2">
            <ArrowRight className="w-3.5 h-3.5 text-[#C7F36B]" />
            <span><strong>CUSTOMER (1:N) RENTAL</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <ArrowRight className="w-3.5 h-3.5 text-[#55D6E8]" />
            <span><strong>VEHICLE (1:N) RENTAL</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
            <span><strong>STAFF (1:N) RENTAL</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
            <span><strong>RENTAL (1:N) PAYMENT</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <ArrowRight className="w-3.5 h-3.5 text-rose-400" />
            <span><strong>VEHICLE (1:N) MAINTENANCE</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#C7F36B]" />
            <span><strong>3NF Normal Form: Zero transitive dependencies</strong></span>
          </div>
        </div>
      </div>

      {/* Selected Table Inspector Panel */}
      <div className="bg-[#121821] border border-[#263241] rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#263241]">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-[#C7F36B] font-bold uppercase">Table Definition</span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-[#93A1B2]">{rowCounts[selectedTable.name]} Total Records in Database</span>
            </div>
            <h3 className="text-xl font-bold font-mono text-[#F4F7FA] mt-1">{selectedTable.name}</h3>
          </div>

          <div className="p-2.5 rounded-lg bg-[#0D1118] border border-[#263241] font-mono text-xs text-[#55D6E8]">
            PK: {selectedTable.primaryKey}
          </div>
        </div>

        {/* Relational Schema Notation Box */}
        <div className="p-3.5 rounded-xl bg-[#080B10] border border-[#263241] font-mono text-xs text-[#C7F36B] overflow-x-auto">
          <span className="text-[#93A1B2] block text-[10px] uppercase font-sans mb-1">Formal Relational Notation</span>
          {selectedTable.relationNotation}
        </div>

        {/* Columns Table */}
        <div className="border border-[#263241] rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs text-[#F4F7FA]">
            <thead className="bg-[#0D1118] text-[#93A1B2] uppercase text-[10px] font-semibold border-b border-[#263241]">
              <tr>
                <th className="py-3 px-4">Column Name</th>
                <th className="py-3 px-4">SQL Type</th>
                <th className="py-3 px-4">Key Constraints</th>
                <th className="py-3 px-4">Nullable</th>
                <th className="py-3 px-4">Description / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263241]/60">
              {selectedTable.columns.map((col) => (
                <tr key={col.name} className="hover:bg-[#18212C]/40">
                  <td className="py-3 px-4 font-mono font-bold text-[#F4F7FA]">{col.name}</td>
                  <td className="py-3 px-4 font-mono text-[#55D6E8]">{col.type}</td>
                  <td className="py-3 px-4">
                    {col.isPk ? (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#C7F36B]/20 text-[#C7F36B] border border-[#C7F36B]/30">
                        PRIMARY KEY
                      </span>
                    ) : col.isFk ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#55D6E8]/20 text-[#55D6E8] border border-[#55D6E8]/30">
                        FK → {col.ref}
                      </span>
                    ) : selectedTable.uniqueKeys.includes(col.name) ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        UNIQUE
                      </span>
                    ) : (
                      <span className="text-[#93A1B2]/60 font-mono">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs">
                    {col.nullable ? <span className="text-[#93A1B2]">NULL</span> : <span className="text-amber-400 font-bold">NOT NULL</span>}
                  </td>
                  <td className="py-3 px-4 text-[#93A1B2]">{col.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
