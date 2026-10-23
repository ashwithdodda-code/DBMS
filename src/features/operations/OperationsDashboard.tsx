import React, { useState } from 'react';
import {
  Car,
  CalendarCheck,
  Users,
  CreditCard,
  Wrench,
  TrendingUp,
  ArrowUpRight,
  Plus,
  Clock,
  AlertTriangle,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { Vehicle, Customer, Rental, Payment, Maintenance, StaffRole } from '../../types';
import { formatINR, formatDate, getRentalStatusStyle, getPaymentStatusStyle } from '../../utils/formatters';

interface OperationsDashboardProps {
  vehicles: Vehicle[];
  customers: Customer[];
  rentals: Rental[];
  payments: Payment[];
  maintenance: Maintenance[];
  activeRole: StaffRole;
  onNavigate: (route: string) => void;
  onQuickAddVehicle: () => void;
  onQuickCreateRental: () => void;
}

export const OperationsDashboard: React.FC<OperationsDashboardProps> = ({
  vehicles,
  customers,
  rentals,
  payments,
  maintenance,
  activeRole,
  onNavigate,
  onQuickAddVehicle,
  onQuickCreateRental,
}) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');

  // Derive metrics strictly from application data
  const totalVehicles = vehicles.length;
  const availableVehicles = vehicles.filter((v) => v.status === 'Available').length;
  const rentedVehicles = vehicles.filter((v) => v.status === 'Rented').length;
  const maintenanceVehicles = vehicles.filter((v) => v.status === 'Maintenance').length;
  const activeRentals = rentals.filter((r) => r.status === 'Active').length;
  const totalCustomers = customers.length;

  // Real collected revenue = completed payments minus refunded payments
  const completedPaymentsSum = payments
    .filter((p) => p.status === 'Completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const refundedPaymentsSum = payments
    .filter((p) => p.status === 'Refunded')
    .reduce((sum, p) => sum + p.amount, 0);

  const netRevenue = completedPaymentsSum - refundedPaymentsSum;

  const pendingPaymentsSum = payments
    .filter((p) => p.status === 'Pending')
    .reduce((sum, p) => sum + p.amount, 0);

  // Fleet utilization percentage
  const utilizationRate = totalVehicles > 0 ? Math.round((rentedVehicles / totalVehicles) * 100) : 0;

  // Operational Panels
  const upcomingReturns = rentals
    .filter((r) => r.status === 'Active')
    .slice(0, 4);

  const pendingPaymentRentals = rentals
    .filter((r) => {
      const p = payments.find((pay) => pay.rental_id === r.rental_id);
      return p?.status === 'Pending' || p?.status === 'Failed';
    })
    .slice(0, 4);

  const maintenanceDue = maintenance
    .filter((m) => m.status === 'In Progress' || m.status === 'Scheduled')
    .slice(0, 4);

  // Top rented vehicles
  const vehicleRentalCounts = vehicles.map((v) => {
    const count = rentals.filter((r) => r.vehicle_id === v.vehicle_id).length;
    return { vehicle: v, count };
  });
  vehicleRentalCounts.sort((a, b) => b.count - a.count);
  const topVehicles = vehicleRentalCounts.slice(0, 4);

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono text-[#C7F36B] uppercase tracking-wider">Fleet Operations & Intelligence</span>
            <span className="text-slate-600">·</span>
            <span className="text-[11px] text-[#93A1B2]">Console Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F4F7FA]">Fleet overview</h1>
          <p className="text-xs sm:text-sm text-[#93A1B2] mt-0.5">
            Monitor bookings, fleet utilization, revenue, and operations in one place.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2.5">
          {activeRole !== 'Maintenance Staff' && (
            <button
              onClick={onQuickCreateRental}
              className="px-3.5 py-2 rounded-lg bg-[#C7F36B] hover:bg-[#b8e55e] text-[#080B10] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Rental</span>
            </button>
          )}

          {(activeRole === 'Admin' || activeRole === 'Manager') && (
            <button
              onClick={onQuickAddVehicle}
              className="px-3.5 py-2 rounded-lg bg-[#18212C] hover:bg-[#263241] border border-[#263241] text-[#F4F7FA] text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Car className="w-3.5 h-3.5 text-[#55D6E8]" />
              <span>Add Vehicle</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-xl bg-[#121821] border border-[#263241]">
          <span className="text-[11px] text-[#93A1B2]">Total Fleet</span>
          <p className="text-2xl font-bold font-mono text-[#F4F7FA] mt-1 tabular-nums">{totalVehicles}</p>
          <p className="text-[10px] text-[#93A1B2] mt-1">100% Registered</p>
        </div>

        <div className="p-4 rounded-xl bg-[#121821] border border-[#263241]">
          <span className="text-[11px] text-[#93A1B2]">Available Units</span>
          <p className="text-2xl font-bold font-mono text-[#C7F36B] mt-1 tabular-nums">{availableVehicles}</p>
          <p className="text-[10px] text-emerald-400 mt-1">Ready for dispatch</p>
        </div>

        <div className="p-4 rounded-xl bg-[#121821] border border-[#263241]">
          <span className="text-[11px] text-[#93A1B2]">Active Rentals</span>
          <p className="text-2xl font-bold font-mono text-[#55D6E8] mt-1 tabular-nums">{activeRentals}</p>
          <p className="text-[10px] text-[#55D6E8] mt-1">{utilizationRate}% fleet utilization</p>
        </div>

        <div className="p-4 rounded-xl bg-[#121821] border border-[#263241]">
          <span className="text-[11px] text-[#93A1B2]">Registered Customers</span>
          <p className="text-2xl font-bold font-mono text-[#F4F7FA] mt-1 tabular-nums">{totalCustomers}</p>
          <p className="text-[10px] text-[#93A1B2] mt-1">Verified licenses</p>
        </div>

        <div className="p-4 rounded-xl bg-[#121821] border border-[#263241]">
          <span className="text-[11px] text-[#93A1B2]">Net Revenue Collected</span>
          <p className="text-2xl font-bold font-mono text-[#C7F36B] mt-1 tabular-nums">{formatINR(netRevenue)}</p>
          <p className="text-[10px] text-[#93A1B2] mt-1">After recorded refunds</p>
        </div>

        <div className="p-4 rounded-xl bg-[#121821] border border-[#263241]">
          <span className="text-[11px] text-[#93A1B2]">Pending Balance</span>
          <p className="text-2xl font-bold font-mono text-amber-400 mt-1 tabular-nums">{formatINR(pendingPaymentsSum)}</p>
          <p className="text-[10px] text-amber-400/80 mt-1">Awaiting hub pickup</p>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Fleet Status Donut & Category Distribution */}
        <div className="lg:col-span-5 bg-[#121821] border border-[#263241] rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#263241]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#F4F7FA]">Fleet Operational Distribution</h3>
            <span className="text-[11px] font-mono text-[#93A1B2]">{totalVehicles} Total</span>
          </div>

          {/* Donut representation */}
          <div className="flex items-center justify-center gap-8 py-2">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                {/* Background track */}
                <path
                  className="text-[#18212C]"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* Available Arc */}
                <path
                  className="text-[#C7F36B]"
                  strokeDasharray={`${totalVehicles > 0 ? (availableVehicles / totalVehicles) * 100 : 0}, 100`}
                  strokeWidth="3.8"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* Rented Arc */}
                <path
                  className="text-[#55D6E8]"
                  strokeDasharray={`${totalVehicles > 0 ? (rentedVehicles / totalVehicles) * 100 : 0}, 100`}
                  strokeDashoffset={`-${totalVehicles > 0 ? (availableVehicles / totalVehicles) * 100 : 0}`}
                  strokeWidth="3.8"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-xl font-bold font-mono text-[#F4F7FA]">{utilizationRate}%</span>
                <span className="text-[9px] text-[#93A1B2]">Active Rented</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#C7F36B]" />
                <span className="text-[#93A1B2]">Available ({availableVehicles})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#55D6E8]" />
                <span className="text-[#93A1B2]">Rented ({rentedVehicles})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
                <span className="text-[#93A1B2]">Maintenance ({maintenanceVehicles})</span>
              </div>
            </div>
          </div>

          {/* Category bars */}
          <div className="space-y-2 pt-2 border-t border-[#263241]/70">
            {['SUV', 'Luxury', 'Sedan', 'Electric', 'Economy'].map((cat) => {
              const count = vehicles.filter((v) => v.vehicle_type === cat).length;
              const pct = totalVehicles > 0 ? Math.round((count / totalVehicles) * 100) : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#93A1B2]">{cat}</span>
                    <span className="font-mono text-[#F4F7FA]">{count} units ({pct}%)</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#0D1118] overflow-hidden">
                    <div className="h-full bg-[#55D6E8]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue Flow & Top Rented Vehicles */}
        <div className="lg:col-span-7 bg-[#121821] border border-[#263241] rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#263241]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#F4F7FA]">Top Rented Fleet Vehicles</h3>
            <button
              onClick={() => onNavigate('/admin/fleet')}
              className="text-[11px] text-[#C7F36B] hover:underline flex items-center gap-1"
            >
              <span>Manage Fleet</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {topVehicles.map(({ vehicle, count }) => (
              <div
                key={vehicle.vehicle_id}
                className="p-3 rounded-lg bg-[#0D1118] border border-[#263241] flex items-center justify-between hover:border-slate-500 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={vehicle.image_url}
                    alt={vehicle.model}
                    referrerPolicy="no-referrer"
                    className="w-16 h-10 object-cover rounded bg-[#18212C]"
                  />
                  <div>
                    <p className="text-xs font-bold text-[#F4F7FA]">{vehicle.brand} {vehicle.model}</p>
                    <p className="text-[11px] font-mono text-[#93A1B2]">{vehicle.registration_no} · {vehicle.vehicle_type}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs font-bold font-mono text-[#C7F36B]">{count} bookings</p>
                  <p className="text-[11px] text-[#93A1B2]">{formatINR(vehicle.rental_rate)}/day</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Payment Status Overview */}
          <div className="pt-2 border-t border-[#263241]/70">
            <h4 className="text-[11px] font-semibold text-[#93A1B2] uppercase mb-2">Payment Ledger Breakdown</h4>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 rounded bg-[#0D1118] border border-[#263241]">
                <span className="text-[10px] text-emerald-400">Completed</span>
                <p className="font-mono font-bold text-[#F4F7FA]">{payments.filter((p) => p.status === 'Completed').length}</p>
              </div>
              <div className="p-2 rounded bg-[#0D1118] border border-[#263241]">
                <span className="text-[10px] text-amber-400">Pending</span>
                <p className="font-mono font-bold text-[#F4F7FA]">{payments.filter((p) => p.status === 'Pending').length}</p>
              </div>
              <div className="p-2 rounded bg-[#0D1118] border border-[#263241]">
                <span className="text-[10px] text-rose-400">Failed</span>
                <p className="font-mono font-bold text-[#F4F7FA]">{payments.filter((p) => p.status === 'Failed').length}</p>
              </div>
              <div className="p-2 rounded bg-[#0D1118] border border-[#263241]">
                <span className="text-[10px] text-[#55D6E8]">Refunded</span>
                <p className="font-mono font-bold text-[#F4F7FA]">{payments.filter((p) => p.status === 'Refunded').length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Action Panels: Returns, Pending Payments, Maintenance */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Panel 1: Active Vehicles Due for Return */}
        <div className="bg-[#121821] border border-[#263241] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#263241]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#55D6E8]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#F4F7FA]">Active Returns</h3>
            </div>
            <button
              onClick={() => onNavigate('/admin/rentals')}
              className="text-[11px] text-[#55D6E8] hover:underline"
            >
              View all
            </button>
          </div>

          <div className="space-y-2.5">
            {upcomingReturns.length === 0 ? (
              <p className="text-xs text-[#93A1B2] py-4 text-center">No active vehicles currently out.</p>
            ) : (
              upcomingReturns.map((rental) => {
                const vehicle = vehicles.find((v) => v.vehicle_id === rental.vehicle_id);
                const customer = customers.find((c) => c.customer_id === rental.customer_id);

                return (
                  <div key={rental.rental_id} className="p-2.5 rounded-lg bg-[#0D1118] border border-[#263241] text-xs">
                    <div className="flex justify-between font-semibold text-[#F4F7FA]">
                      <span>{vehicle?.brand} {vehicle?.model}</span>
                      <span className="font-mono text-[#55D6E8]">Due: {rental.return_date}</span>
                    </div>
                    <div className="flex justify-between text-[#93A1B2] text-[11px] mt-1">
                      <span>Renter: {customer?.name}</span>
                      <span className="font-mono">#{rental.rental_id}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Panel 2: Pending Payments */}
        <div className="bg-[#121821] border border-[#263241] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#263241]">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#F4F7FA]">Pending Ledger</h3>
            </div>
            <button
              onClick={() => onNavigate('/admin/payments')}
              className="text-[11px] text-amber-400 hover:underline"
            >
              Ledger
            </button>
          </div>

          <div className="space-y-2.5">
            {pendingPaymentRentals.length === 0 ? (
              <p className="text-xs text-[#93A1B2] py-4 text-center">All payments reconciled.</p>
            ) : (
              pendingPaymentRentals.map((rental) => {
                const customer = customers.find((c) => c.customer_id === rental.customer_id);
                const pay = payments.find((p) => p.rental_id === rental.rental_id);

                return (
                  <div key={rental.rental_id} className="p-2.5 rounded-lg bg-[#0D1118] border border-[#263241] text-xs">
                    <div className="flex justify-between font-semibold text-[#F4F7FA]">
                      <span>Rental #{rental.rental_id}</span>
                      <span className="font-mono text-amber-400">{formatINR(rental.total_amount)}</span>
                    </div>
                    <div className="flex justify-between text-[#93A1B2] text-[11px] mt-1">
                      <span>Customer: {customer?.name}</span>
                      <span className="text-amber-300 font-semibold">{pay?.status || 'Pending'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Panel 3: Maintenance Bay */}
        <div className="bg-[#121821] border border-[#263241] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#263241]">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-rose-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#F4F7FA]">Workshop Status</h3>
            </div>
            <button
              onClick={() => onNavigate('/admin/maintenance')}
              className="text-[11px] text-rose-400 hover:underline"
            >
              Bay details
            </button>
          </div>

          <div className="space-y-2.5">
            {maintenanceDue.length === 0 ? (
              <p className="text-xs text-[#93A1B2] py-4 text-center">No vehicles currently under maintenance.</p>
            ) : (
              maintenanceDue.map((m) => {
                const vehicle = vehicles.find((v) => v.vehicle_id === m.vehicle_id);

                return (
                  <div key={m.maintenance_id} className="p-2.5 rounded-lg bg-[#0D1118] border border-[#263241] text-xs">
                    <div className="flex justify-between font-semibold text-[#F4F7FA]">
                      <span>{vehicle?.brand} {vehicle?.model}</span>
                      <span className="font-mono text-rose-400">{formatINR(m.cost)}</span>
                    </div>
                    <p className="text-[11px] text-[#93A1B2] truncate mt-1">{m.description}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
