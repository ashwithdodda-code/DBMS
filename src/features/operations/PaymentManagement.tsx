import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  Plus,
  RotateCcw,
  Printer,
  Download,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Undo2,
} from 'lucide-react';
import { Payment, Rental, Customer, StaffRole } from '../../types';
import { formatINR, formatDateTime, getPaymentStatusStyle } from '../../utils/formatters';
import { dbStore } from '../../services/dbStore';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../components/common/ToastProvider';

interface PaymentManagementProps {
  payments: Payment[];
  rentals: Rental[];
  customers: Customer[];
  activeRole: StaffRole;
}

export const PaymentManagement: React.FC<PaymentManagementProps> = ({
  payments,
  rentals,
  customers,
  activeRole,
}) => {
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [methodFilter, setMethodFilter] = useState<string>('All');

  // Modals
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [refundingPayment, setRefundingPayment] = useState<Payment | null>(null);
  const [refundReason, setRefundReason] = useState('Customer cancelled reservation prior to pickup.');
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);

  // New Payment Form
  const [newRentalId, setNewRentalId] = useState<number>(rentals[0]?.rental_id || 7001);
  const [newAmount, setNewAmount] = useState<number>(5000);
  const [newMethod, setNewMethod] = useState<Payment['method']>('UPI');
  const [newStatus, setNewStatus] = useState<Payment['status']>('Completed');
  const [formError, setFormError] = useState<string | null>(null);

  // Derived Financial Ledger Metrics
  const completedRevenue = payments
    .filter((p) => p.status === 'Completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingAmount = payments
    .filter((p) => p.status === 'Pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const refundedAmount = payments
    .filter((p) => p.status === 'Refunded')
    .reduce((sum, p) => sum + p.amount, 0);

  const netRevenue = completedRevenue - refundedAmount;

  const filteredPayments = useMemo(() => {
    return payments
      .filter((p) => {
        if (statusFilter !== 'All' && p.status !== statusFilter) return false;
        if (methodFilter !== 'All' && p.method !== methodFilter) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchId = p.payment_id.toString().includes(q);
          const matchRef = p.transaction_reference.toLowerCase().includes(q);
          const matchRental = p.rental_id.toString().includes(q);
          if (!matchId && !matchRef && !matchRental) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [payments, statusFilter, methodFilter, search]);

  const handleCreatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAmount <= 0) {
      setFormError('Amount must be greater than zero.');
      return;
    }

    try {
      dbStore.recordPayment({
        rental_id: newRentalId,
        amount: newAmount,
        method: newMethod,
        status: newStatus,
      });
      showToast(`Payment recorded for Rental #${newRentalId}.`, 'success');
      setIsRecordModalOpen(false);
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handleRetryPayment = (paymentId: number) => {
    try {
      dbStore.retryPayment(paymentId);
      showToast(`Transaction #${paymentId} retried and completed.`, 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleConfirmRefund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundingPayment) return;

    try {
      dbStore.refundPayment(refundingPayment.payment_id, refundReason);
      showToast(`Refund processed for Payment #${refundingPayment.payment_id}.`, 'info');
      setRefundingPayment(null);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Payment_ID', 'Rental_ID', 'Amount_INR', 'Method', 'Status', 'Transaction_Ref', 'Timestamp'];
    const rows = filteredPayments.map((p) => [
      p.payment_id,
      p.rental_id,
      p.amount,
      p.method,
      p.status,
      `"${p.transaction_reference}"`,
      p.payment_date,
    ].join(','));

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `velocity_payments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Payment ledger exported to CSV.', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#F4F7FA]">Payment Ledger & Cash Flow</h1>
          <p className="text-xs text-[#93A1B2]">
            Auditable transaction ledger linking to the <code>PAYMENT</code> and <code>RENTAL</code> relations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-lg bg-[#18212C] hover:bg-[#263241] border border-[#263241] text-[#F4F7FA] text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-[#C7F36B]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              setNewRentalId(rentals[0]?.rental_id || 7001);
              setNewAmount(5000);
              setFormError(null);
              setIsRecordModalOpen(true);
            }}
            className="px-4 py-2 rounded-lg bg-[#C7F36B] hover:bg-[#b8e55e] text-[#080B10] text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#121821] border border-[#263241]">
          <span className="text-[11px] text-[#93A1B2]">Net Realized Revenue</span>
          <p className="text-2xl font-bold font-mono text-[#C7F36B] mt-1 tabular-nums">{formatINR(netRevenue)}</p>
          <p className="text-[10px] text-[#93A1B2] mt-1">Completed minus refunds</p>
        </div>

        <div className="p-4 rounded-xl bg-[#121821] border border-[#263241]">
          <span className="text-[11px] text-[#93A1B2]">Gross Captured</span>
          <p className="text-2xl font-bold font-mono text-[#F4F7FA] mt-1 tabular-nums">{formatINR(completedRevenue)}</p>
          <p className="text-[10px] text-emerald-400 mt-1">{payments.filter((p) => p.status === 'Completed').length} transactions</p>
        </div>

        <div className="p-4 rounded-xl bg-[#121821] border border-[#263241]">
          <span className="text-[11px] text-[#93A1B2]">Pending Balance</span>
          <p className="text-2xl font-bold font-mono text-amber-400 mt-1 tabular-nums">{formatINR(pendingAmount)}</p>
          <p className="text-[10px] text-amber-400/80 mt-1">Pay-at-hub pending</p>
        </div>

        <div className="p-4 rounded-xl bg-[#121821] border border-[#263241]">
          <span className="text-[11px] text-[#93A1B2]">Total Refunded</span>
          <p className="text-2xl font-bold font-mono text-[#55D6E8] mt-1 tabular-nums">{formatINR(refundedAmount)}</p>
          <p className="text-[10px] text-[#93A1B2] mt-1">Audited reversals</p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-4 rounded-xl bg-[#121821] border border-[#263241] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-[#93A1B2] absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search payment ID, ref, or rental ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] placeholder-[#93A1B2] focus:outline-none focus:border-[#C7F36B]"
          />
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          <div className="flex items-center gap-1.5 text-xs text-[#93A1B2]">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#0D1118] text-[#F4F7FA] border border-[#263241] rounded-lg p-1.5 text-xs"
            >
              <option value="All">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
              <option value="Refunded">Refunded</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#93A1B2]">
            <span>Method:</span>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="bg-[#0D1118] text-[#F4F7FA] border border-[#263241] rounded-lg p-1.5 text-xs"
            >
              <option value="All">All Methods</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payment Table */}
      <div className="bg-[#121821] border border-[#263241] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#F4F7FA]">
            <thead className="bg-[#0D1118] text-[#93A1B2] uppercase text-[10px] font-semibold border-b border-[#263241]">
              <tr>
                <th className="py-3 px-4">Payment ID</th>
                <th className="py-3 px-4">Rental Link</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Transaction Reference</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263241]/60">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#93A1B2]">
                    No payments found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.payment_id} className="hover:bg-[#18212C]/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#55D6E8]">#{p.payment_id}</td>
                    <td className="py-3 px-4 font-mono text-[#93A1B2]">
                      <span>Rental #{p.rental_id}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#C7F36B]">{formatINR(p.amount)}</td>
                    <td className="py-3 px-4 text-[#F4F7FA]">{p.method}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getPaymentStatusStyle(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#93A1B2]">{p.transaction_reference}</td>
                    <td className="py-3 px-4 font-mono text-[#93A1B2] text-[11px]">{formatDateTime(p.payment_date)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setReceiptPayment(p)}
                          className="p-1 text-[#93A1B2] hover:text-[#55D6E8] hover:bg-[#18212C] rounded transition-colors"
                          title="Print Receipt"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {p.status === 'Failed' && (
                          <button
                            onClick={() => handleRetryPayment(p.payment_id)}
                            className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-[10px] font-semibold transition-colors flex items-center gap-1"
                            title="Retry failed payment"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Retry</span>
                          </button>
                        )}

                        {p.status === 'Completed' && (
                          <button
                            onClick={() => setRefundingPayment(p)}
                            className="px-2 py-1 bg-[#18212C] hover:bg-[#263241] text-[#55D6E8] border border-[#263241] rounded text-[10px] font-semibold transition-colors flex items-center gap-1"
                            title="Process auditable refund"
                          >
                            <Undo2 className="w-3 h-3" />
                            <span>Refund</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        title="Record Payment in Ledger"
      >
        <form onSubmit={handleCreatePayment} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-[#93A1B2] mb-1">Target Rental ID *</label>
            <select
              value={newRentalId}
              onChange={(e) => {
                const rId = parseInt(e.target.value, 10);
                setNewRentalId(rId);
                const r = rentals.find((item) => item.rental_id === rId);
                if (r) setNewAmount(r.total_amount);
              }}
              className="w-full p-2 bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] font-mono"
            >
              {rentals.map((r) => (
                <option key={r.rental_id} value={r.rental_id}>
                  Rental #{r.rental_id} ({r.rental_date}) — Total: {formatINR(r.total_amount)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#93A1B2] mb-1">Amount (INR) *</label>
              <input
                type="number"
                required
                min={1}
                value={newAmount}
                onChange={(e) => setNewAmount(parseInt(e.target.value, 10))}
                className="w-full p-2 bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] font-mono focus:outline-none focus:border-[#C7F36B]"
              />
            </div>

            <div>
              <label className="block text-[#93A1B2] mb-1">Payment Method</label>
              <select
                value={newMethod}
                onChange={(e) => setNewMethod(e.target.value as any)}
                className="w-full p-2 bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA]"
              >
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[#93A1B2] mb-1">Initial Transaction Status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as any)}
              className="w-full p-2 bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA]"
            >
              <option value="Completed">Completed (Captures Cash Flow)</option>
              <option value="Pending">Pending (Awaiting Collection)</option>
              <option value="Failed">Failed (Card Decline Test)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#263241]">
            <button
              type="button"
              onClick={() => setIsRecordModalOpen(false)}
              className="px-4 py-2 rounded-lg text-[#93A1B2] hover:text-[#F4F7FA]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#C7F36B] hover:bg-[#b8e55e] text-[#080B10] font-semibold rounded-lg"
            >
              Save Transaction
            </button>
          </div>
        </form>
      </Modal>

      {/* Process Refund Modal */}
      {refundingPayment && (
        <Modal
          isOpen={true}
          onClose={() => setRefundingPayment(null)}
          title={`Process Refund: Payment #${refundingPayment.payment_id} (${formatINR(refundingPayment.amount)})`}
        >
          <form onSubmit={handleConfirmRefund} className="space-y-4 text-xs">
            <p className="text-[#93A1B2]">
              Refunding deducts {formatINR(refundingPayment.amount)} from collected revenue and generates an immutable audit event in <code>AUDIT_LOG</code>.
            </p>

            <div>
              <label className="block text-[#93A1B2] mb-1">Refund Justification / Reason *</label>
              <textarea
                rows={3}
                required
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full p-2.5 bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] focus:outline-none focus:border-[#C7F36B]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#263241]">
              <button
                type="button"
                onClick={() => setRefundingPayment(null)}
                className="px-4 py-2 rounded-lg text-[#93A1B2] hover:text-[#F4F7FA]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-rose-500 hover:bg-rose-400 text-white font-semibold rounded-lg"
              >
                Confirm Refund
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Receipt Modal */}
      {receiptPayment && (
        <Modal
          isOpen={true}
          onClose={() => setReceiptPayment(null)}
          title={`Payment Receipt #${receiptPayment.payment_id}`}
        >
          <div className="space-y-4 text-xs text-[#F4F7FA]">
            <div className="flex justify-between items-start pb-3 border-b border-[#263241]">
              <div>
                <span className="font-bold text-sm text-[#C7F36B]">VELOCITY OS</span>
                <p className="text-[#93A1B2]">Electronic Tax Invoice</p>
              </div>
              <div className="text-right font-mono">
                <p>Ref: {receiptPayment.transaction_reference}</p>
                <p className="text-[#93A1B2]">{formatDateTime(receiptPayment.payment_date)}</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#0D1118] border border-[#263241] space-y-2 font-mono">
              <div className="flex justify-between">
                <span>Payment ID</span>
                <span>#{receiptPayment.payment_id}</span>
              </div>
              <div className="flex justify-between">
                <span>Linked Rental</span>
                <span>#{receiptPayment.rental_id}</span>
              </div>
              <div className="flex justify-between">
                <span>Method</span>
                <span>{receiptPayment.method}</span>
              </div>
              <div className="flex justify-between">
                <span>Status</span>
                <span className="text-[#C7F36B]">{receiptPayment.status}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#263241] font-bold text-sm">
                <span>Amount</span>
                <span className="text-[#C7F36B]">{formatINR(receiptPayment.amount)}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#C7F36B] text-[#080B10] font-semibold rounded-lg flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
