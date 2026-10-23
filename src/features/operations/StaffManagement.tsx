import React, { useState } from 'react';
import {
  UserCheck,
  Plus,
  Shield,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  Edit,
  Lock,
} from 'lucide-react';
import { Staff, StaffRole } from '../../types';
import { dbStore } from '../../services/dbStore';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../components/common/ToastProvider';

interface StaffManagementProps {
  staff: Staff[];
  activeRole: StaffRole;
}

export const StaffManagement: React.FC<StaffManagementProps> = ({ staff, activeRole }) => {
  const { showToast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Rental Agent' as StaffRole,
    active: true,
  });

  const handleToggleActive = (s: Staff) => {
    try {
      dbStore.updateStaff(s.staff_id, { active: !s.active });
      showToast(`Staff #${s.staff_id} status changed to ${!s.active ? 'Active' : 'Inactive'}.`, 'info');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    try {
      dbStore.updateStaff(editingStaff.staff_id, formData);
      showToast(`Staff member #${editingStaff.staff_id} updated.`, 'success');
      setEditingStaff(null);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#F4F7FA]">Staff & Role-Based Access Control (RBAC)</h1>
          <p className="text-xs text-[#93A1B2]">
            Enterprise internal personnel mapped to the <code>STAFF</code> relation with role hierarchies.
          </p>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-[#121821] border border-[#263241] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#F4F7FA]">
            <thead className="bg-[#0D1118] text-[#93A1B2] uppercase text-[10px] font-semibold border-b border-[#263241]">
              <tr>
                <th className="py-3 px-4">Staff ID</th>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Internal Email</th>
                <th className="py-3 px-4">Direct Phone</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263241]/60">
              {staff.map((s) => (
                <tr key={s.staff_id} className="hover:bg-[#18212C]/50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-[#55D6E8]">#{s.staff_id}</td>
                  <td className="py-3 px-4 font-semibold text-[#F4F7FA]">{s.name}</td>
                  <td className="py-3 px-4 font-mono text-[#93A1B2]">{s.email}</td>
                  <td className="py-3 px-4 font-mono text-[#93A1B2]">{s.phone}</td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#18212C] text-[#C7F36B] border border-[#C7F36B]/20">
                      {s.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleToggleActive(s)}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded border transition-colors ${
                        s.active
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}
                      title="Click to toggle active state"
                    >
                      {s.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => {
                        setEditingStaff(s);
                        setFormData({
                          name: s.name,
                          email: s.email,
                          phone: s.phone,
                          role: s.role,
                          active: s.active,
                        });
                      }}
                      className="p-1 text-[#93A1B2] hover:text-[#C7F36B] hover:bg-[#18212C] rounded transition-colors"
                      title="Edit Staff Member"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Permission Matrix Card */}
      <div className="bg-[#121821] border border-[#263241] rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#263241]">
          <Shield className="w-4 h-4 text-[#C7F36B]" />
          <h3 className="text-xs font-bold text-[#F4F7FA] uppercase tracking-wider">
            RBAC Permission Enforcement Matrix
          </h3>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-[#0D1118] border border-[#263241] space-y-2">
            <span className="font-bold text-[#C7F36B] font-mono text-sm">Admin</span>
            <p className="text-[11px] text-[#93A1B2]">
              Full unrestricted read and write privileges across all fleet, financial, audit, and DBMS subsystems.
            </p>
            <div className="pt-2 border-t border-[#263241] text-[10px] font-mono text-emerald-400">
              Access: All 12 Modules
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0D1118] border border-[#263241] space-y-2">
            <span className="font-bold text-[#55D6E8] font-mono text-sm">Manager</span>
            <p className="text-[11px] text-[#93A1B2]">
              Operational oversight across fleet, rentals, customers, payments, and financial analytics reports.
            </p>
            <div className="pt-2 border-t border-[#263241] text-[10px] font-mono text-[#55D6E8]">
              Access: Operations & Reports
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0D1118] border border-[#263241] space-y-2">
            <span className="font-bold text-amber-400 font-mono text-sm">Rental Agent</span>
            <p className="text-[11px] text-[#93A1B2]">
              Customer verification, dispatch pickup confirmation, vehicle intake, and booking scheduling.
            </p>
            <div className="pt-2 border-t border-[#263241] text-[10px] font-mono text-amber-400">
              Access: Front Desk & Bookings
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0D1118] border border-[#263241] space-y-2">
            <span className="font-bold text-rose-400 font-mono text-sm">Maintenance Staff</span>
            <p className="text-[11px] text-[#93A1B2]">
              Dedicated service bay operations, vehicle health status, work order logging, and parts cost audits.
            </p>
            <div className="pt-2 border-t border-[#263241] text-[10px] font-mono text-rose-400">
              Access: Workshop Bay Only
            </div>
          </div>
        </div>
      </div>

      {/* Edit Staff Modal */}
      {editingStaff && (
        <Modal
          isOpen={true}
          onClose={() => setEditingStaff(null)}
          title={`Edit Staff Member #${editingStaff.staff_id}`}
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            <div>
              <label className="block text-[#93A1B2] mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] focus:outline-none focus:border-[#C7F36B]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#93A1B2] mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2 bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] font-mono focus:outline-none focus:border-[#C7F36B]"
                />
              </div>

              <div>
                <label className="block text-[#93A1B2] mb-1">Phone</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2 bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] font-mono focus:outline-none focus:border-[#C7F36B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#93A1B2] mb-1">Assigned Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full p-2 bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA]"
              >
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Rental Agent">Rental Agent</option>
                <option value="Maintenance Staff">Maintenance Staff</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#263241]">
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="px-4 py-2 rounded-lg text-[#93A1B2] hover:text-[#F4F7FA]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#C7F36B] hover:bg-[#b8e55e] text-[#080B10] font-semibold rounded-lg"
              >
                Save Staff Changes
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
