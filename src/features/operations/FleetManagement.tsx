import React, { useState, useMemo } from 'react';
import {
  Car,
  Plus,
  Search,
  Filter,
  SlidersHorizontal,
  Edit,
  Archive,
  Wrench,
  CheckCircle2,
  AlertCircle,
  X,
  Eye,
} from 'lucide-react';
import { Vehicle, VehicleCategory, FuelType, Transmission, VehicleStatus, Rental, Maintenance, StaffRole } from '../../types';
import { formatINR, getVehicleStatusStyle } from '../../utils/formatters';
import { dbStore } from '../../services/dbStore';
import { Modal } from '../../components/common/Modal';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { useToast } from '../../components/common/ToastProvider';
import { SEDAN_IMAGE, SUV_IMAGE, ELECTRIC_IMAGE } from '../../data/seedData';

interface FleetManagementProps {
  vehicles: Vehicle[];
  rentals: Rental[];
  maintenance: Maintenance[];
  activeRole: StaffRole;
  onOpenVehicleDetails?: (vehicleId: number) => void;
}

export const FleetManagement: React.FC<FleetManagementProps> = ({
  vehicles,
  rentals,
  maintenance,
  activeRole,
}) => {
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [archivingVehicle, setArchivingVehicle] = useState<Vehicle | null>(null);
  const [historyVehicle, setHistoryVehicle] = useState<Vehicle | null>(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    model_year: 2024,
    registration_no: '',
    vehicle_type: 'Sedan' as VehicleCategory,
    rental_rate: 3500,
    fuel_type: 'Petrol' as FuelType,
    transmission: 'Automatic' as Transmission,
    seating_capacity: 5,
    status: 'Available' as VehicleStatus,
    image_url: SEDAN_IMAGE,
  });

  const [formError, setFormError] = useState<string | null>(null);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          v.brand.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q) ||
          v.registration_no.toLowerCase().includes(q) ||
          v.vehicle_id.toString().includes(q);
        if (!match) return false;
      }
      if (filterCategory !== 'All' && v.vehicle_type !== filterCategory) return false;
      if (filterStatus !== 'All' && v.status !== filterStatus) return false;
      return true;
    });
  }, [vehicles, search, filterCategory, filterStatus]);

  const handleOpenAddModal = () => {
    setFormData({
      brand: '',
      model: '',
      model_year: 2024,
      registration_no: '',
      vehicle_type: 'Sedan',
      rental_rate: 3500,
      fuel_type: 'Petrol',
      transmission: 'Automatic',
      seating_capacity: 5,
      status: 'Available',
      image_url: SEDAN_IMAGE,
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (v: Vehicle) => {
    setEditingVehicle(v);
    setFormData({
      brand: v.brand,
      model: v.model,
      model_year: v.model_year,
      registration_no: v.registration_no,
      vehicle_type: v.vehicle_type,
      rental_rate: v.rental_rate,
      fuel_type: v.fuel_type,
      transmission: v.transmission,
      seating_capacity: v.seating_capacity,
      status: v.status,
      image_url: v.image_url,
    });
    setFormError(null);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.brand.trim() || !formData.model.trim() || !formData.registration_no.trim()) {
      setFormError('Make, model, and registration number are mandatory.');
      return;
    }
    if (formData.rental_rate <= 0) {
      setFormError('Rental rate must be greater than zero.');
      return;
    }

    try {
      // Pick image based on category if default
      let img = formData.image_url;
      if (formData.vehicle_type === 'SUV') img = SUV_IMAGE;
      else if (formData.vehicle_type === 'Electric') img = ELECTRIC_IMAGE;

      dbStore.addVehicle({
        ...formData,
        image_url: img,
      });

      showToast(`Vehicle ${formData.brand} ${formData.model} added to fleet.`, 'success');
      setIsAddModalOpen(false);
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle) return;

    try {
      dbStore.updateVehicle(editingVehicle.vehicle_id, formData);
      showToast(`Vehicle #${editingVehicle.vehicle_id} updated successfully.`, 'success');
      setEditingVehicle(null);
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handleConfirmArchive = () => {
    if (!archivingVehicle) return;
    try {
      dbStore.archiveVehicle(archivingVehicle.vehicle_id);
      showToast(`Vehicle #${archivingVehicle.vehicle_id} archived (Inactive).`, 'info');
      setArchivingVehicle(null);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#F4F7FA]">Fleet Inventory Management</h1>
          <p className="text-xs text-[#93A1B2]">
            Catalog of all {vehicles.length} vehicle units with unique registration numbers and operational states.
          </p>
        </div>

        {(activeRole === 'Admin' || activeRole === 'Manager') && (
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-lg bg-[#C7F36B] hover:bg-[#b8e55e] text-[#080B10] text-xs font-semibold flex items-center gap-2 transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Vehicle</span>
          </button>
        )}
      </div>

      {/* Filter / Search Bar */}
      <div className="p-4 rounded-xl bg-[#121821] border border-[#263241] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-[#93A1B2] absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search make, model, registration, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] placeholder-[#93A1B2] focus:outline-none focus:border-[#C7F36B]"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1">
          <div className="flex items-center gap-1.5 text-xs text-[#93A1B2]">
            <Filter className="w-3.5 h-3.5" />
            <span>Type:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-[#0D1118] text-[#F4F7FA] border border-[#263241] rounded-lg p-1.5 text-xs"
            >
              <option value="All">All Categories</option>
              <option value="Economy">Economy</option>
              <option value="Sedan">Sedan</option>
              <option value="SUV">SUV</option>
              <option value="Luxury">Luxury</option>
              <option value="Electric">Electric</option>
              <option value="Premium Sports">Premium Sports</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#93A1B2]">
            <span>Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-[#0D1118] text-[#F4F7FA] border border-[#263241] rounded-lg p-1.5 text-xs"
            >
              <option value="All">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Rented">Rented</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Fleet Inventory Table */}
      <div className="bg-[#121821] border border-[#263241] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#F4F7FA]">
            <thead className="bg-[#0D1118] text-[#93A1B2] uppercase text-[10px] font-semibold border-b border-[#263241]">
              <tr>
                <th className="py-3 px-4">Vehicle ID</th>
                <th className="py-3 px-4">Model & Make</th>
                <th className="py-3 px-4">Registration No.</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Rate / Day</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4">Current Rental</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263241]/60">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#93A1B2]">
                    No vehicles found matching filters.
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((v) => {
                  const activeRental = rentals.find(
                    (r) => r.vehicle_id === v.vehicle_id && (r.status === 'Active' || r.status === 'Confirmed')
                  );
                  const vMaintenance = maintenance.filter((m) => m.vehicle_id === v.vehicle_id);

                  return (
                    <tr key={v.vehicle_id} className="hover:bg-[#18212C]/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-[#55D6E8]">#{v.vehicle_id}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={v.image_url}
                            alt={v.model}
                            referrerPolicy="no-referrer"
                            className="w-12 h-8 rounded object-cover bg-[#0D1118] shrink-0"
                          />
                          <div>
                            <span className="font-bold text-[#F4F7FA]">{v.brand} {v.model}</span>
                            <span className="block text-[10px] text-[#93A1B2] font-mono">{v.fuel_type} · {v.transmission}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-[#F4F7FA]">{v.registration_no}</td>
                      <td className="py-3 px-4 text-[#93A1B2]">{v.vehicle_type}</td>
                      <td className="py-3 px-4 font-mono font-bold text-[#C7F36B]">{formatINR(v.rental_rate)}</td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getVehicleStatusStyle(v.status)}`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {activeRental ? (
                          <span className="text-[11px] font-mono text-[#55D6E8]">
                            Rental #{activeRental.rental_id} ({activeRental.status})
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#93A1B2]/60">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setHistoryVehicle(v)}
                            className="p-1 text-[#93A1B2] hover:text-[#55D6E8] hover:bg-[#18212C] rounded transition-colors"
                            title="Maintenance History"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                          </button>

                          {(activeRole === 'Admin' || activeRole === 'Manager') && (
                            <button
                              onClick={() => handleOpenEditModal(v)}
                              className="p-1 text-[#93A1B2] hover:text-[#C7F36B] hover:bg-[#18212C] rounded transition-colors"
                              title="Edit Vehicle"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {activeRole === 'Admin' && v.status !== 'Inactive' && (
                            <button
                              onClick={() => setArchivingVehicle(v)}
                              className="p-1 text-[#93A1B2] hover:text-rose-400 hover:bg-[#18212C] rounded transition-colors"
                              title="Archive Vehicle"
                            >
                              <Archive className="w-3.5 h-3.5" />
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

      {/* Add Vehicle Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Fleet Vehicle"
      >
        <form onSubmit={handleSaveAdd} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#93A1B2] mb-1">Brand / Make *</label>
              <input
                type="text"
                required
                placeholder="e.g. BMW, Hyundai"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full p-2 bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] focus:outline-none focus:border-[#C7F36B]"
              />
            </div>
            <div>
              <label className="block text-[#93A1B2] mb-1">Model Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. 330Li M Sport"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full p-2 bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] focus:outline-none focus:border-[#C7F36B]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#93A1B2] mb-1">Registration Number (Unique) *</label>
              <input
                type="text"
                required
                placeholder="e.g. KA-01-XX-1234"
                value={formData.registration_no}
                onChange={(e) => setFormData({ ...formData, registration_no: e.target.value })}
                className="w-full p-2 bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] font-mono focus:outline-none focus:border-[#C7F36B]"
              />
            </div>
            <div>
              <label className="block text-[#93A1B2] mb-1">Model Year</label>
              <input
                type="number"
                value={formData.model_year}
                onChange={(e) => setFormData({ ...formData, model_year: parseInt(e.target.value, 10) })}
                className="w-full p-2 bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] font-mono focus:outline-none focus:border-[#C7F36B]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[#93A1B2] mb-1">Category</label>
              <select
                value={formData.vehicle_type}
                onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value as any })}
                className="w-full p-2 bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA]"
              >
                <option value="Economy">Economy</option>
                <option value="Sedan">Sedan</option>
                <option value="SUV">SUV</option>
                <option value="Luxury">Luxury</option>
                <option value="Electric">Electric</option>
                <option value="Premium Sports">Premium Sports</option>
              </select>
            </div>

            <div>
              <label className="block text-[#93A1B2] mb-1">Fuel Type</label>
              <select
                value={formData.fuel_type}
                onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value as any })}
                className="w-full p-2 bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA]"
              >
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="Electric">Electric</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>

            <div>
              <label className="block text-[#93A1B2] mb-1">Transmission</label>
              <select
                value={formData.transmission}
                onChange={(e) => setFormData({ ...formData, transmission: e.target.value as any })}
                className="w-full p-2 bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA]"
              >
                <option value="Automatic">Automatic</option>
                <option value="Manual">Manual</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#93A1B2] mb-1">Daily Rental Rate (INR) *</label>
              <input
                type="number"
                required
                min={500}
                value={formData.rental_rate}
                onChange={(e) => setFormData({ ...formData, rental_rate: parseInt(e.target.value, 10) })}
                className="w-full p-2 bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] font-mono focus:outline-none focus:border-[#C7F36B]"
              />
            </div>

            <div>
              <label className="block text-[#93A1B2] mb-1">Seating Capacity</label>
              <input
                type="number"
                min={2}
                max={10}
                value={formData.seating_capacity}
                onChange={(e) => setFormData({ ...formData, seating_capacity: parseInt(e.target.value, 10) })}
                className="w-full p-2 bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] font-mono focus:outline-none focus:border-[#C7F36B]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#263241]">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-lg text-[#93A1B2] hover:text-[#F4F7FA]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#C7F36B] hover:bg-[#b8e55e] text-[#080B10] font-semibold rounded-lg"
            >
              Add Vehicle
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Vehicle Modal */}
      {editingVehicle && (
        <Modal
          isOpen={true}
          onClose={() => setEditingVehicle(null)}
          title={`Edit Vehicle #${editingVehicle.vehicle_id} (${editingVehicle.brand} ${editingVehicle.model})`}
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            {formError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#93A1B2] mb-1">Registration Number</label>
                <input
                  type="text"
                  required
                  value={formData.registration_no}
                  onChange={(e) => setFormData({ ...formData, registration_no: e.target.value })}
                  className="w-full p-2 bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] font-mono focus:outline-none focus:border-[#C7F36B]"
                />
              </div>

              <div>
                <label className="block text-[#93A1B2] mb-1">Operational Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full p-2 bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA]"
                >
                  <option value="Available">Available</option>
                  <option value="Rented">Rented</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#93A1B2] mb-1">Daily Rental Rate (INR)</label>
                <input
                  type="number"
                  required
                  value={formData.rental_rate}
                  onChange={(e) => setFormData({ ...formData, rental_rate: parseInt(e.target.value, 10) })}
                  className="w-full p-2 bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] font-mono focus:outline-none focus:border-[#C7F36B]"
                />
              </div>

              <div>
                <label className="block text-[#93A1B2] mb-1">Category</label>
                <select
                  value={formData.vehicle_type}
                  onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value as any })}
                  className="w-full p-2 bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA]"
                >
                  <option value="Economy">Economy</option>
                  <option value="Sedan">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="Luxury">Luxury</option>
                  <option value="Electric">Electric</option>
                  <option value="Premium Sports">Premium Sports</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#263241]">
              <button
                type="button"
                onClick={() => setEditingVehicle(null)}
                className="px-4 py-2 rounded-lg text-[#93A1B2] hover:text-[#F4F7FA]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#C7F36B] hover:bg-[#b8e55e] text-[#080B10] font-semibold rounded-lg"
              >
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Maintenance History Modal */}
      {historyVehicle && (
        <Modal
          isOpen={true}
          onClose={() => setHistoryVehicle(null)}
          title={`Workshop & Maintenance History — ${historyVehicle.brand} ${historyVehicle.model} (${historyVehicle.registration_no})`}
        >
          {(() => {
            const logs = maintenance.filter((m) => m.vehicle_id === historyVehicle.vehicle_id);

            return (
              <div className="space-y-4 text-xs">
                {logs.length === 0 ? (
                  <p className="text-[#93A1B2] py-6 text-center">
                    No workshop or maintenance records found for this vehicle.
                  </p>
                ) : (
                  <div className="divide-y divide-[#263241]">
                    {logs.map((log) => (
                      <div key={log.maintenance_id} className="py-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#F4F7FA] font-mono">Job #{log.maintenance_id}</span>
                          <span className="font-mono text-[#C7F36B] font-bold">{formatINR(log.cost)}</span>
                        </div>
                        <div className="flex items-center justify-between text-[#93A1B2] text-[11px]">
                          <span>Scheduled Date: {log.date}</span>
                          <span className="text-[#55D6E8]">{log.status}</span>
                        </div>
                        <p className="text-[#93A1B2]">{log.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </Modal>
      )}

      {/* Confirmation for Archive */}
      <ConfirmationDialog
        isOpen={archivingVehicle !== null}
        onClose={() => setArchivingVehicle(null)}
        onConfirm={handleConfirmArchive}
        title="Archive Fleet Vehicle?"
        message={`Are you sure you want to deactivate and archive ${archivingVehicle?.brand} ${archivingVehicle?.model} (${archivingVehicle?.registration_no})? It will be marked Inactive and hidden from customer booking.`}
        confirmLabel="Archive Vehicle"
      />
    </div>
  );
};
