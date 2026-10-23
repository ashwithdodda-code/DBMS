import React, { useState, useMemo } from 'react';
import {
  CalendarCheck,
  Search,
  Filter,
  Check,
  Play,
  RotateCcw,
  XCircle,
  UserCheck,
  Download,
  AlertTriangle,
  Clock,
  Car,
} from 'lucide-react';
import { Rental, Vehicle, Customer, Staff, Payment, RentalStatus, StaffRole } from '../../types';
import { formatINR, formatDate, getRentalStatusStyle, getPaymentStatusStyle } from '../../utils/formatters';
import { dbStore } from '../../services/dbStore';
import { Modal } from '../../components/common/Modal';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { useToast } from '../../components/common/ToastProvider';

interface RentalManagementProps {
  rentals: Rental[];
  vehicles: Vehicle[];
  customers: Customer[];
  staff: Staff[];
  payments: Payment[];
  activeRole: StaffRole;
}

export const RentalManagement: React.FC<RentalManagementProps> = ({
  rentals,
  vehicles,
  customers,
  staff,
  payments,
  activeRole,
}) => {
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Return completion modal state
  const [completingRental, setCompletingRental] = useState<Rental | null>(null);
  const [returnNotes, setReturnNotes] = useState('Vehicle inspected. Sanitized and ready for next dispatch.');

  // Staff assignment modal state
  const [assigningRental, setAssigningRental] = useState<Rental | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<number>(staff[0]?.staff_id || 501);

  // Cancellation state
  const [cancellingRental, setCancellingRental] = useState<Rental | null>(null);

  const filteredRentals = useMemo(() => {
    return rentals
      .filter((r) => {
        if (statusFilter !== 'All' && r.status !== statusFilter) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          const c = customers.find((cust) => cust.customer_id === r.customer_id);
          const v = vehicles.find((veh) => veh.vehicle_id === r.vehicle_id);

          const matchId = r.rental_id.toString().includes(q);
          const matchCustomer = c?.name.toLowerCase().includes(q) || c?.email.toLowerCase().includes(q);
          const matchVehicle = v?.brand.toLowerCase().includes(q) || v?.model.toLowerCase().includes(q);

          if (!matchId && !matchCustomer && !matchVehicle) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [rentals, statusFilter, search, customers, vehicles]);

  // Actions
  const handleConfirmReservation = (rentalId: number) => {
    try {
      dbStore.updateRentalStatus(rentalId, 'Confirmed');
      showToast(`Reservation #${rentalId} marked as Confirmed.`, 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleStartRental = (rentalId: number) => {
    try {
      dbStore.updateRentalStatus(rentalId, 'Active');
      showToast(`Rental #${rentalId} dispatched: Vehicle status updated to Rented.`, 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleConfirmReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingRental) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      dbStore.updateRentalStatus(
        completingRental.rental_id,
        'Completed',
        today,
        returnNotes
      );
      showToast(`Rental #${completingRental.rental_id} return processed. Availability recalculated.`, 'success');
      setCompletingRental(null);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleConfirmCancel = () => {
    if (!cancellingRental) return;

    try {
      dbStore.updateRentalStatus(cancellingRental.rental_id, 'Cancelled');
      showToast(`Rental #${cancellingRental.rental_id} cancelled. Vehicle returned to available pool.`, 'info');
      setCancellingRental(null);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleSaveStaffAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningRental) return;

    try {
      dbStore.assignStaffToRental(assigningRental.rental_id, selectedStaffId);
      showToast(`Assigned staff #${selectedStaffId} to Rental #${assigningRental.rental_id}.`, 'success');
      setAssigningRental(null);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Rental_ID', 'Customer', 'Vehicle', 'Rental_Date', 'Return_Date', 'Amount_INR', 'Status', 'Assigned_Staff'];
    const rows = filteredRentals.map((r) => {
      const c = customers.find((cust) => cust.customer_id === r.customer_id);
      const v = vehicles.find((veh) => veh.vehicle_id === r.vehicle_id);
      const s = staff.find((st) => st.staff_id === r.staff_id);

      return [
        r.rental_id,
        `"${c?.name || 'Unknown'}"`,
        `"${v?.brand || ''} ${v?.model || ''}"`,
        r.rental_date,
        r.return_date,
        r.total_amount,
        r.status,
        `"${s?.name || 'Unassigned'}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `velocity_rentals_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Rental records exported to CSV.', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#F4F7FA]">Rental & Reservation Management</h1>
          <p className="text-xs text-[#93A1B2]">
            Complete transaction lifecycle: Pending Confirmation → Confirmed → Active → Completed.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-3.5 py-2 rounded-lg bg-[#18212C] hover:bg-[#263241] border border-[#263241] text-[#F4F7FA] text-xs font-semibold flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-[#C7F36B]" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-4 rounded-xl bg-[#121821] border border-[#263241] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-[#93A1B2] absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search booking ID, customer, vehicle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] placeholder-[#93A1B2] focus:outline-none focus:border-[#C7F36B]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {['All', 'Pending Confirmation', 'Confirmed', 'Active', 'Completed', 'Cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-[#18212C] text-[#C7F36B] border border-[#C7F36B]/30'
                  : 'bg-[#0D1118] text-[#93A1B2] hover:text-[#F4F7FA] border border-[#263241]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Rentals Table */}
      <div className="bg-[#121821] border border-[#263241] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#F4F7FA]">
            <thead className="bg-[#0D1118] text-[#93A1B2] uppercase text-[10px] font-semibold border-b border-[#263241]">
              <tr>
                <th className="py-3 px-4">Booking ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4">Rental Window</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assigned Staff</th>
                <th className="py-3 px-4 text-right">Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263241]/60">
              {filteredRentals.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#93A1B2]">
                    No rentals match selected criteria.
                  </td>
                </tr>
              ) : (
                filteredRentals.map((r) => {
                  const c = customers.find((cust) => cust.customer_id === r.customer_id);
                  const v = vehicles.find((veh) => veh.vehicle_id === r.vehicle_id);
                  const s = staff.find((st) => st.staff_id === r.staff_id);
                  const p = payments.find((pay) => pay.rental_id === r.rental_id);

                  return (
                    <tr key={r.rental_id} className="hover:bg-[#18212C]/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#55D6E8]">#{r.rental_id}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-[#F4F7FA]">{c?.name || `Customer #${r.customer_id}`}</span>
                        <span className="block text-[10px] text-[#93A1B2] font-mono">{c?.email}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-[#F4F7FA]">{v ? `${v.brand} ${v.model}` : `Vehicle #${r.vehicle_id}`}</span>
                        <span className="block text-[10px] font-mono text-[#93A1B2]">{v?.registration_no}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[#93A1B2]">
                        <span>{r.rental_date}</span>
                        <span className="block text-[10px] text-slate-500">→ {r.return_date}</span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[#C7F36B]">
                        {formatINR(r.total_amount)}
                      </td>
                      <td className="py-3 px-4">
                        {p ? (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getPaymentStatusStyle(p.status)}`}>
                            {p.status}
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#93A1B2]">Unbilled</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getRentalStatusStyle(r.status)}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => {
                            setAssigningRental(r);
                            setSelectedStaffId(r.staff_id);
                          }}
                          className="hover:text-[#55D6E8] flex items-center gap-1 transition-colors"
                          title="Click to reassign staff"
                        >
                          <span className="text-[#93A1B2]">{s?.name || 'Unassigned'}</span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Pending -> Confirmed */}
                          {r.status === 'Pending Confirmation' && (
                            <button
                              onClick={() => handleConfirmReservation(r.rental_id)}
                              className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-semibold transition-colors flex items-center gap-1"
                              title="Confirm reservation"
                            >
                              <Check className="w-3 h-3" />
                              <span>Confirm</span>
                            </button>
                          )}

                          {/* Confirmed -> Active (Pickup) */}
                          {r.status === 'Confirmed' && (
                            <button
                              onClick={() => handleStartRental(r.rental_id)}
                              className="px-2 py-1 bg-[#C7F36B]/10 hover:bg-[#C7F36B]/20 text-[#C7F36B] border border-[#C7F36B]/30 rounded text-[10px] font-semibold transition-colors flex items-center gap-1"
                              title="Start Rental (Vehicle Pickup)"
                            >
                              <Play className="w-3 h-3" />
                              <span>Dispatch</span>
                            </button>
                          )}

                          {/* Active -> Completed (Return) */}
                          {r.status === 'Active' && (
                            <button
                              onClick={() => {
                                setCompletingRental(r);
                                setReturnNotes('Vehicle inspected. Sanitized and ready for next dispatch.');
                              }}
                              className="px-2 py-1 bg-[#55D6E8]/10 hover:bg-[#55D6E8]/20 text-[#55D6E8] border border-[#55D6E8]/30 rounded text-[10px] font-semibold transition-colors flex items-center gap-1"
                              title="Complete Vehicle Return"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Return</span>
                            </button>
                          )}

                          {/* Cancellation */}
                          {(r.status === 'Confirmed' || r.status === 'Pending Confirmation') && (
                            <button
                              onClick={() => setCancellingRental(r)}
                              className="p-1 text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                              title="Cancel Reservation"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Return Completion Modal */}
      {completingRental && (
        <Modal
          isOpen={true}
          onClose={() => setCompletingRental(null)}
          title={`Process Vehicle Return: Rental #${completingRental.rental_id}`}
        >
          <form onSubmit={handleConfirmReturn} className="space-y-4 text-xs">
            <p className="text-[#93A1B2]">
              Executing return updates the rental record to <code>Completed</code>, logs actual return date, and triggers availability recalculation for vehicle #{completingRental.vehicle_id}.
            </p>

            <div>
              <label className="block text-[#93A1B2] mb-1">Return Inspection Notes *</label>
              <textarea
                rows={3}
                required
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                className="w-full p-2.5 bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] focus:outline-none focus:border-[#C7F36B]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#263241]">
              <button
                type="button"
                onClick={() => setCompletingRental(null)}
                className="px-4 py-2 rounded-lg text-[#93A1B2] hover:text-[#F4F7FA]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#C7F36B] hover:bg-[#b8e55e] text-[#080B10] font-semibold rounded-lg"
              >
                Confirm Return & Release Fleet Unit
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Staff Reassignment Modal */}
      {assigningRental && (
        <Modal
          isOpen={true}
          onClose={() => setAssigningRental(null)}
          title={`Assign Staff to Rental #${assigningRental.rental_id}`}
        >
          <form onSubmit={handleSaveStaffAssignment} className="space-y-4 text-xs">
            <div>
              <label className="block text-[#93A1B2] mb-1">Select Operations Staff Member</label>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(parseInt(e.target.value, 10))}
                className="w-full p-2.5 bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA]"
              >
                {staff.map((s) => (
                  <option key={s.staff_id} value={s.staff_id}>
                    {s.name} ({s.role}) {s.active ? '' : '— Inactive'}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#263241]">
              <button
                type="button"
                onClick={() => setAssigningRental(null)}
                className="px-4 py-2 rounded-lg text-[#93A1B2] hover:text-[#F4F7FA]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#C7F36B] hover:bg-[#b8e55e] text-[#080B10] font-semibold rounded-lg"
              >
                Save Staff Assignment
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Cancel Rental Confirmation */}
      <ConfirmationDialog
        isOpen={cancellingRental !== null}
        onClose={() => setCancellingRental(null)}
        onConfirm={handleConfirmCancel}
        title="Cancel Reservation?"
        message={`Are you sure you want to cancel Rental #${cancellingRental?.rental_id}? The vehicle will be released from scheduled lock.`}
        confirmLabel="Confirm Cancellation"
      />
    </div>
  );
};
