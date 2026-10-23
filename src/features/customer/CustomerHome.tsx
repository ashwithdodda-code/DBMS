import React, { useState } from 'react';
import {
  Search,
  Calendar,
  MapPin,
  Car,
  Fuel,
  Users,
  Gauge,
  ArrowRight,
  ShieldCheck,
  Zap,
  CreditCard,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Vehicle, VehicleCategory } from '../../types';
import { formatINR, getVehicleStatusStyle } from '../../utils/formatters';
import { HERO_IMAGE } from '../../data/seedData';

interface CustomerHomeProps {
  vehicles: Vehicle[];
  onSelectVehicle: (vehicleId: number) => void;
  onStartBooking: (vehicleId: number, pickupDate?: string, returnDate?: string, location?: string) => void;
  onNavigate: (path: string) => void;
}

export const CustomerHome: React.FC<CustomerHomeProps> = ({
  vehicles,
  onSelectVehicle,
  onStartBooking,
  onNavigate,
}) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 5);

  const [pickupLocation, setPickupLocation] = useState('Bengaluru Airport Terminal 1 Hub');
  const [pickupDate, setPickupDate] = useState(tomorrow.toISOString().split('T')[0]);
  const [returnDate, setReturnDate] = useState(nextWeek.toISOString().split('T')[0]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [dateError, setDateError] = useState<string | null>(null);

  const categories: { label: string; value: string }[] = [
    { label: 'All Fleet', value: 'All' },
    { label: 'Luxury', value: 'Luxury' },
    { label: 'SUV', value: 'SUV' },
    { label: 'Electric', value: 'Electric' },
    { label: 'Sedan', value: 'Sedan' },
    { label: 'Premium Sports', value: 'Premium Sports' },
    { label: 'Economy', value: 'Economy' },
  ];

  const handleSearch = () => {
    if (new Date(returnDate) <= new Date(pickupDate)) {
      setDateError('Return date must be strictly after pickup date.');
      return;
    }
    setDateError(null);
    onNavigate('/vehicles');
  };

  const filteredVehicles = vehicles
    .filter((v) => selectedCategory === 'All' || v.vehicle_type === selectedCategory)
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-[#080B10] text-[#F4F7FA]">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-6 max-w-7xl mx-auto overflow-hidden">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#18212C] border border-[#263241] text-xs text-[#C7F36B]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Intelligent Fleet Operations Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#F4F7FA] leading-[1.1] text-balance">
              Your next drive <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C7F36B] via-[#55D6E8] to-emerald-400">
                starts here.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-[#93A1B2] max-w-xl leading-relaxed">
              Discover verified premium cars, reserve in seconds with real-time transactional availability, and experience frictionless automotive mobility.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => onNavigate('/vehicles')}
                className="px-6 py-3.5 rounded-xl bg-[#C7F36B] hover:bg-[#b8e55e] text-[#080B10] font-semibold text-sm transition-all flex items-center gap-2 shadow-lg shadow-[#C7F36B]/10 hover:shadow-[#C7F36B]/20"
              >
                <span>Explore Fleet</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('/my-bookings')}
                className="px-6 py-3.5 rounded-xl bg-[#121821] hover:bg-[#18212C] text-[#F4F7FA] border border-[#263241] font-medium text-sm transition-colors flex items-center gap-2"
              >
                <Calendar className="w-4 h-4 text-[#93A1B2]" />
                <span>View My Bookings</span>
              </button>
            </div>

            {/* Quick Proof Metrics */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-[#263241]/70 max-w-lg">
              <div>
                <p className="text-2xl font-bold font-mono text-[#F4F7FA]">14+</p>
                <p className="text-xs text-[#93A1B2]">Available Models</p>
              </div>
              <div>
                <p className="text-2xl font-bold font-mono text-[#C7F36B]">100%</p>
                <p className="text-xs text-[#93A1B2]">Verified Fleets</p>
              </div>
              <div>
                <p className="text-2xl font-bold font-mono text-[#55D6E8]">ACID</p>
                <p className="text-xs text-[#93A1B2]">DBMS Guaranteed</p>
              </div>
            </div>
          </div>

          {/* Hero Cinematic Image */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-[#263241] shadow-2xl bg-[#121821] group">
              <img
                src={HERO_IMAGE}
                alt="Velocity OS Luxury Fleet Lineup"
                referrerPolicy="no-referrer"
                className="w-full h-[420px] object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080B10] via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-[#0D1118]/80 backdrop-blur-md border border-[#263241]/80 flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#93A1B2]">Flagship Experience</p>
                  <p className="text-sm font-semibold text-[#F4F7FA]">Porsche 911 Carrera GTS</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#93A1B2]">From</p>
                  <p className="text-sm font-mono font-bold text-[#C7F36B]">₹28,000<span className="text-[10px] text-[#93A1B2]">/day</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Booking Widget */}
        <div className="mt-14 p-6 rounded-2xl bg-[#121821] border border-[#263241] shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-[#93A1B2] mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#C7F36B]" />
                Pickup Hub
              </label>
              <select
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                className="w-full p-2.5 text-xs bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] focus:outline-none focus:border-[#C7F36B] transition-colors"
              >
                <option value="Bengaluru Airport Terminal 1 Hub">Bengaluru Airport Hub (BLR)</option>
                <option value="Bengaluru Indiranagar Station">Bengaluru Indiranagar Station</option>
                <option value="Mumbai BKC Operations Hub">Mumbai BKC Hub</option>
                <option value="Delhi Aerocity Premium Lounge">Delhi Aerocity Lounge</option>
                <option value="Chennai Central Hub">Chennai Central Hub</option>
                <option value="Ahmedabad SG Highway Station">Ahmedabad SG Highway Station</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#93A1B2] mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#55D6E8]" />
                Pickup Date
              </label>
              <input
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className="w-full p-2.5 text-xs bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] focus:outline-none focus:border-[#C7F36B] font-mono transition-colors"
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
                className="w-full p-2.5 text-xs bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] focus:outline-none focus:border-[#C7F36B] font-mono transition-colors"
              />
            </div>

            <div>
              <button
                onClick={handleSearch}
                className="w-full py-2.5 px-4 rounded-lg bg-[#C7F36B] hover:bg-[#b8e55e] text-[#080B10] font-semibold text-xs flex items-center justify-center gap-2 transition-colors h-[38px]"
              >
                <Search className="w-4 h-4" />
                <span>Search Availability</span>
              </button>
            </div>
          </div>

          {dateError && (
            <p className="mt-3 text-xs text-rose-400 font-medium">{dateError}</p>
          )}
        </div>
      </section>

      {/* Featured Vehicles Section */}
      <section className="py-16 px-6 max-w-7xl mx-auto border-t border-[#263241]/70">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#F4F7FA]">Curated Fleet Inventory</h2>
            <p className="text-sm text-[#93A1B2] mt-1">
              Select from performance sedans, family SUVs, and all-electric long-range cruisers.
            </p>
          </div>

          {/* Category Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((c) => (
              <button
                key={c.value}
                onClick={() => setSelectedCategory(c.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  selectedCategory === c.value
                    ? 'bg-[#C7F36B] text-[#080B10] font-semibold'
                    : 'bg-[#121821] text-[#93A1B2] hover:text-[#F4F7FA] border border-[#263241]'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Vehicle Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => {
            const isAvailable = vehicle.status === 'Available';

            return (
              <div
                key={vehicle.vehicle_id}
                className="bg-[#121821] border border-[#263241] rounded-xl overflow-hidden hover:border-slate-500 transition-all flex flex-col group"
              >
                <div className="relative h-48 bg-[#0D1118] overflow-hidden">
                  <img
                    src={vehicle.image_url}
                    alt={`${vehicle.brand} ${vehicle.model}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#0D1118]/80 backdrop-blur-md text-[#F4F7FA] border border-[#263241]">
                      {vehicle.vehicle_type}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${getVehicleStatusStyle(
                        vehicle.status
                      )}`}
                    >
                      {vehicle.status}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-[#93A1B2]">{vehicle.brand}</p>
                        <h3 className="text-base font-bold text-[#F4F7FA]">{vehicle.model}</h3>
                      </div>
                      <span className="text-xs font-mono text-[#93A1B2]">{vehicle.model_year}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-4 border-y border-[#263241]/70 my-4 text-xs text-[#93A1B2]">
                      <div className="flex items-center gap-1.5">
                        <Fuel className="w-3.5 h-3.5 text-[#55D6E8]" />
                        <span>{vehicle.fuel_type}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Gauge className="w-3.5 h-3.5 text-[#C7F36B]" />
                        <span>{vehicle.transmission}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#93A1B2]" />
                        <span>{vehicle.seating_capacity} Seats</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <p className="text-[11px] text-[#93A1B2]">Daily Rate</p>
                      <p className="text-lg font-mono font-bold text-[#F4F7FA]">
                        {formatINR(vehicle.rental_rate)}
                        <span className="text-xs font-normal text-[#93A1B2]">/day</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectVehicle(vehicle.vehicle_id)}
                        className="px-3 py-1.5 text-xs font-medium text-[#F4F7FA] hover:text-[#C7F36B] hover:bg-[#18212C] rounded-lg transition-colors border border-transparent hover:border-[#263241]"
                      >
                        Details
                      </button>

                      <button
                        onClick={() => onStartBooking(vehicle.vehicle_id, pickupDate, returnDate, pickupLocation)}
                        disabled={!isAvailable}
                        className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                          isAvailable
                            ? 'bg-[#C7F36B] hover:bg-[#b8e55e] text-[#080B10]'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {isAvailable ? 'Book Now' : 'Reserved'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <button
            onClick={() => onNavigate('/vehicles')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#121821] hover:bg-[#18212C] border border-[#263241] text-sm font-semibold text-[#F4F7FA] hover:text-[#C7F36B] transition-colors"
          >
            <span>View All {vehicles.length} Vehicles</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 px-6 max-w-7xl mx-auto border-t border-[#263241]/70">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#F4F7FA]">How VELOCITY OS Works</h2>
          <p className="text-sm text-[#93A1B2] mt-2">
            Engineered for transparent pricing, transactional booking guarantees, and zero airport wait times.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 rounded-xl bg-[#121821] border border-[#263241] relative">
            <div className="w-10 h-10 rounded-lg bg-[#C7F36B]/10 border border-[#C7F36B]/30 flex items-center justify-center text-[#C7F36B] mb-4">
              <Car className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#F4F7FA] mb-2">1. Choose & Schedule</h3>
            <p className="text-xs text-[#93A1B2] leading-relaxed">
              Filter by vehicle category, fuel type, and dates. Our relational database engine confirms availability instantly.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#121821] border border-[#263241] relative">
            <div className="w-10 h-10 rounded-lg bg-[#55D6E8]/10 border border-[#55D6E8]/30 flex items-center justify-center text-[#55D6E8] mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#F4F7FA] mb-2">2. Verify & Confirm</h3>
            <p className="text-xs text-[#93A1B2] leading-relaxed">
              Enter customer details and license number. Simulated checkout supports UPI, card, and cash at pickup.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#121821] border border-[#263241] relative">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#F4F7FA] mb-2">3. Pickup & Drive</h3>
            <p className="text-xs text-[#93A1B2] leading-relaxed">
              Arrive at the designated operations hub. The vehicle is inspected, sanitized, and ready for your journey.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-[#263241] bg-[#0A0E14] text-xs text-[#93A1B2]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-sm bg-[#C7F36B]" />
            <span className="font-bold text-[#F4F7FA]">VELOCITY OS</span>
            <span>—</span>
            <span>Academic DBMS Project Prototype</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => onNavigate('/vehicles')} className="hover:text-[#F4F7FA]">Fleet</button>
            <button onClick={() => onNavigate('/my-bookings')} className="hover:text-[#F4F7FA]">My Bookings</button>
            <button onClick={() => onNavigate('/admin/dashboard')} className="hover:text-[#C7F36B]">Operations Console</button>
            <button onClick={() => onNavigate('/admin/database')} className="hover:text-[#55D6E8]">Schema Diagram</button>
          </div>

          <p className="text-[#93A1B2]/60 font-mono text-[11px]">
            Relational 6-Table Schema · ACID Transaction Simulator
          </p>
        </div>
      </footer>
    </div>
  );
};
