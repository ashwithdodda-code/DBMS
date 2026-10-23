import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  ShieldCheck,
  Edit,
  Eye,
  Calendar,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';
import { Customer, Rental, Payment, StaffRole } from '../../types';
import { formatINR, formatDate, maskLicense, getRentalStatusStyle } from '../../utils/formatters';
import { dbStore } from '../../services/dbStore';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../components/common/ToastProvider';

interface CustomerManagementProps {
  customers: Customer[];
  rentals: Rental[];
  payments: Payment[];
  activeRole: StaffRole;
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({
  customers,
  rentals,
  payments,
  activeRole,
}) => {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    driving_license: '',
    address: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.driving_license.toLowerCase().includes(q) ||
        c.customer_id.toString().includes(q)
      );
    });
  }, [customers, search]);

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      driving_license: '',
      address: '',
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      email: c.email,
      phone: c.phone,
      driving_license: c.driving_license,
      address: c.address,
    });
    setFormError(null);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.driving_license.trim()) {
      setFormError('Full name, email, and driving license are mandatory.');
      return;
    }

    try {
      dbStore.addCustomer({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || '+91 99999 00000',
        driving_license: formData.driving_license,
        address: formData.address || 'Local Address',
      });
      showToast(`Customer ${formData.name} successfully registered.`, 'success');
      setIsAddModalOpen(false);
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    try {
      dbStore.updateCustomer(editingCustomer.customer_id, formData);
      showToast(`Customer #${editingCustomer.customer_id} updated.`, 'success');
      setEditingCustomer(null);
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#F4F7FA]">Customer Directory</h1>
          <p className="text-xs text-[#93A1B2]">
            Total {customers.length} registered renters with unique email and driving license enforcement.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-lg bg-[#C7F36B] hover:bg-[#b8e55e] text-[#080B10] text-xs font-semibold flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register Customer</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="p-4 rounded-xl bg-[#121821] border border-[#263241] flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-3.5 h-3.5 text-[#93A1B2] absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search customer name, email, license, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] placeholder-[#93A1B2] focus:outline-none focus:border-[#C7F36B]"
          />
        </div>

        <span className="text-xs text-[#93A1B2] font-mono">
          Showing {filteredCustomers.length} of {customers.length}
        </span>
      </div>

      {/* Customer Table */}
      <div className="bg-[#121821] border border-[#263241] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#F4F7FA]">
            <thead className="bg-[#0D1118] text-[#93A1B2] uppercase text-[10px] font-semibold border-b border-[#263241]">
              <tr>
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Driving License</th>
                <th className="py-3 px-4">Rentals</th>
                <th className="py-3 px-4">Total Spent</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263241]/60">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#93A1B2]">
                    No customers found.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const cRentals = rentals.filter((r) => r.customer_id === c.customer_id);
                  const cSpend = cRentals.reduce((sum, r) => sum + r.total_amount, 0);

                  return (
                    <tr key={c.customer_id} className="hover:bg-[#18212C]/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-[#55D6E8]">#{c.customer_id}</td>
                      <td className="py-3 px-4 font-semibold text-[#F4F7FA]">{c.name}</td>
                      <td className="py-3 px-4 text-[#93A1B2] font-mono">{c.email}</td>
                      <td className="py-3 px-4 font-mono text-[#93A1B2]">{c.phone}</td>
                      <td className="py-3 px-4 font-mono text-slate-300">{maskLicense(c.driving_license)}</td>
                      <td className="py-3 px-4 font-mono font-bold text-[#55D6E8]">{cRentals.length}</td>
                      <td className="py-3 px-4 font-mono font-bold text-[#C7F36B]">{formatINR(cSpend)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingCustomer(c)}
                            className="p-1 text-[#93A1B2] hover:text-[#55D6E8] hover:bg-[#18212C] rounded transition-colors"
                            title="View History"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="p-1 text-[#93A1B2] hover:text-[#C7F36B] hover:bg-[#18212C] rounded transition-colors"
                            title="Edit Customer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
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

      {/* Add Customer Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Customer"
      >
        <form onSubmit={handleSaveAdd} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-[#93A1B2] mb-1">Customer Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Vikramaditya Rao"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2 bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] focus:outline-none focus:border-[#C7F36B]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#93A1B2] mb-1">Email Address (Unique Key) *</label>
              <input
                type="email"
                required
                placeholder="customer@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2 bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] font-mono focus:outline-none focus:border-[#C7F36B]"
              />
            </div>

            <div>
              <label className="block text-[#93A1B2] mb-1">Phone Number *</label>
              <input
                type="text"
                required
                placeholder="+91 98XXX XXXXX"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-2 bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] font-mono focus:outline-none focus:border-[#C7F36B]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#93A1B2] mb-1">Driving License Number (Unique Key) *</label>
            <input
              type="text"
              required
              placeholder="DL-04-2020-XXXXXX"
              value={formData.driving_license}
              onChange={(e) => setFormData({ ...formData, driving_license: e.target.value })}
              className="w-full p-2 bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] font-mono focus:outline-none focus:border-[#C7F36B]"
            />
          </div>

          <div>
            <label className="block text-[#93A1B2] mb-1">Address</label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full p-2 bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] focus:outline-none focus:border-[#C7F36B]"
            />
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
              Register Customer
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <Modal
          isOpen={true}
          onClose={() => setEditingCustomer(null)}
          title={`Edit Customer #${editingCustomer.customer_id} (${editingCustomer.name})`}
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            {formError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-[#93A1B2] mb-1">Customer Full Name</label>
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
                <label className="block text-[#93A1B2] mb-1">Email (Unique)</label>
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
              <label className="block text-[#93A1B2] mb-1">Driving License (Unique)</label>
              <input
                type="text"
                required
                value={formData.driving_license}
                onChange={(e) => setFormData({ ...formData, driving_license: e.target.value })}
                className="w-full p-2 bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] font-mono focus:outline-none focus:border-[#C7F36B]"
              />
            </div>

            <div>
              <label className="block text-[#93A1B2] mb-1">Address</label>
              <textarea
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full p-2 bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] focus:outline-none focus:border-[#C7F36B]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#263241]">
              <button
                type="button"
                onClick={() => setEditingCustomer(null)}
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

      {/* View Customer Details Modal */}
      {viewingCustomer && (
        <Modal
          isOpen={true}
          onClose={() => setViewingCustomer(null)}
          title={`Customer File: ${viewingCustomer.name} (#${viewingCustomer.customer_id})`}
        >
          {(() => {
            const cRentals = rentals.filter((r) => r.customer_id === viewingCustomer.customer_id);
            const cPayments = payments.filter((p) =>
              cRentals.some((r) => r.rental_id === p.rental_id)
            );

            return (
              <div className="space-y-5 text-xs text-[#F4F7FA]">
                <div className="p-3 rounded-lg bg-[#0D1118] border border-[#263241] grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[#93A1B2] text-[10px] uppercase">Email & Phone</span>
                    <p className="font-semibold">{viewingCustomer.email}</p>
                    <p className="font-mono text-[#93A1B2]">{viewingCustomer.phone}</p>
                  </div>
                  <div>
                    <span className="text-[#93A1B2] text-[10px] uppercase">Driving License</span>
                    <p className="font-mono text-[#55D6E8]">{viewingCustomer.driving_license}</p>
                    <p className="text-[#93A1B2] text-[10px]">Since: {formatDate(viewingCustomer.created_at)}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-[#F4F7FA] mb-2 uppercase text-[10px] tracking-wider">
                    Rental History ({cRentals.length})
                  </h4>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {cRentals.length === 0 ? (
                      <p className="text-[#93A1B2] py-2">No bookings recorded.</p>
                    ) : (
                      cRentals.map((r) => (
                        <div key={r.rental_id} className="p-2.5 rounded bg-[#0D1118] border border-[#263241] flex justify-between items-center">
                          <div>
                            <span className="font-mono font-semibold text-[#55D6E8]">Rental #{r.rental_id}</span>
                            <span className="ml-2 text-[#93A1B2]">{r.rental_date} → {r.return_date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getRentalStatusStyle(r.status)}`}>
                              {r.status}
                            </span>
                            <span className="font-mono font-bold text-[#C7F36B]">{formatINR(r.total_amount)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-[#F4F7FA] mb-2 uppercase text-[10px] tracking-wider">
                    Payment Transactions ({cPayments.length})
                  </h4>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {cPayments.length === 0 ? (
                      <p className="text-[#93A1B2] py-2">No transactions recorded.</p>
                    ) : (
                      cPayments.map((p) => (
                        <div key={p.payment_id} className="p-2 rounded bg-[#0D1118] border border-[#263241] flex justify-between items-center">
                          <div>
                            <span className="font-mono text-[#F4F7FA]">{p.transaction_reference}</span>
                            <span className="ml-2 text-[#93A1B2]">({p.method})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[#C7F36B] font-semibold">{p.status}</span>
                            <span className="font-mono font-bold">{formatINR(p.amount)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}
    </div>
  );
};
