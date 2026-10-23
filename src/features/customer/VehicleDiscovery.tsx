import React, { useState, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  Calendar,
  Grid,
  List,
  Fuel,
  Gauge,
  Users,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
  Car,
} from 'lucide-react';
import { Vehicle, VehicleCategory, FuelType, Transmission } from '../../types';
import { formatINR, getVehicleStatusStyle } from '../../utils/formatters';
import { dbStore } from '../../services/dbStore';

interface VehicleDiscoveryProps {
  vehicles: Vehicle[];
  onSelectVehicle: (vehicleId: number) => void;
  onStartBooking: (vehicleId: number, pickupDate?: string, returnDate?: string) => void;
}

export const VehicleDiscovery: React.FC<VehicleDiscoveryProps> = ({
  vehicles,
  onSelectVehicle,
  onStartBooking,
}) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 5);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [maxPrice, setMaxPrice] = useState<number>(30000);
  const [selectedFuel, setSelectedFuel] = useState<string>('All');
  const [selectedTransmission, setSelectedTransmission] = useState<string>('All');
  const [selectedSeats, setSelectedSeats] = useState<string>('All');
  const [pickupDate, setPickupDate] = useState<string>(tomorrow.toISOString().split('T')[0]);
  const [returnDate, setReturnDate] = useState<string>(nextWeek.toISOString().split('T')[0]);
  const [checkDates, setCheckDates] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'name' | 'year'>('price_asc');

  const categories: string[] = ['All', 'Economy', 'Sedan', 'SUV', 'Luxury', 'Electric', 'Premium Sports'];
  const fuels: string[] = ['All', 'Petrol', 'Diesel', 'Electric', 'Hybrid'];
  const transmissions: string[] = ['All', 'Automatic', 'Manual'];
  const seatOptions: string[] = ['All', '2', '4', '5', '7'];

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setMaxPrice(30000);
    setSelectedFuel('All');
    setSelectedTransmission('All');
    setSelectedSeats('All');
    setSortBy('price_asc');
  };

  const filteredVehicles = useMemo(() => {
    return vehicles
      .filter((v) => {
        // Exclude archived/inactive vehicles from customer discovery
        if (v.status === 'Inactive') return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = `${v.brand} ${v.model}`.toLowerCase().includes(q);
          const matchType = v.vehicle_type.toLowerCase().includes(q);
          if (!matchName && !matchType) return false;
        }

        // Category
        if (selectedCategory !== 'All' && v.vehicle_type !== selectedCategory) {
          return false;
        }

        // Price
        if (v.rental_rate > maxPrice) {
          return false;
        }

        // Fuel
        if (selectedFuel !== 'All' && v.fuel_type !== selectedFuel) {
          return false;
        }

        // Transmission
        if (selectedTransmission !== 'All' && v.transmission !== selectedTransmission) {
          return false;
        }

        // Seats
        if (selectedSeats !== 'All' && v.seating_capacity !== parseInt(selectedSeats, 10)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.rental_rate - b.rental_rate;
        if (sortBy === 'price_desc') return b.rental_rate - a.rental_rate;
        if (sortBy === 'name') return `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`);
        if (sortBy === 'year') return b.model_year - a.model_year;
        return 0;
      });
  }, [
    vehicles,
    searchQuery,
    selectedCategory,
    maxPrice,
    selectedFuel,
    selectedTransmission,
    selectedSeats,
    sortBy,
  ]);

  return (
    <div className="min-h-screen bg-[#080B10] text-[#F4F7FA] py-8 px-6 max-w-7xl mx-auto">
      {/* Title & View Switch */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F4F7FA]">Vehicle Discovery</h1>
          <p className="text-xs sm:text-sm text-[#93A1B2] mt-1">
            Browse our fleet of {vehicles.length} high-specification vehicles with live database availability checks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#121821] border border-[#263241] rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-[#18212C] text-[#C7F36B]' : 'text-[#93A1B2]'}`}
              title="Grid view"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-[#18212C] text-[#C7F36B]' : 'text-[#93A1B2]'}`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs bg-[#121821] text-[#F4F7FA] border border-[#263241] rounded-lg p-2 focus:outline-none focus:border-[#C7F36B]"
          >
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name">Vehicle: Alphabetical</option>
            <option value="year">Newest Model Year</option>
          </select>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8 items-start">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 bg-[#121821] border border-[#263241] rounded-xl p-5 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#263241]">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#C7F36B]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#F4F7FA]">Filters</h3>
            </div>
            <button
              onClick={resetFilters}
              className="text-[11px] text-[#93A1B2] hover:text-[#C7F36B] flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Search Input */}
          <div>
            <label className="block text-xs font-semibold text-[#93A1B2] mb-1.5">Search Fleet</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Make or model..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] placeholder-[#93A1B2] focus:outline-none focus:border-[#C7F36B]"
              />
              <Search className="w-3.5 h-3.5 text-[#93A1B2] absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Date Range Check */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#93A1B2]">Rental Window</label>
              <label className="flex items-center gap-1 text-[11px] text-[#55D6E8] cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkDates}
                  onChange={(e) => setCheckDates(e.target.checked)}
                  className="rounded border-[#263241] accent-[#C7F36B]"
                />
                <span>Live Availability</span>
              </label>
            </div>
            {checkDates && (
              <div className="space-y-2 mt-2">
                <div>
                  <span className="text-[10px] text-[#93A1B2]">Pickup</span>
                  <input
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full p-2 text-xs bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] font-mono focus:outline-none focus:border-[#C7F36B]"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-[#93A1B2]">Return</span>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full p-2 text-xs bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] font-mono focus:outline-none focus:border-[#C7F36B]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-[#93A1B2] mb-1.5">Category</label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                    selectedCategory === c
                      ? 'bg-[#C7F36B] text-[#080B10] font-semibold'
                      : 'bg-[#0D1118] text-[#93A1B2] hover:text-[#F4F7FA] border border-[#263241]'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Daily Price Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#93A1B2]">Max Daily Rate</label>
              <span className="text-xs font-mono font-bold text-[#C7F36B]">{formatINR(maxPrice)}</span>
            </div>
            <input
              type="range"
              min={1500}
              max={30000}
              step={500}
              value={maxPrice}
              onChange={(e) => setMaxPrice(parseInt(e.target.value, 10))}
              className="w-full accent-[#C7F36B] bg-[#0D1118] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#93A1B2] font-mono mt-1">
              <span>₹1,500</span>
              <span>₹30,000+</span>
            </div>
          </div>

          {/* Fuel */}
          <div>
            <label className="block text-xs font-semibold text-[#93A1B2] mb-1.5">Fuel Type</label>
            <div className="grid grid-cols-2 gap-1.5">
              {fuels.map((f) => (
                <button
                  key={f}
                  onClick={() => setSelectedFuel(f)}
                  className={`p-1.5 text-xs rounded-lg transition-colors text-center ${
                    selectedFuel === f
                      ? 'bg-[#18212C] text-[#55D6E8] font-semibold border border-[#55D6E8]/30'
                      : 'bg-[#0D1118] text-[#93A1B2] hover:text-[#F4F7FA] border border-[#263241]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Transmission */}
          <div>
            <label className="block text-xs font-semibold text-[#93A1B2] mb-1.5">Transmission</label>
            <div className="grid grid-cols-3 gap-1.5">
              {transmissions.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTransmission(t)}
                  className={`p-1.5 text-xs rounded-lg transition-colors text-center ${
                    selectedTransmission === t
                      ? 'bg-[#18212C] text-[#C7F36B] font-semibold border border-[#C7F36B]/30'
                      : 'bg-[#0D1118] text-[#93A1B2] hover:text-[#F4F7FA] border border-[#263241]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Seating */}
          <div>
            <label className="block text-xs font-semibold text-[#93A1B2] mb-1.5">Seating Capacity</label>
            <div className="flex gap-1.5">
              {seatOptions.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSeats(s)}
                  className={`flex-1 p-1.5 text-xs rounded-lg transition-colors text-center ${
                    selectedSeats === s
                      ? 'bg-[#18212C] text-[#F4F7FA] font-semibold border border-slate-500'
                      : 'bg-[#0D1118] text-[#93A1B2] hover:text-[#F4F7FA] border border-[#263241]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results List / Grid */}
        <div className="lg:col-span-3">
          <div className="mb-4 flex items-center justify-between text-xs text-[#93A1B2]">
            <span>Showing <strong className="text-[#F4F7FA]">{filteredVehicles.length}</strong> matching vehicles</span>
            {checkDates && (
              <span className="text-[11px] font-mono text-[#55D6E8]">
                Window: {pickupDate} → {returnDate}
              </span>
            )}
          </div>

          {filteredVehicles.length === 0 ? (
            <div className="p-12 text-center bg-[#121821] border border-[#263241] rounded-xl">
              <Car className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#F4F7FA]">No vehicles match your criteria</h3>
              <p className="text-xs text-[#93A1B2] mt-1 max-w-sm mx-auto">
                Try widening your price range, choosing another fuel category, or clearing your active filters.
              </p>
              <button
                onClick={resetFilters}
                className="mt-4 px-4 py-2 text-xs font-semibold bg-[#18212C] hover:bg-[#263241] text-[#C7F36B] rounded-lg transition-colors border border-[#263241]"
              >
                Reset All Filters
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredVehicles.map((vehicle) => {
                const availCheck = checkDates
                  ? dbStore.checkVehicleAvailability(vehicle.vehicle_id, pickupDate, returnDate)
                  : { available: vehicle.status === 'Available' };

                return (
                  <div
                    key={vehicle.vehicle_id}
                    className="bg-[#121821] border border-[#263241] rounded-xl overflow-hidden hover:border-slate-500 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="relative h-44 bg-[#0D1118] overflow-hidden">
                        <img
                          src={vehicle.image_url}
                          alt={`${vehicle.brand} ${vehicle.model}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute top-2.5 left-2.5">
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#0D1118]/80 backdrop-blur-md text-[#F4F7FA] border border-[#263241]">
                            {vehicle.vehicle_type}
                          </span>
                        </div>

                        <div className="absolute top-2.5 right-2.5">
                          {availCheck.available ? (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Available</span>
                            </span>
                          ) : (
                            <span
                              className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1"
                              title={availCheck.conflictReason}
                            >
                              <AlertCircle className="w-3 h-3" />
                              <span>Unavailable</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs text-[#93A1B2]">{vehicle.brand}</p>
                            <h3 className="text-sm font-bold text-[#F4F7FA]">{vehicle.model}</h3>
                          </div>
                          <span className="text-xs font-mono text-[#93A1B2]">{vehicle.model_year}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-1 py-3 border-y border-[#263241]/70 my-3 text-[11px] text-[#93A1B2]">
                          <span className="flex items-center gap-1">
                            <Fuel className="w-3 h-3 text-[#55D6E8]" />
                            {vehicle.fuel_type}
                          </span>
                          <span className="flex items-center gap-1">
                            <Gauge className="w-3 h-3 text-[#C7F36B]" />
                            {vehicle.transmission}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-[#93A1B2]" />
                            {vehicle.seating_capacity} seats
                          </span>
                        </div>

                        {!availCheck.available && availCheck.conflictReason && (
                          <p className="text-[10px] text-rose-400/90 leading-tight mb-2 italic">
                            {availCheck.conflictReason}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-4 pt-0 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-[#93A1B2]">Daily</span>
                        <p className="text-base font-mono font-bold text-[#F4F7FA]">
                          {formatINR(vehicle.rental_rate)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onSelectVehicle(vehicle.vehicle_id)}
                          className="px-2.5 py-1.5 text-xs text-[#F4F7FA] hover:text-[#C7F36B] hover:bg-[#18212C] rounded-lg transition-colors border border-transparent hover:border-[#263241]"
                        >
                          Specs
                        </button>

                        <button
                          onClick={() => onStartBooking(vehicle.vehicle_id, pickupDate, returnDate)}
                          disabled={!availCheck.available}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                            availCheck.available
                              ? 'bg-[#C7F36B] hover:bg-[#b8e55e] text-[#080B10]'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          Book
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // List View
            <div className="space-y-3">
              {filteredVehicles.map((vehicle) => {
                const availCheck = checkDates
                  ? dbStore.checkVehicleAvailability(vehicle.vehicle_id, pickupDate, returnDate)
                  : { available: vehicle.status === 'Available' };

                return (
                  <div
                    key={vehicle.vehicle_id}
                    className="p-4 bg-[#121821] border border-[#263241] rounded-xl hover:border-slate-500 transition-all flex flex-col sm:flex-row items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <img
                        src={vehicle.image_url}
                        alt={`${vehicle.brand} ${vehicle.model}`}
                        referrerPolicy="no-referrer"
                        className="w-24 h-16 object-cover rounded-lg bg-[#0D1118] shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#F4F7FA]">{vehicle.brand} {vehicle.model}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#18212C] text-[#55D6E8]">
                            {vehicle.vehicle_type}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[#93A1B2] mt-1">
                          <span>{vehicle.fuel_type}</span>
                          <span>·</span>
                          <span>{vehicle.transmission}</span>
                          <span>·</span>
                          <span>{vehicle.seating_capacity} Seats</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                      <div className="text-right">
                        <span className="text-[10px] text-[#93A1B2]">Rate / Day</span>
                        <p className="text-base font-mono font-bold text-[#C7F36B]">{formatINR(vehicle.rental_rate)}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onSelectVehicle(vehicle.vehicle_id)}
                          className="px-3 py-1.5 text-xs text-[#F4F7FA] hover:bg-[#18212C] rounded-lg border border-[#263241]"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => onStartBooking(vehicle.vehicle_id, pickupDate, returnDate)}
                          disabled={!availCheck.available}
                          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                            availCheck.available
                              ? 'bg-[#C7F36B] hover:bg-[#b8e55e] text-[#080B10]'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
