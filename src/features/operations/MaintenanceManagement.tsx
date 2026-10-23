import React, { useState, useMemo } from 'react';
import {
  Wrench,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  DollarSign,
  User,
} from 'lucide-react';
import { Maintenance, Vehicle, Staff, MaintenanceStatus, StaffRole } from '../../types';
import { formatINR, formatDate } from '../../utils/formatters';
import { dbStore } from '../../services/dbStore';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../components/common/ToastProvider';

interface MaintenanceManagementProps {
  maintenance: Maintenance[];
  vehicles: Vehicle[];
  staff: Staff[];
  activeRole: StaffRole;
}

export const MaintenanceManagement: React.FC<MaintenanceManagementProps> = ({
  maintenance,
  vehicles,
  staff,
  activeRole,
}) => {
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [scheduleData, setScheduleData] = useState({
    vehicle_id: vehicles[0]?.vehicle_id || 101,
    staff_id: staff.find((s) => s.role === 'Maintenance Staff')?.staff_id || 504,
    date: tomorrow.toISOString().split('T')[0],
    cost: 5000,
    description: '',
  });

  const maintenanceStaff = staff.filter((s) => s.role === 'Maintenance Staff' || s.role === 'Admin');

  // Metrics
  const totalCost = maintenance.reduce((sum, m) => sum + m.cost, 0);
  const inProgressCount = maintenance.filter((m) => m.status === 'In Progress').length;
  const scheduledCount = maintenance.filter((m) => m.status === 'Scheduled').length;

  const filteredMaintenance = useMemo(() => {
    return maintenance
      .filter((m) => {
        if (statusFilter !== 'All' && m.status !== statusFilter) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          const v = vehicles.find((veh) => veh.vehicle_id === m.vehicle_id);
          const matchId = m.maintenance_id.toString().includes(q);
          const matchDesc = m.description.toLowerCase().includes(q);
          const matchVehicle = v?.brand.toLowerCase().includes(q) || v?.model.toLowerCase().includes(q) || v?.registration_no.toLowerCase().includes(q);
          if (!matchId && !matchDesc && !matchVehicle) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [maintenance, statusFilter, search, vehicles]);

  const handleCreateMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleData.description.trim()) {
      setFormError('Please enter service description and diagnostic scope.');
      return;
    }
    if (scheduleData.cost < 0) {
      setFormError('Estimated maintenance cost cannot be negative.');
      return;
    }

    try {
      dbStore.scheduleMaintenance({
        vehicle_id: scheduleData.vehicle_id,
        staff_id: scheduleData.staff_id,
        date: scheduleData.date,
        cost: scheduleData.cost,
        description: scheduleData.description,
      });

      showToast('Maintenance service successfully scheduled.', 'success');
      setIsScheduleModalOpen(false);
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handleUpdateStatus = (id: number, newStatus: MaintenanceStatus) => {
    try {
      dbStore.updateMaintenanceStatus(id, newStatus);
      showToast(`Maintenance #${id} updated to ${newStatus}.`, 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#F4F7FA]">Fleet Workshop & Maintenance</h1>
          <p className="text-xs text-[#93A1B2]">
            Periodic servicing, safety inspections, and cost auditing connected to the <code>MAINTENANCE</code> relation.
          </p>
        </div>

        <button
          onClick={() => {
            setFormError(null);
            setIsScheduleModalOpen(true);
          }}
          className="px-4 py-2 rounded-lg bg-[#C7F36B] hover:bg-[#b8e55e] text-[#080B10] text-xs font-semibold flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Service</span>
        </button>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#121821] border border-[#263241]">
          <span className="text-[11px] text-[#93A1B2]">Total Workshop Expenditure</span>
          <p className="text-2xl font-bold font-mono text-[#C7F36B] mt-1 tabular-nums">{formatINR(totalCost)}</p>
          <p className="text-[10px] text-[#93A1B2] mt-1">{maintenance.length} total logged service jobs</p>
        </div>

        <div className="p-4 rounded-xl bg-[#121821] border border-[#263241]">
          <span className="text-[11px] text-[#93A1B2]">Vehicles Currently In Bay</span>
          <p className="text-2xl font-bold font-mono text-amber-400 mt-1 tabular-nums">{inProgressCount}</p>
          <p className="text-[10px] text-amber-400/80 mt-1">Status set to Maintenance</p>
        </div>

        <div className="p-4 rounded-xl bg-[#121821] border border-[#263241]">
          <span className="text-[11px] text-[#93A1B2]">Scheduled Upcoming</span>
          <p className="text-2xl font-bold font-mono text-[#55D6E8] mt-1 tabular-nums">{scheduledCount}</p>
          <p className="text-[10px] text-[#55D6E8] mt-1">Pending workshop intake</p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-4 rounded-xl bg-[#121821] border border-[#263241] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-[#93A1B2] absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search job ID, vehicle, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] placeholder-[#93A1B2] focus:outline-none focus:border-[#C7F36B]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {['All', 'In Progress', 'Scheduled', 'Completed'].map((st) => (
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

      {/* Maintenance Table */}
      <div className="bg-[#121821] border border-[#263241] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#F4F7FA]">
            <thead className="bg-[#0D1118] text-[#93A1B2] uppercase text-[10px] font-semibold border-b border-[#263241]">
              <tr>
                <th className="py-3 px-4">Job ID</th>
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4">Service Date</th>
                <th className="py-3 px-4">Cost</th>
                <th className="py-3 px-4">Scope Description</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Technician</th>
                <th className="py-3 px-4 text-right">Workflow Transition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263241]/60">
              {filteredMaintenance.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#93A1B2]">
                    No maintenance records found.
                  </td>
                </tr>
              ) : (
                filteredMaintenance.map((m) => {
                  const v = vehicles.find((veh) => veh.vehicle_id === m.vehicle_id);
                  const s = staff.find((st) => st.staff_id === m.staff_id);

                  return (
                    <tr key={m.maintenance_id} className="hover:bg-[#18212C]/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#55D6E8]">#{m.maintenance_id}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-[#F4F7FA]">{v ? `${v.brand} ${v.model}` : `Vehicle #${m.vehicle_id}`}</span>
                        <span className="block text-[10px] font-mono text-[#93A1B2]">{v?.registration_no}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[#93A1B2]">{m.date}</td>
                      <td className="py-3 px-4 font-mono font-bold text-[#C7F36B]">{formatINR(m.cost)}</td>
                      <td className="py-3 px-4 max-w-xs text-[#93A1B2] truncate" title={m.description}>
                        {m.description}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                            m.status === 'Completed'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : m.status === 'In Progress'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-[#55D6E8]/10 text-[#55D6E8] border-[#55D6E8]/30'
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#93A1B2]">{s?.name || 'Assigned Staff'}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {m.status === 'Scheduled' && (
                            <button
                              onClick={() => handleUpdateStatus(m.maintenance_id, 'In Progress')}
                              className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-[10px] font-semibold transition-colors"
                            >
                              Intake to Bay
                            </button>
                          )}

                          {m.status === 'In Progress' && (
                            <button
                              onClick={() => handleUpdateStatus(m.maintenance_id, 'Completed')}
                              className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-semibold transition-colors flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Pass Inspection</span>
                            </button>
                          )}

                          {m.status === 'Completed' && (
                            <span className="text-[10px] text-emerald-400/70 font-mono">Completed</span>
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

      {/* Schedule Modal */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Schedule Fleet Maintenance Job"
      >
        <form onSubmit={handleCreateMaintenance} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-[#93A1B2] mb-1">Target Vehicle *</label>
            <select
              value={scheduleData.vehicle_id}
              onChange={(e) => setScheduleData({ ...scheduleData, vehicle_id: parseInt(e.target.value, 10) })}
              className="w-full p-2 bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA]"
            >
              {vehicles.map((v) => (
                <option key={v.vehicle_id} value={v.vehicle_id}>
                  {v.brand} {v.model} ({v.registration_no}) — Current: {v.status}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#93A1B2] mb-1">Scheduled Service Date *</label>
              <input
                type="date"
                required
                value={scheduleData.date}
                onChange={(e) => setScheduleData({ ...scheduleData, date: e.target.value })}
                className="w-full p-2 bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] font-mono focus:outline-none focus:border-[#C7F36B]"
              />
            </div>

            <div>
              <label className="block text-[#93A1B2] mb-1">Estimated Cost (INR) *</label>
              <input
                type="number"
                required
                min={0}
                value={scheduleData.cost}
                onChange={(e) => setScheduleData({ ...scheduleData, cost: parseInt(e.target.value, 10) })}
                className="w-full p-2 bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] font-mono focus:outline-none focus:border-[#C7F36B]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#93A1B2] mb-1">Assigned Technician</label>
            <select
              value={scheduleData.staff_id}
              onChange={(e) => setScheduleData({ ...scheduleData, staff_id: parseInt(e.target.value, 10) })}
              className="w-full p-2 bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA]"
            >
              {maintenanceStaff.map((s) => (
                <option key={s.staff_id} value={s.staff_id}>
                  {s.name} ({s.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#93A1B2] mb-1">Maintenance Scope & Diagnostic Work *</label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Brake pad wear inspection, synthetic engine oil flush, wheel re-alignment..."
              value={scheduleData.description}
              onChange={(e) => setScheduleData({ ...scheduleData, description: e.target.value })}
              className="w-full p-2.5 bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] focus:outline-none focus:border-[#C7F36B]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#263241]">
            <button
              type="button"
              onClick={() => setIsScheduleModalOpen(false)}
              className="px-4 py-2 rounded-lg text-[#93A1B2] hover:text-[#F4F7FA]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#C7F36B] hover:bg-[#b8e55e] text-[#080B10] font-semibold rounded-lg"
            >
              Confirm Schedule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
