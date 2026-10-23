import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  Filter,
  Download,
  Printer,
  TrendingUp,
  Car,
  CreditCard,
  Wrench,
  Users,
} from 'lucide-react';
import { Vehicle, Customer, Rental, Payment, Maintenance, StaffRole } from '../../types';
import { formatINR, formatDate } from '../../utils/formatters';
import { useToast } from '../../components/common/ToastProvider';

interface ReportsAnalyticsProps {
  vehicles: Vehicle[];
  customers: Customer[];
  rentals: Rental[];
  payments: Payment[];
  maintenance: Maintenance[];
  activeRole: StaffRole;
}

export const ReportsAnalytics: React.FC<ReportsAnalyticsProps> = ({
  vehicles,
  customers,
  rentals,
  payments,
  maintenance,
}) => {
  const { showToast } = useToast();

  const [activeReportTab, setActiveReportTab] = useState<'revenue' | 'utilization' | 'maintenance' | 'customers'>('revenue');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Accounting aggregates
  const completedGross = payments
    .filter((p) => p.status === 'Completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const refundedGross = payments
    .filter((p) => p.status === 'Refunded')
    .reduce((sum, p) => sum + p.amount, 0);

  const netCollectedRevenue = completedGross - refundedGross;

  const totalMaintenanceCost = maintenance.reduce((sum, m) => sum + m.cost, 0);
  const totalRentalsCount = rentals.length;

  const handleExportReportCSV = () => {
    let headers: string[] = [];
    let rows: string[] = [];

    if (activeReportTab === 'revenue') {
      headers = ['Payment_ID', 'Rental_ID', 'Amount_INR', 'Method', 'Status', 'Date'];
      rows = payments.map((p) => [p.payment_id, p.rental_id, p.amount, p.method, p.status, p.payment_date].join(','));
    } else if (activeReportTab === 'utilization') {
      headers = ['Vehicle_ID', 'Brand_Model', 'Category', 'Rental_Rate', 'Status', 'Total_Bookings'];
      rows = vehicles.map((v) => {
        const count = rentals.filter((r) => r.vehicle_id === v.vehicle_id).length;
        return [v.vehicle_id, `"${v.brand} ${v.model}"`, v.vehicle_type, v.rental_rate, v.status, count].join(',');
      });
    } else if (activeReportTab === 'maintenance') {
      headers = ['Job_ID', 'Vehicle_ID', 'Date', 'Cost_INR', 'Status', 'Description'];
      rows = maintenance.map((m) => [m.maintenance_id, m.vehicle_id, m.date, m.cost, m.status, `"${m.description}"`].join(','));
    } else {
      headers = ['Customer_ID', 'Name', 'Email', 'Bookings_Count', 'Total_Spend_INR'];
      rows = customers.map((c) => {
        const cRentals = rentals.filter((r) => r.customer_id === c.customer_id);
        const spend = cRentals.reduce((sum, r) => sum + r.total_amount, 0);
        return [c.customer_id, `"${c.name}"`, c.email, cRentals.length, spend].join(',');
      });
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `velocity_report_${activeReportTab}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${activeReportTab} audit report to CSV.`, 'info');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#F4F7FA]">Operations Analytics & Business Intelligence</h1>
          <p className="text-xs text-[#93A1B2]">
            Audited financial, utilization, and maintenance reports grounded in relational database facts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-lg bg-[#18212C] hover:bg-[#263241] border border-[#263241] text-[#F4F7FA] text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-[#93A1B2]" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleExportReportCSV}
            className="px-3.5 py-2 rounded-lg bg-[#C7F36B] hover:bg-[#b8e55e] text-[#080B10] text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#121821] border border-[#263241]">
          <span className="text-[11px] text-[#93A1B2]">Audited Net Revenue</span>
          <p className="text-2xl font-bold font-mono text-[#C7F36B] mt-1 tabular-nums">{formatINR(netCollectedRevenue)}</p>
          <p className="text-[10px] text-[#93A1B2] mt-1">₹{refundedGross.toLocaleString()} refunds deducted</p>
        </div>

        <div className="p-4 rounded-xl bg-[#121821] border border-[#263241]">
          <span className="text-[11px] text-[#93A1B2]">Total Bookings Recorded</span>
          <p className="text-2xl font-bold font-mono text-[#55D6E8] mt-1 tabular-nums">{totalRentalsCount}</p>
          <p className="text-[10px] text-[#55D6E8] mt-1">Across all categories</p>
        </div>

        <div className="p-4 rounded-xl bg-[#121821] border border-[#263241]">
          <span className="text-[11px] text-[#93A1B2]">Workshop Maintenance Costs</span>
          <p className="text-2xl font-bold font-mono text-rose-400 mt-1 tabular-nums">{formatINR(totalMaintenanceCost)}</p>
          <p className="text-[10px] text-rose-400/80 mt-1">{maintenance.length} jobs serviced</p>
        </div>

        <div className="p-4 rounded-xl bg-[#121821] border border-[#263241]">
          <span className="text-[11px] text-[#93A1B2]">Active Fleet Rented</span>
          <p className="text-2xl font-bold font-mono text-amber-400 mt-1 tabular-nums">
            {vehicles.filter((v) => v.status === 'Rented').length} / {vehicles.length}
          </p>
          <p className="text-[10px] text-[#93A1B2] mt-1">
            {Math.round((vehicles.filter((v) => v.status === 'Rented').length / vehicles.length) * 100)}% active utilization
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#263241] pb-3">
        {[
          { id: 'revenue', label: 'Revenue & Payments', icon: CreditCard },
          { id: 'utilization', label: 'Fleet Utilization', icon: Car },
          { id: 'maintenance', label: 'Workshop Expenses', icon: Wrench },
          { id: 'customers', label: 'Customer Cohorts', icon: Users },
        ].map((t) => {
          const Icon = t.icon;
          const isCurr = activeReportTab === t.id;

          return (
            <button
              key={t.id}
              onClick={() => setActiveReportTab(t.id as any)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                isCurr
                  ? 'bg-[#18212C] text-[#C7F36B] border border-[#C7F36B]/30'
                  : 'text-[#93A1B2] hover:text-[#F4F7FA] hover:bg-[#121821]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Revenue & Payments Table */}
      {activeReportTab === 'revenue' && (
        <div className="bg-[#121821] border border-[#263241] rounded-xl overflow-hidden shadow-xl">
          <div className="p-4 bg-[#0D1118] border-b border-[#263241] flex justify-between items-center text-xs">
            <span className="font-bold text-[#F4F7FA]">Detailed Financial Ledger</span>
            <span className="text-[#93A1B2] font-mono">{payments.length} Transaction Records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#F4F7FA]">
              <thead className="bg-[#080B10] text-[#93A1B2] uppercase text-[10px] font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Txn Ref</th>
                  <th className="py-2.5 px-4">Rental ID</th>
                  <th className="py-2.5 px-4">Amount</th>
                  <th className="py-2.5 px-4">Method</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#263241]/60">
                {payments.map((p) => (
                  <tr key={p.payment_id} className="hover:bg-[#18212C]/40">
                    <td className="py-2.5 px-4 font-mono text-[#55D6E8]">{p.transaction_reference}</td>
                    <td className="py-2.5 px-4 font-mono">#{p.rental_id}</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-[#C7F36B]">{formatINR(p.amount)}</td>
                    <td className="py-2.5 px-4">{p.method}</td>
                    <td className="py-2.5 px-4">
                      <span className="font-semibold text-xs text-[#F4F7FA]">{p.status}</span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[#93A1B2] text-[11px]">{formatDate(p.payment_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Fleet Utilization Table */}
      {activeReportTab === 'utilization' && (
        <div className="bg-[#121821] border border-[#263241] rounded-xl overflow-hidden shadow-xl">
          <div className="p-4 bg-[#0D1118] border-b border-[#263241] flex justify-between items-center text-xs">
            <span className="font-bold text-[#F4F7FA]">Vehicle Utilization Metrics</span>
            <span className="text-[#93A1B2] font-mono">{vehicles.length} Fleet Items</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#F4F7FA]">
              <thead className="bg-[#080B10] text-[#93A1B2] uppercase text-[10px] font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Vehicle</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Daily Rate</th>
                  <th className="py-2.5 px-4">Operational Status</th>
                  <th className="py-2.5 px-4">Historical Bookings</th>
                  <th className="py-2.5 px-4">Total Revenue Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#263241]/60">
                {vehicles.map((v) => {
                  const vRentals = rentals.filter((r) => r.vehicle_id === v.vehicle_id);
                  const revenue = vRentals.reduce((sum, r) => sum + r.total_amount, 0);

                  return (
                    <tr key={v.vehicle_id} className="hover:bg-[#18212C]/40">
                      <td className="py-2.5 px-4">
                        <span className="font-bold">{v.brand} {v.model}</span>
                        <span className="block text-[10px] font-mono text-[#93A1B2]">{v.registration_no}</span>
                      </td>
                      <td className="py-2.5 px-4 text-[#93A1B2]">{v.vehicle_type}</td>
                      <td className="py-2.5 px-4 font-mono font-bold text-[#C7F36B]">{formatINR(v.rental_rate)}</td>
                      <td className="py-2.5 px-4">
                        <span className="text-xs font-semibold">{v.status}</span>
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-[#55D6E8]">{vRentals.length}</td>
                      <td className="py-2.5 px-4 font-mono font-bold text-[#C7F36B]">{formatINR(revenue)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Maintenance Expenses */}
      {activeReportTab === 'maintenance' && (
        <div className="bg-[#121821] border border-[#263241] rounded-xl overflow-hidden shadow-xl">
          <div className="p-4 bg-[#0D1118] border-b border-[#263241] flex justify-between items-center text-xs">
            <span className="font-bold text-[#F4F7FA]">Workshop Service Expenses</span>
            <span className="text-[#93A1B2] font-mono">Total {formatINR(totalMaintenanceCost)}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#F4F7FA]">
              <thead className="bg-[#080B10] text-[#93A1B2] uppercase text-[10px] font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Job ID</th>
                  <th className="py-2.5 px-4">Vehicle ID</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Cost</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Service Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#263241]/60">
                {maintenance.map((m) => (
                  <tr key={m.maintenance_id} className="hover:bg-[#18212C]/40">
                    <td className="py-2.5 px-4 font-mono font-bold text-[#55D6E8]">#{m.maintenance_id}</td>
                    <td className="py-2.5 px-4 font-mono">Vehicle #{m.vehicle_id}</td>
                    <td className="py-2.5 px-4 font-mono text-[#93A1B2]">{m.date}</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-rose-400">{formatINR(m.cost)}</td>
                    <td className="py-2.5 px-4 font-semibold">{m.status}</td>
                    <td className="py-2.5 px-4 text-[#93A1B2]">{m.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Customer Cohorts */}
      {activeReportTab === 'customers' && (
        <div className="bg-[#121821] border border-[#263241] rounded-xl overflow-hidden shadow-xl">
          <div className="p-4 bg-[#0D1118] border-b border-[#263241] flex justify-between items-center text-xs">
            <span className="font-bold text-[#F4F7FA]">Customer Lifetime Value (LTV)</span>
            <span className="text-[#93A1B2] font-mono">{customers.length} Accounts</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#F4F7FA]">
              <thead className="bg-[#080B10] text-[#93A1B2] uppercase text-[10px] font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Customer ID</th>
                  <th className="py-2.5 px-4">Name</th>
                  <th className="py-2.5 px-4">Email</th>
                  <th className="py-2.5 px-4">Rentals Count</th>
                  <th className="py-2.5 px-4">Lifetime Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#263241]/60">
                {customers.map((c) => {
                  const cRentals = rentals.filter((r) => r.customer_id === c.customer_id);
                  const cSpend = cRentals.reduce((sum, r) => sum + r.total_amount, 0);

                  return (
                    <tr key={c.customer_id} className="hover:bg-[#18212C]/40">
                      <td className="py-2.5 px-4 font-mono text-[#55D6E8]">#{c.customer_id}</td>
                      <td className="py-2.5 px-4 font-bold">{c.name}</td>
                      <td className="py-2.5 px-4 font-mono text-[#93A1B2]">{c.email}</td>
                      <td className="py-2.5 px-4 font-mono font-bold text-[#55D6E8]">{cRentals.length}</td>
                      <td className="py-2.5 px-4 font-mono font-bold text-[#C7F36B]">{formatINR(cSpend)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
