import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Car,
  QrCode,
  DollarSign,
  Printer,
  FileText,
  User,
  Phone,
  Mail,
  ChevronRight,
} from 'lucide-react';
import { Vehicle, Customer, Rental, Payment } from '../../types';
import { formatINR, maskLicense } from '../../utils/formatters';
import { calculateRentalBreakdown } from '../../utils/pricing';
import { dbStore } from '../../services/dbStore';
import { useToast } from '../../components/common/ToastProvider';

interface BookingWorkflowProps {
  initialVehicleId: number;
  vehicles: Vehicle[];
  initialPickupDate?: string;
  initialReturnDate?: string;
  initialLocation?: string;
  onNavigate: (path: string) => void;
}

export const BookingWorkflow: React.FC<BookingWorkflowProps> = ({
  initialVehicleId,
  vehicles,
  initialPickupDate,
  initialReturnDate,
  initialLocation,
  onNavigate,
}) => {
  const { showToast } = useToast();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 4);

  const [step, setStep] = useState<number>(1);
  const [vehicleId, setVehicleId] = useState<number>(initialVehicleId || vehicles[0]?.vehicle_id || 101);
  const [pickupDate, setPickupDate] = useState<string>(initialPickupDate || tomorrow.toISOString().split('T')[0]);
  const [returnDate, setReturnDate] = useState<string>(initialReturnDate || nextWeek.toISOString().split('T')[0]);
  const [pickupLocation, setPickupLocation] = useState<string>(initialLocation || 'Bengaluru Airport Terminal 1 Hub');
  const [includeWaiver, setIncludeWaiver] = useState<boolean>(true);

  // Customer Form State
  const [name, setName] = useState('Aarav Mehta');
  const [email, setEmail] = useState('aarav.mehta@example.com');
  const [phone, setPhone] = useState('+91 98201 44521');
  const [license, setLicense] = useState('DL-04-2019-0048123');
  const [specialRequests, setSpecialRequests] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<Payment['method']>('UPI');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Completed State
  const [confirmedRental, setConfirmedRental] = useState<Rental | null>(null);
  const [confirmedPayment, setConfirmedPayment] = useState<Payment | null>(null);

  const vehicle = vehicles.find((v) => v.vehicle_id === vehicleId) || vehicles[0];

  const breakdown = calculateRentalBreakdown(
    vehicle?.rental_rate || 2000,
    pickupDate,
    returnDate,
    includeWaiver
  );

  const availCheck = dbStore.checkVehicleAvailability(vehicle.vehicle_id, pickupDate, returnDate);

  // Step 2 Validation
  const validateCustomerStep = () => {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = 'Full name is required.';
    if (!email.trim() || !email.includes('@')) errors.email = 'Valid email is required.';
    if (!phone.trim() || phone.length < 10) errors.phone = 'Valid 10-digit phone number is required.';
    if (!license.trim() || license.length < 6) errors.license = 'Valid driving license is required.';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!availCheck.available) {
        showToast(availCheck.conflictReason || 'Vehicle unavailable for selected dates.', 'error');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (validateCustomerStep()) {
        setStep(3);
      }
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleExecuteBookingAndPayment = () => {
    setIsProcessing(true);

    setTimeout(() => {
      try {
        const result = dbStore.createReservationTransactional({
          customerData: {
            name,
            email,
            phone,
            driving_license: license,
            address: 'Verified Customer Booking Address',
          },
          vehicle_id: vehicle.vehicle_id,
          pickup_date: pickupDate,
          return_date: returnDate,
          pickup_location: pickupLocation,
          total_amount: breakdown.totalAmount,
          special_requests: specialRequests,
          paymentMethod,
          simulatePaymentFailure: simulateFailure,
        });

        setConfirmedRental(result.rental);
        setConfirmedPayment(result.payment);

        if (result.payment.status === 'Failed') {
          showToast('Payment simulation failed as configured. Retry available.', 'error');
        } else {
          showToast(`Booking #${result.rental.rental_id} successfully confirmed!`, 'success');
        }

        setStep(5);
      } catch (err: any) {
        showToast(err.message || 'Transaction failed. Changes rolled back.', 'error');
      } finally {
        setIsProcessing(false);
      }
    }, 600);
  };

  const handleRetryFailedPayment = () => {
    if (!confirmedPayment) return;
    try {
      const updatedPayment = dbStore.retryPayment(confirmedPayment.payment_id);
      setConfirmedPayment(updatedPayment);
      showToast('Payment successfully retried and captured!', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#080B10] text-[#F4F7FA] py-8 px-6 max-w-5xl mx-auto">
      {/* Workflow Progress Bar */}
      <div className="mb-8">
        <button
          onClick={() => (step > 1 && step < 5 ? setStep(step - 1) : onNavigate('/vehicles'))}
          className="inline-flex items-center gap-2 text-xs font-medium text-[#93A1B2] hover:text-[#C7F36B] transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{step > 1 && step < 5 ? 'Back to previous step' : 'Back to fleet'}</span>
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#F4F7FA]">Vehicle Reservation</h1>
            <p className="text-xs text-[#93A1B2]">Transactional booking lifecycle with live database locking</p>
          </div>
          <span className="text-xs font-mono font-semibold text-[#C7F36B] px-2.5 py-1 rounded bg-[#18212C] border border-[#263241]">
            Step {step} of 5
          </span>
        </div>

        {/* Step indicators */}
        <div className="grid grid-cols-5 gap-2 mt-4">
          {['Vehicle & Dates', 'Customer Details', 'Pricing Summary', 'Payment', 'Confirmation'].map(
            (label, idx) => {
              const sNum = idx + 1;
              const isDone = step > sNum;
              const isCurr = step === sNum;

              return (
                <div key={label} className="space-y-1">
                  <div
                    className={`h-1.5 rounded-full transition-colors ${
                      isDone
                        ? 'bg-emerald-400'
                        : isCurr
                        ? 'bg-[#C7F36B]'
                        : 'bg-[#18212C] border border-[#263241]'
                    }`}
                  />
                  <p
                    className={`text-[10px] truncate ${
                      isCurr ? 'text-[#C7F36B] font-semibold' : 'text-[#93A1B2]'
                    }`}
                  >
                    {label}
                  </p>
                </div>
              );
            }
          )}
        </div>
      </div>

      {/* STEP 1: VEHICLE & DATES */}
      {step === 1 && (
        <div className="bg-[#121821] border border-[#263241] rounded-xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#263241]">
            <div className="flex items-center gap-4">
              <img
                src={vehicle.image_url}
                alt={vehicle.model}
                referrerPolicy="no-referrer"
                className="w-24 h-16 object-cover rounded-lg bg-[#0D1118]"
              />
              <div>
                <span className="text-[10px] font-mono uppercase text-[#93A1B2]">{vehicle.brand}</span>
                <h3 className="text-base font-bold text-[#F4F7FA]">{vehicle.model}</h3>
                <p className="text-xs text-[#93A1B2]">{vehicle.vehicle_type} · {vehicle.fuel_type} · {vehicle.transmission}</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-[#93A1B2]">Rental Rate</span>
              <p className="text-lg font-mono font-bold text-[#C7F36B]">{formatINR(vehicle.rental_rate)}/day</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#93A1B2] mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#55D6E8]" />
                Pickup Date
              </label>
              <input
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className="w-full p-2.5 text-xs bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] font-mono focus:outline-none focus:border-[#C7F36B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#93A1B2] mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#55D6E8]" />
                Return Date
              </label>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full p-2.5 text-xs bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] font-mono focus:outline-none focus:border-[#C7F36B]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#93A1B2] mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#C7F36B]" />
              Pickup & Return Hub
            </label>
            <select
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              className="w-full p-2.5 text-xs bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] focus:outline-none focus:border-[#C7F36B]"
            >
              <option value="Bengaluru Airport Terminal 1 Hub">Bengaluru Airport Hub (BLR)</option>
              <option value="Bengaluru Indiranagar Station">Bengaluru Indiranagar Station</option>
              <option value="Mumbai BKC Operations Hub">Mumbai BKC Hub</option>
              <option value="Delhi Aerocity Premium Lounge">Delhi Aerocity Lounge</option>
              <option value="Chennai Central Hub">Chennai Central Hub</option>
              <option value="Ahmedabad SG Highway Station">Ahmedabad SG Highway Station</option>
            </select>
          </div>

          {/* Availability Feedback */}
          {availCheck.available ? (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Available for {breakdown.days} days ({pickupDate} to {returnDate}).</span>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{availCheck.conflictReason}</span>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              onClick={handleNextStep}
              disabled={!availCheck.available}
              className={`px-6 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
                availCheck.available
                  ? 'bg-[#C7F36B] hover:bg-[#b8e55e] text-[#080B10]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>Continue to Customer Details</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: CUSTOMER DETAILS */}
      {step === 2 && (
        <div className="bg-[#121821] border border-[#263241] rounded-xl p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-[#F4F7FA]">Renter Identification & Credentials</h3>
            <p className="text-xs text-[#93A1B2]">
              Customer information is stored in the <code>CUSTOMER</code> relational table with unique email & driving license constraints.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#93A1B2] mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#C7F36B]" />
                Full Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aarav Mehta"
                className="w-full p-2.5 text-xs bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] focus:outline-none focus:border-[#C7F36B]"
              />
              {formErrors.name && <p className="text-[11px] text-rose-400 mt-1">{formErrors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#93A1B2] mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#55D6E8]" />
                Email Address (Unique Key) *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. aarav@example.com"
                className="w-full p-2.5 text-xs bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] focus:outline-none focus:border-[#C7F36B]"
              />
              {formErrors.email && <p className="text-[11px] text-rose-400 mt-1">{formErrors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#93A1B2] mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                Phone Number *
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98201 XXXXX"
                className="w-full p-2.5 text-xs bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] font-mono focus:outline-none focus:border-[#C7F36B]"
              />
              {formErrors.phone && <p className="text-[11px] text-rose-400 mt-1">{formErrors.phone}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#93A1B2] mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                Driving License Identifier (Unique Key) *
              </label>
              <input
                type="text"
                value={license}
                onChange={(e) => setLicense(e.target.value)}
                placeholder="DL-XX-YYYY-ZZZZZZZ"
                className="w-full p-2.5 text-xs bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] font-mono focus:outline-none focus:border-[#C7F36B]"
              />
              {formErrors.license && <p className="text-[11px] text-rose-400 mt-1">{formErrors.license}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#93A1B2] mb-1">
              Special Requests (Optional)
            </label>
            <textarea
              rows={2}
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              placeholder="e.g. Booster baby seat, preloaded Fastag, luggage assistance..."
              className="w-full p-2.5 text-xs bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] focus:outline-none focus:border-[#C7F36B]"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#263241]">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 text-xs font-medium text-[#93A1B2] hover:text-[#F4F7FA]"
            >
              Back
            </button>
            <button
              onClick={handleNextStep}
              className="px-6 py-2.5 rounded-lg bg-[#C7F36B] hover:bg-[#b8e55e] text-[#080B10] text-xs font-semibold flex items-center gap-2"
            >
              <span>Review Price Summary</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: RENTAL SUMMARY & ADD-ONS */}
      {step === 3 && (
        <div className="bg-[#121821] border border-[#263241] rounded-xl p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-[#F4F7FA]">Transparent Rental Breakdown</h3>
            <p className="text-xs text-[#93A1B2]">
              Verified calculations using standard GST tax rate ({breakdown.taxRatePercent}%) and billable duration.
            </p>
          </div>

          {/* Add-on Selector */}
          <div className="p-4 rounded-xl bg-[#0D1118] border border-[#263241] flex items-start gap-4">
            <input
              type="checkbox"
              id="waiver-step3"
              checked={includeWaiver}
              onChange={(e) => setIncludeWaiver(e.target.checked)}
              className="mt-1 rounded border-[#263241] accent-[#C7F36B]"
            />
            <label htmlFor="waiver-step3" className="cursor-pointer text-xs flex-1">
              <div className="flex items-center justify-between font-bold text-[#F4F7FA]">
                <span>Zero-Liability Comprehensive Damage Protection</span>
                <span className="font-mono text-[#C7F36B]">₹499/day</span>
              </div>
              <p className="text-[11px] text-[#93A1B2] mt-1">
                Waives all customer deductibles for bodywork, tire punctures, glass, and third-party liabilities.
              </p>
            </label>
          </div>

          {/* Table Breakdown */}
          <div className="rounded-xl border border-[#263241] bg-[#0D1118] divide-y divide-[#263241] text-xs">
            <div className="p-3.5 flex justify-between">
              <span className="text-[#93A1B2]">Vehicle</span>
              <span className="font-semibold text-[#F4F7FA]">{vehicle.brand} {vehicle.model} ({vehicle.model_year})</span>
            </div>
            <div className="p-3.5 flex justify-between">
              <span className="text-[#93A1B2]">Rental Window</span>
              <span className="font-mono text-[#F4F7FA]">{pickupDate} → {returnDate} ({breakdown.days} billable days)</span>
            </div>
            <div className="p-3.5 flex justify-between">
              <span className="text-[#93A1B2]">Base Rate Calculation</span>
              <span className="font-mono text-[#F4F7FA]">{breakdown.days} days × {formatINR(vehicle.rental_rate)} = {formatINR(breakdown.baseAmount)}</span>
            </div>
            {includeWaiver && (
              <div className="p-3.5 flex justify-between">
                <span className="text-[#93A1B2]">Damage Protection Add-on</span>
                <span className="font-mono text-[#F4F7FA]">{breakdown.days} days × ₹499 = {formatINR(breakdown.waiverAmount)}</span>
              </div>
            )}
            <div className="p-3.5 flex justify-between">
              <span className="text-[#93A1B2]">GST Tax Estimate ({breakdown.taxRatePercent}%)</span>
              <span className="font-mono text-[#F4F7FA]">{formatINR(breakdown.taxAmount)}</span>
            </div>
            <div className="p-4 flex justify-between items-baseline bg-[#18212C] font-bold text-sm">
              <span className="text-[#F4F7FA]">Total Payable Amount</span>
              <span className="text-xl font-mono text-[#C7F36B]">{formatINR(breakdown.totalAmount)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#263241]">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 text-xs font-medium text-[#93A1B2] hover:text-[#F4F7FA]"
            >
              Back
            </button>
            <button
              onClick={handleNextStep}
              className="px-6 py-2.5 rounded-lg bg-[#C7F36B] hover:bg-[#b8e55e] text-[#080B10] text-xs font-semibold flex items-center gap-2"
            >
              <span>Proceed to Simulated Checkout</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: PAYMENT SIMULATION */}
      {step === 4 && (
        <div className="bg-[#121821] border border-[#263241] rounded-xl p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-[#F4F7FA]">Demo Payment Gateway</h3>
            <p className="text-xs text-[#93A1B2]">
              Simulate electronic or cash transactions. Academic project: no actual financial charges are incurred.
            </p>
          </div>

          {/* Payment Method Selector */}
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { id: 'UPI', label: 'Instant UPI (VPA)', desc: 'GPay, PhonePe, Paytm simulation', icon: QrCode },
              { id: 'Card', label: 'Credit / Debit Card', desc: 'Simulated card authorization', icon: CreditCard },
              { id: 'Cash', label: 'Pay at Hub Pickup', desc: 'Creates pending payment ledger item', icon: DollarSign },
            ].map((m) => {
              const Icon = m.icon;
              const isSelected = paymentMethod === m.id;

              return (
                <div
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id as any)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#18212C] border-[#C7F36B] shadow-md shadow-[#C7F36B]/5'
                      : 'bg-[#0D1118] border-[#263241] hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-[#C7F36B]' : 'text-[#93A1B2]'}`} />
                    {isSelected && <span className="w-2 h-2 rounded-full bg-[#C7F36B]" />}
                  </div>
                  <h4 className="text-xs font-bold text-[#F4F7FA]">{m.label}</h4>
                  <p className="text-[11px] text-[#93A1B2] mt-0.5">{m.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Educational Toggle: Simulate Failure Case */}
          <div className="p-3.5 rounded-lg bg-[#0D1118] border border-amber-500/30">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={simulateFailure}
                onChange={(e) => setSimulateFailure(e.target.checked)}
                className="mt-0.5 rounded border-[#263241] accent-amber-400"
              />
              <div className="text-xs">
                <span className="font-semibold text-amber-300">
                  Simulate Payment Gateway Failure (DBMS Rollback & Retry Testing)
                </span>
                <p className="text-[11px] text-[#93A1B2] mt-0.5">
                  When enabled, the transaction is marked as 'Failed' in the <code>PAYMENT</code> table, permitting evaluators to test the payment retry mechanism.
                </p>
              </div>
            </label>
          </div>

          <div className="p-4 rounded-lg bg-[#0D1118] border border-[#263241] flex items-center justify-between text-xs">
            <div>
              <span className="text-[#93A1B2]">Authorized Customer</span>
              <p className="font-semibold text-[#F4F7FA]">{name} ({email})</p>
            </div>
            <div className="text-right">
              <span className="text-[#93A1B2]">Amount Due</span>
              <p className="text-lg font-mono font-bold text-[#C7F36B]">{formatINR(breakdown.totalAmount)}</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#263241]">
            <button
              onClick={() => setStep(3)}
              className="px-4 py-2 text-xs font-medium text-[#93A1B2] hover:text-[#F4F7FA]"
            >
              Back
            </button>
            <button
              onClick={handleExecuteBookingAndPayment}
              disabled={isProcessing}
              className="px-6 py-2.5 rounded-lg bg-[#C7F36B] hover:bg-[#b8e55e] text-[#080B10] text-xs font-semibold flex items-center gap-2"
            >
              {isProcessing ? 'Executing Transaction...' : `Confirm & Authorize ${formatINR(breakdown.totalAmount)}`}
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: SUCCESS / CONFIRMATION RECEIPT */}
      {step === 5 && confirmedRental && confirmedPayment && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-[#121821] border border-[#263241] shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#263241]">
              <div className="flex items-center gap-3">
                {confirmedPayment.status === 'Completed' || confirmedPayment.status === 'Pending' ? (
                  <div className="w-12 h-12 rounded-xl bg-[#C7F36B]/10 border border-[#C7F36B]/30 flex items-center justify-center text-[#C7F36B]">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                )}

                <div>
                  <span className="text-[10px] font-mono uppercase text-[#C7F36B]">
                    Booking Reference #{confirmedRental.rental_id}
                  </span>
                  <h2 className="text-xl font-bold text-[#F4F7FA]">
                    {confirmedPayment.status === 'Failed'
                      ? 'Payment Authorization Failed'
                      : 'Reservation Confirmed & Logged'}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 text-xs font-medium text-[#F4F7FA] bg-[#18212C] hover:bg-[#263241] border border-[#263241] rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5 text-[#93A1B2]" />
                  <span>Print Receipt</span>
                </button>

                <button
                  onClick={() => onNavigate('/my-bookings')}
                  className="px-4 py-1.5 text-xs font-semibold bg-[#C7F36B] hover:bg-[#b8e55e] text-[#080B10] rounded-lg transition-colors"
                >
                  View in My Bookings
                </button>
              </div>
            </div>

            {/* Failure banner if simulated fail */}
            {confirmedPayment.status === 'Failed' && (
              <div className="mt-4 p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center justify-between">
                <div>
                  <p className="font-semibold">Simulated Gateway Failure</p>
                  <p className="text-[11px] text-rose-400/90 mt-0.5">
                    Your rental status is logged, but payment could not be captured. You can retry now.
                  </p>
                </div>
                <button
                  onClick={handleRetryFailedPayment}
                  className="px-3 py-1.5 text-xs font-semibold bg-rose-500 hover:bg-rose-400 text-white rounded-lg transition-colors shrink-0"
                >
                  Retry Payment
                </button>
              </div>
            )}

            {/* Receipt Summary Grid */}
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-[11px] text-[#93A1B2]">Vehicle</span>
                  <p className="text-sm font-bold text-[#F4F7FA]">{vehicle.brand} {vehicle.model}</p>
                  <p className="text-[#93A1B2] font-mono text-[11px]">{vehicle.vehicle_type} · {vehicle.transmission}</p>
                </div>

                <div>
                  <span className="text-[11px] text-[#93A1B2]">Renter</span>
                  <p className="font-semibold text-[#F4F7FA]">{name}</p>
                  <p className="text-[#93A1B2]">{email} · {phone}</p>
                  <p className="text-[#93A1B2] font-mono text-[11px]">License: {maskLicense(license)}</p>
                </div>

                <div>
                  <span className="text-[11px] text-[#93A1B2]">Pickup Hub</span>
                  <p className="font-semibold text-[#F4F7FA]">{pickupLocation}</p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-[11px] text-[#93A1B2]">Rental Window</span>
                  <p className="font-mono font-semibold text-[#F4F7FA]">{pickupDate} → {returnDate}</p>
                  <p className="text-[#93A1B2]">{breakdown.days} Billable Rental Days</p>
                </div>

                <div>
                  <span className="text-[11px] text-[#93A1B2]">Transaction Reference</span>
                  <p className="font-mono text-[#55D6E8]">{confirmedPayment.transaction_reference}</p>
                  <p className="text-[#93A1B2]">Method: {confirmedPayment.method} · Status: <span className="font-semibold text-[#C7F36B]">{confirmedPayment.status}</span></p>
                </div>

                <div className="p-3 rounded-lg bg-[#0D1118] border border-[#263241]">
                  <div className="flex justify-between items-baseline font-bold">
                    <span className="text-xs text-[#F4F7FA]">Total Amount Paid</span>
                    <span className="text-base font-mono text-[#C7F36B]">{formatINR(confirmedPayment.amount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
