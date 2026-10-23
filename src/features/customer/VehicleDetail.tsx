import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Fuel,
  Gauge,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Car,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Vehicle } from '../../types';
import { formatINR, getVehicleStatusStyle } from '../../utils/formatters';
import { calculateRentalBreakdown } from '../../utils/pricing';
import { dbStore } from '../../services/dbStore';

interface VehicleDetailProps {
  vehicleId: number;
  vehicles: Vehicle[];
  onBack: () => void;
  onSelectVehicle: (id: number) => void;
  onStartBooking: (vehicleId: number, pickupDate: string, returnDate: string) => void;
}

export const VehicleDetail: React.FC<VehicleDetailProps> = ({
  vehicleId,
  vehicles,
  onBack,
  onSelectVehicle,
  onStartBooking,
}) => {
  const vehicle = vehicles.find((v) => v.vehicle_id === vehicleId) || vehicles[0];

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 4);

  const [pickupDate, setPickupDate] = useState<string>(tomorrow.toISOString().split('T')[0]);
  const [returnDate, setReturnDate] = useState<string>(nextWeek.toISOString().split('T')[0]);
  const [includeWaiver, setIncludeWaiver] = useState<boolean>(true);

  const availCheck = dbStore.checkVehicleAvailability(vehicle.vehicle_id, pickupDate, returnDate);

  const priceBreakdown = calculateRentalBreakdown(
    vehicle.rental_rate,
    pickupDate,
    returnDate,
    includeWaiver
  );

  const relatedVehicles = vehicles
    .filter((v) => v.vehicle_id !== vehicle.vehicle_id && v.vehicle_type === vehicle.vehicle_type)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-[#080B10] text-[#F4F7FA] py-8 px-6 max-w-7xl mx-auto">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-medium text-[#93A1B2] hover:text-[#C7F36B] transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to fleet discovery</span>
      </button>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Visuals & Specs */}
        <div className="lg:col-span-7 space-y-6">
          <div className="relative rounded-2xl overflow-hidden border border-[#263241] bg-[#121821] shadow-2xl">
            <img
              src={vehicle.image_url}
              alt={`${vehicle.brand} ${vehicle.model}`}
              referrerPolicy="no-referrer"
              className="w-full h-80 sm:h-96 object-cover"
            />
            <div className="absolute top-4 left-4">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#0D1118]/85 text-[#F4F7FA] border border-[#263241] backdrop-blur-md">
                {vehicle.vehicle_type}
              </span>
            </div>
            <div className="absolute top-4 right-4">
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-md border backdrop-blur-md ${getVehicleStatusStyle(
                  vehicle.status
                )}`}
              >
                {vehicle.status}
              </span>
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="bg-[#121821] border border-[#263241] rounded-xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider text-[#93A1B2] font-semibold">{vehicle.brand}</span>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#F4F7FA]">{vehicle.model}</h1>
              </div>
              <div className="text-right">
                <span className="text-xs text-[#93A1B2]">Year Model</span>
                <p className="text-base font-mono font-bold text-[#C7F36B]">{vehicle.model_year}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#263241]/70">
              <div className="p-3 rounded-lg bg-[#0D1118] border border-[#263241]">
                <div className="flex items-center gap-1.5 text-xs text-[#93A1B2] mb-1">
                  <Fuel className="w-3.5 h-3.5 text-[#55D6E8]" />
                  <span>Fuel Type</span>
                </div>
                <p className="text-sm font-semibold text-[#F4F7FA]">{vehicle.fuel_type}</p>
              </div>

              <div className="p-3 rounded-lg bg-[#0D1118] border border-[#263241]">
                <div className="flex items-center gap-1.5 text-xs text-[#93A1B2] mb-1">
                  <Gauge className="w-3.5 h-3.5 text-[#C7F36B]" />
                  <span>Transmission</span>
                </div>
                <p className="text-sm font-semibold text-[#F4F7FA]">{vehicle.transmission}</p>
              </div>

              <div className="p-3 rounded-lg bg-[#0D1118] border border-[#263241]">
                <div className="flex items-center gap-1.5 text-xs text-[#93A1B2] mb-1">
                  <Users className="w-3.5 h-3.5 text-[#93A1B2]" />
                  <span>Seating</span>
                </div>
                <p className="text-sm font-semibold text-[#F4F7FA]">{vehicle.seating_capacity} Adults</p>
              </div>

              <div className="p-3 rounded-lg bg-[#0D1118] border border-[#263241]">
                <div className="flex items-center gap-1.5 text-xs text-[#93A1B2] mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Fleet Standard</span>
                </div>
                <p className="text-sm font-semibold text-[#F4F7FA]">Sanitized 42-Pt</p>
              </div>
            </div>

            {/* Inclusions */}
            <div className="mt-6 pt-6 border-t border-[#263241]/70 space-y-3">
              <h3 className="text-xs font-bold text-[#F4F7FA] uppercase tracking-wider">What's Included in Every Reservation</h3>
              <div className="grid sm:grid-cols-2 gap-2 text-xs text-[#93A1B2]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#C7F36B]" />
                  <span>Unlimited standard city mileage</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#C7F36B]" />
                  <span>24/7 National roadside assistance</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#C7F36B]" />
                  <span>Fastag automated toll pre-installed</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#C7F36B]" />
                  <span>Full clean exterior & interior sanitization</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Date Selector & Booking Estimator */}
        <div className="lg:col-span-5 bg-[#121821] border border-[#263241] rounded-xl p-6 shadow-xl sticky top-24 space-y-6">
          <div className="flex items-baseline justify-between pb-4 border-b border-[#263241]">
            <div>
              <span className="text-xs text-[#93A1B2]">Daily Rental Rate</span>
              <p className="text-2xl font-mono font-bold text-[#C7F36B]">
                {formatINR(vehicle.rental_rate)}
                <span className="text-xs font-normal text-[#93A1B2]">/day</span>
              </p>
            </div>
            <span className="text-xs text-[#93A1B2] font-mono">Tier: {vehicle.vehicle_type}</span>
          </div>

          {/* Date Selector */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#F4F7FA] uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#55D6E8]" />
              <span>Select Reservation Dates</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-[#93A1B2] mb-1">Pickup Date</label>
                <input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full p-2 text-xs bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] font-mono focus:outline-none focus:border-[#C7F36B]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#93A1B2] mb-1">Return Date</label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full p-2 text-xs bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] font-mono focus:outline-none focus:border-[#C7F36B]"
                />
              </div>
            </div>

            {/* Live Availability Status */}
            <div className="pt-2">
              {availCheck.available ? (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Vehicle is available for this window ({priceBreakdown.days} billable days).</span>
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{availCheck.conflictReason || 'Vehicle unavailable for requested period.'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Optional Add-on */}
          <div className="p-3 rounded-lg bg-[#0D1118] border border-[#263241]">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeWaiver}
                onChange={(e) => setIncludeWaiver(e.target.checked)}
                className="mt-0.5 rounded border-[#263241] accent-[#C7F36B]"
              />
              <div className="text-xs">
                <div className="flex items-center justify-between font-semibold text-[#F4F7FA]">
                  <span>Velocity Shield (Zero-Deductible Waiver)</span>
                  <span className="font-mono text-[#C7F36B]">₹499/day</span>
                </div>
                <p className="text-[11px] text-[#93A1B2] mt-0.5">
                  100% collision damage waiver, tyre, and windscreen cover with ₹0 customer liability.
                </p>
              </div>
            </label>
          </div>

          {/* Pricing Calculation Breakdown */}
          <div className="space-y-2 pt-2 border-t border-[#263241]/70 text-xs">
            <div className="flex justify-between text-[#93A1B2]">
              <span>Base Rental ({priceBreakdown.days} days × {formatINR(vehicle.rental_rate)})</span>
              <span className="font-mono text-[#F4F7FA]">{formatINR(priceBreakdown.baseAmount)}</span>
            </div>

            {includeWaiver && (
              <div className="flex justify-between text-[#93A1B2]">
                <span>Velocity Shield Protection ({priceBreakdown.days} days)</span>
                <span className="font-mono text-[#F4F7FA]">{formatINR(priceBreakdown.waiverAmount)}</span>
              </div>
            )}

            <div className="flex justify-between text-[#93A1B2]">
              <span>GST ({priceBreakdown.taxRatePercent}%)</span>
              <span className="font-mono text-[#F4F7FA]">{formatINR(priceBreakdown.taxAmount)}</span>
            </div>

            <div className="flex justify-between items-baseline pt-3 border-t border-[#263241] text-sm font-bold text-[#F4F7FA]">
              <span>Estimated Total Amount</span>
              <span className="text-xl font-mono text-[#C7F36B]">{formatINR(priceBreakdown.totalAmount)}</span>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => onStartBooking(vehicle.vehicle_id, pickupDate, returnDate)}
            disabled={!availCheck.available}
            className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all shadow-lg ${
              availCheck.available
                ? 'bg-[#C7F36B] hover:bg-[#b8e55e] text-[#080B10] shadow-[#C7F36B]/15 hover:shadow-[#C7F36B]/25'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
            }`}
          >
            {availCheck.available ? 'Proceed to Reservation' : 'Unavailable for Selected Dates'}
          </button>
        </div>
      </div>

      {/* Related Vehicles */}
      {relatedVehicles.length > 0 && (
        <div className="mt-16 pt-12 border-t border-[#263241]/70">
          <h2 className="text-xl font-bold text-[#F4F7FA] mb-6">Similar in {vehicle.vehicle_type} Fleet</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedVehicles.map((rel) => (
              <div
                key={rel.vehicle_id}
                onClick={() => onSelectVehicle(rel.vehicle_id)}
                className="bg-[#121821] border border-[#263241] rounded-xl p-4 hover:border-slate-500 cursor-pointer transition-colors flex items-center gap-4"
              >
                <img
                  src={rel.image_url}
                  alt={rel.model}
                  referrerPolicy="no-referrer"
                  className="w-20 h-16 object-cover rounded-lg bg-[#0D1118]"
                />
                <div>
                  <p className="text-xs text-[#93A1B2]">{rel.brand}</p>
                  <p className="text-sm font-bold text-[#F4F7FA]">{rel.model}</p>
                  <p className="text-xs font-mono font-bold text-[#C7F36B] mt-1">{formatINR(rel.rental_rate)}/day</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
