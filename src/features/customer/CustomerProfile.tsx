import React, { useState } from 'react';
import { User, Mail, Phone, ShieldCheck, MapPin, Calendar, CreditCard, Save } from 'lucide-react';
import { Customer, Rental, Payment } from '../../types';
import { formatINR, maskLicense, formatDate } from '../../utils/formatters';
import { dbStore } from '../../services/dbStore';
import { useToast } from '../../components/common/ToastProvider';

interface CustomerProfileProps {
  customers: Customer[];
  rentals: Rental[];
  payments: Payment[];
  activeCustomerId: number;
}

export const CustomerProfile: React.FC<CustomerProfileProps> = ({
  customers,
  rentals,
  payments,
  activeCustomerId,
}) => {
  const { showToast } = useToast();
  const [selectedId, setSelectedId] = useState<number>(activeCustomerId || 1001);

  const customer = customers.find((c) => c.customer_id === selectedId) || customers[0];

  const [phone, setPhone] = useState(customer.phone);
  const [address, setAddress] = useState(customer.address);

  // Sync state if persona changes
  const handleSelectPersona = (id: number) => {
    setSelectedId(id);
    dbStore.setActiveCustomerId(id);
    const target = customers.find((c) => c.customer_id === id);
    if (target) {
      setPhone(target.phone);
      setAddress(target.address);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      dbStore.updateCustomer(customer.customer_id, {
        phone,
        address,
      });
      showToast('Profile updated successfully.', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Metrics for this customer
  const myRentals = rentals.filter((r) => r.customer_id === customer.customer_id);
  const myCompletedRentals = myRentals.filter((r) => r.status === 'Completed' || r.status === 'Active');
  const myTotalSpend = myRentals.reduce((sum, r) => sum + r.total_amount, 0);

  return (
    <div className="min-h-screen bg-[#080B10] text-[#F4F7FA] py-8 px-6 max-w-5xl mx-auto">
      {/* Header & Persona Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#263241]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F4F7FA]">Customer Profile</h1>
          <p className="text-xs text-[#93A1B2]">Manage verified identity, driving licenses, and contact information</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#93A1B2]">Switch Persona:</span>
          <select
            value={selectedId}
            onChange={(e) => handleSelectPersona(parseInt(e.target.value, 10))}
            className="text-xs bg-[#121821] text-[#F4F7FA] border border-[#263241] rounded-lg p-2 font-medium focus:outline-none focus:border-[#C7F36B]"
          >
            {customers.map((c) => (
              <option key={c.customer_id} value={c.customer_id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-1 bg-[#121821] border border-[#263241] rounded-xl p-6 space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-[#18212C] border-2 border-[#C7F36B] flex items-center justify-center text-[#C7F36B] mx-auto text-xl font-bold font-mono">
              {customer.name.slice(0, 2).toUpperCase()}
            </div>
            <h2 className="text-base font-bold text-[#F4F7FA] mt-3">{customer.name}</h2>
            <p className="text-xs text-[#93A1B2] font-mono">ID #{customer.customer_id}</p>
          </div>

          <div className="p-3 rounded-lg bg-[#0D1118] border border-[#263241] space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[#93A1B2]">Account Created</span>
              <span className="font-mono text-[#F4F7FA]">{formatDate(customer.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#93A1B2]">Lifetime Bookings</span>
              <span className="font-mono font-bold text-[#55D6E8]">{myRentals.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#93A1B2]">Total Spent</span>
              <span className="font-mono font-bold text-[#C7F36B]">{formatINR(myTotalSpend)}</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>KYC & Driving License Verified</span>
          </div>
        </div>

        {/* Edit Info Form */}
        <div className="md:col-span-2 bg-[#121821] border border-[#263241] rounded-xl p-6">
          <h3 className="text-base font-bold text-[#F4F7FA] mb-4">Personal & Verified Credentials</h3>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#93A1B2] mb-1">Full Name</label>
                <input
                  type="text"
                  disabled
                  value={customer.name}
                  className="w-full p-2.5 bg-[#0D1118] border border-[#263241] rounded-lg text-slate-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[#93A1B2] mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={customer.email}
                  className="w-full p-2.5 bg-[#0D1118] border border-[#263241] rounded-lg text-slate-400 cursor-not-allowed font-mono"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#93A1B2] mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] font-mono focus:outline-none focus:border-[#C7F36B]"
                />
              </div>

              <div>
                <label className="block text-[#93A1B2] mb-1">Driving License (Masked Display)</label>
                <input
                  type="text"
                  disabled
                  value={maskLicense(customer.driving_license)}
                  className="w-full p-2.5 bg-[#0D1118] border border-[#263241] rounded-lg text-[#55D6E8] font-mono cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#93A1B2] mb-1">Registered Address</label>
              <textarea
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2.5 bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] focus:outline-none focus:border-[#C7F36B]"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#C7F36B] hover:bg-[#b8e55e] text-[#080B10] font-semibold rounded-lg flex items-center gap-2 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
