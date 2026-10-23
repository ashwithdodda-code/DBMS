import React, { useState } from 'react';
import {
  Calendar,
  Car,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Printer,
  XCircle,
  ArrowRight,
  MapPin,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { Rental, Vehicle, Payment, Customer } from '../../types';
import { formatINR, getRentalStatusStyle, getPaymentStatusStyle, maskLicense } from '../../utils/formatters';
import { dbStore } from '../../services/dbStore';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../components/common/ToastProvider';

interface MyBookingsProps {
  rentals: Rental[];
  vehicles: Vehicle[];
  payments: Payment[];
  customers: Customer[];
  activeCustomerId: number;
  onNavigate: (path: string) => void;
}

export const MyBookings: React.FC<MyBookingsProps> = ({
  rentals,
  vehicles,
  payments,
  customers,
  activeCustomerId,
  onNavigate,
}) => {
  const { showToast } = useToast();
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(activeCustomerId || 1001);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [cancellingRentalId, setCancellingRentalId] = useState<number | null>(null);
  const [receiptRental, setReceiptRental] = useState<Rental | null>(null);

  const currentCustomer = customers.find((c) => c.customer_id === selectedCustomerId) || customers[0];

  const customerRentals = rentals
    .filter((r) => r.customer_id === selectedCustomerId)
    .filter((r) => statusFilter === 'All' || r.status === statusFilter)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const handleCancelBooking = () => {
    if (!cancellingRentalId) return;
    try {
      dbStore.updateRentalStatus(cancellingRentalId, 'Cancelled');
      showToast(`Booking #${cancellingRentalId} has been cancelled.`, 'info');
      setCancellingRentalId(null);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleRetryPayment = (paymentId: number) => {
    try {
      dbStore.retryPayment(paymentId);
      showToast('Payment retried and captured successfully.', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#080B10] text-[#F4F7FA] py-8 px-6 max-w-7xl mx-auto">
      {/* Header & Demo Customer Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#263241]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F4F7FA]">My Rental Bookings</h1>
          <p className="text-xs sm:text-sm text-[#93A1B2] mt-1">
            Track your reservations, view receipts, and monitor vehicle return statuses.
          </p>
        </div>

        {/* Demo Customer Profile Selector */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-[#93A1B2]">Demo Customer Persona</span>
            <select
              value={selectedCustomerId}
              onChange={(e) => {
                const newId = parseInt(e.target.value, 10);
                setSelectedCustomerId(newId);
                dbStore.setActiveCustomerId(newId);
              }}
              className="block text-xs bg-[#121821] text-[#F4F7FA] border border-[#263241] rounded-lg p-2 font-medium focus:outline-none focus:border-[#C7F36B]"
            >
              {customers.map((c) => (
                <option key={c.customer_id} value={c.customer_id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => onNavigate('/vehicles')}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#C7F36B] hover:bg-[#b8e55e] text-[#080B10] transition-colors shrink-0"
          >
            New Booking
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {['All', 'Active', 'Confirmed', 'Completed', 'Cancelled'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              statusFilter === st
                ? 'bg-[#18212C] text-[#C7F36B] border border-[#C7F36B]/30'
                : 'bg-[#121821] text-[#93A1B2] hover:text-[#F4F7FA] border border-[#263241]'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {customerRentals.length === 0 ? (
        <div className="p-12 text-center bg-[#121821] border border-[#263241] rounded-xl">
          <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#F4F7FA]">No {statusFilter !== 'All' ? statusFilter.toLowerCase() : ''} bookings found</h3>
          <p className="text-xs text-[#93A1B2] mt-1">
            Explore our verified fleet and reserve your next car with instant confirmation.
          </p>
          <button
            onClick={() => onNavigate('/vehicles')}
            className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-[#C7F36B] text-[#080B10]"
          >
            Explore Fleet
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {customerRentals.map((rental) => {
            const vehicle = vehicles.find((v) => v.vehicle_id === rental.vehicle_id);
            const rentalPayments = payments.filter((p) => p.rental_id === rental.rental_id);
            const primaryPayment = rentalPayments[rentalPayments.length - 1];

            return (
              <div
                key={rental.rental_id}
                className="bg-[#121821] border border-[#263241] rounded-xl p-5 hover:border-slate-500 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="flex items-start sm:items-center gap-4">
                  {vehicle && (
                    <img
                      src={vehicle.image_url}
                      alt={vehicle.model}
                      referrerPolicy="no-referrer"
                      className="w-24 h-16 sm:w-28 sm:h-20 object-cover rounded-lg bg-[#0D1118] shrink-0"
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-mono text-[#55D6E8]">
                        Booking #{rental.rental_id}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getRentalStatusStyle(rental.status)}`}>
                        {rental.status}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#F4F7FA]">
                      {vehicle ? `${vehicle.brand} ${vehicle.model}` : `Vehicle #${rental.vehicle_id}`}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#93A1B2] mt-1.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#55D6E8]" />
                        <span className="font-mono">{rental.rental_date} → {rental.return_date}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#C7F36B]" />
                        <span>{rental.pickup_location}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-6 border-t md:border-t-0 pt-4 md:pt-0 border-[#263241]">
                  <div className="text-left md:text-right">
                    <span className="text-[11px] text-[#93A1B2]">Total Amount</span>
                    <p className="text-lg font-mono font-bold text-[#F4F7FA]">
                      {formatINR(rental.total_amount)}
                    </p>
                    {primaryPayment && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${getPaymentStatusStyle(primaryPayment.status)}`}>
                        Payment: {primaryPayment.status} ({primaryPayment.method})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setReceiptRental(rental)}
                      className="px-3 py-1.5 text-xs font-medium text-[#F4F7FA] bg-[#18212C] hover:bg-[#263241] border border-[#263241] rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5 text-[#93A1B2]" />
                      <span>Receipt</span>
                    </button>

                    {primaryPayment?.status === 'Failed' && (
                      <button
                        onClick={() => handleRetryPayment(primaryPayment.payment_id)}
                        className="px-3 py-1.5 text-xs font-semibold bg-rose-500 hover:bg-rose-400 text-white rounded-lg transition-colors"
                      >
                        Retry Payment
                      </button>
                    )}

                    {(rental.status === 'Confirmed' || rental.status === 'Pending Confirmation') && (
                      <button
                        onClick={() => setCancellingRentalId(rental.rental_id)}
                        className="px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={cancellingRentalId !== null}
        onClose={() => setCancellingRentalId(null)}
        onConfirm={handleCancelBooking}
        title="Cancel Reservation?"
        message={`Are you sure you want to cancel Rental #${cancellingRentalId}? The reserved vehicle will be released back into available inventory immediately.`}
        confirmLabel="Yes, Cancel Booking"
        isDestructive={true}
      />

      {/* Printable Receipt Modal */}
      {receiptRental && (
        <Modal
          isOpen={true}
          onClose={() => setReceiptRental(null)}
          title={`Booking Receipt #${receiptRental.rental_id}`}
        >
          {(() => {
            const v = vehicles.find((item) => item.vehicle_id === receiptRental.vehicle_id);
            const c = customers.find((item) => item.customer_id === receiptRental.customer_id);
            const p = payments.find((item) => item.rental_id === receiptRental.rental_id);

            return (
              <div className="space-y-6 text-xs text-[#F4F7FA]">
                <div className="flex justify-between items-start pb-4 border-b border-[#263241]">
                  <div>
                    <span className="font-bold text-sm text-[#C7F36B]">VELOCITY OS</span>
                    <p className="text-[#93A1B2]">Intelligent Fleet Rental Receipt</p>
                  </div>
                  <div className="text-right font-mono">
                    <p>Booking ID: #{receiptRental.rental_id}</p>
                    <p className="text-[#93A1B2]">{receiptRental.created_at.slice(0, 10)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[#93A1B2] uppercase text-[10px]">Customer Details</span>
                    <p className="font-bold text-sm">{c?.name}</p>
                    <p className="text-[#93A1B2]">{c?.email}</p>
                    <p className="text-[#93A1B2]">{c?.phone}</p>
                    <p className="font-mono text-[#93A1B2] mt-1">License: {maskLicense(c?.driving_license || '')}</p>
                  </div>
                  <div>
                    <span className="text-[#93A1B2] uppercase text-[10px]">Vehicle Assignment</span>
                    <p className="font-bold text-sm">{v?.brand} {v?.model}</p>
                    <p className="text-[#93A1B2]">{v?.vehicle_type} · {v?.transmission}</p>
                    <p className="text-[#93A1B2] mt-1">Hub: {receiptRental.pickup_location}</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#0D1118] border border-[#263241] space-y-2 font-mono">
                  <div className="flex justify-between">
                    <span>Pickup Date</span>
                    <span>{receiptRental.rental_date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Return Date</span>
                    <span>{receiptRental.return_date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Method</span>
                    <span>{p?.method || 'UPI'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Status</span>
                    <span className="text-[#C7F36B]">{p?.status || 'Completed'}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[#263241] font-bold text-sm">
                    <span>Total Amount Charged</span>
                    <span className="text-[#C7F36B]">{formatINR(receiptRental.total_amount)}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-[#C7F36B] text-[#080B10] font-semibold rounded-lg flex items-center gap-1.5"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Receipt</span>
                  </button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}
    </div>
  );
};
