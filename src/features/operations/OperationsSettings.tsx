import React, { useState } from 'react';
import {
  Settings,
  RotateCcw,
  Shield,
  Percent,
  Database,
  Save,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { AppSettings, StaffRole } from '../../types';
import { dbStore } from '../../services/dbStore';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { useToast } from '../../components/common/ToastProvider';

interface OperationsSettingsProps {
  settings: AppSettings;
  activeRole: StaffRole;
}

export const OperationsSettings: React.FC<OperationsSettingsProps> = ({ settings }) => {
  const { showToast } = useToast();

  const [taxRate, setTaxRate] = useState<number>(settings.taxRatePercent);
  const [waiverRate, setWaiverRate] = useState<number>(settings.damageWaiverDailyRate);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      dbStore.updateSettings({
        taxRatePercent: taxRate,
        damageWaiverDailyRate: waiverRate,
      });
      showToast('System configuration parameters saved.', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleExecuteReset = () => {
    dbStore.resetDemoData();
    showToast('Database reset to clean factory seed state.', 'success');
    setIsResetConfirmOpen(false);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#F4F7FA]">Operations & Financial Configuration</h1>
        <p className="text-xs text-[#93A1B2]">
          Control commercial billing rules, tax rates, and database state.
        </p>
      </div>

      {/* Pricing & Tax Configuration Form */}
      <div className="bg-[#121821] border border-[#263241] rounded-xl p-6 shadow-xl">
        <h2 className="text-base font-bold text-[#F4F7FA] mb-4 flex items-center gap-2">
          <Percent className="w-4 h-4 text-[#C7F36B]" />
          <span>Billing & Tariff Parameters</span>
        </h2>

        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#93A1B2] mb-1 font-semibold">
                GST / Sales Tax Percentage (%)
              </label>
              <input
                type="number"
                min={0}
                max={50}
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] font-mono focus:outline-none focus:border-[#C7F36B]"
              />
              <p className="text-[11px] text-[#93A1B2] mt-1">
                Standard automotive rental taxation under Indian GST (18%).
              </p>
            </div>

            <div>
              <label className="block text-[#93A1B2] mb-1 font-semibold">
                Velocity Shield Daily Tariff (INR)
              </label>
              <input
                type="number"
                min={0}
                value={waiverRate}
                onChange={(e) => setWaiverRate(parseInt(e.target.value, 10) || 0)}
                className="w-full p-2.5 bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] font-mono focus:outline-none focus:border-[#C7F36B]"
              />
              <p className="text-[11px] text-[#93A1B2] mt-1">
                Optional collision damage waiver rate per billable day.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#C7F36B] hover:bg-[#b8e55e] text-[#080B10] font-semibold rounded-lg flex items-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save System Settings</span>
            </button>
          </div>
        </form>
      </div>

      {/* Real PostgreSQL / Cloud SQL Backend Guide */}
      <div className="bg-[#121821] border border-[#263241] rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-[#F4F7FA]">
          <Database className="w-4 h-4 text-[#55D6E8]" />
          <span>Production SQL Backend Architecture</span>
        </div>
        <p className="text-xs text-[#93A1B2] leading-relaxed">
          The current environment runs a fully reactive in-memory transactional DBMS simulator persisting to client storage. For production enterprise deployment, the typed data layer (<code>dbStore</code>) connects to a PostgreSQL instance with the following connection string and migration commands:
        </p>

        <div className="p-3 rounded-lg bg-[#080B10] border border-[#263241] font-mono text-xs text-[#55D6E8] space-y-1">
          <p># Production PostgreSQL Environment Variables</p>
          <p className="text-slate-400">DATABASE_URL="postgresql://velocity_admin:[PASSWORD]@aws.postgres.database.azure.com:5432/velocity_os?sslmode=require"</p>
          <p className="text-slate-400"># Run automated DDL migration & seed scripts</p>
          <p className="text-[#C7F36B]">npm run db:migrate && npm run db:seed</p>
        </div>
      </div>

      {/* Danger Zone: Reset Demo Data */}
      <div className="bg-[#121821] border border-rose-500/30 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-rose-400">
          <AlertTriangle className="w-4 h-4" />
          <span>Database Reset & Re-seeding</span>
        </div>
        <p className="text-xs text-[#93A1B2] leading-relaxed">
          Restore all 6 tables (<code>CUSTOMER</code>, <code>VEHICLE</code>, <code>STAFF</code>, <code>RENTAL</code>, <code>PAYMENT</code>, <code>MAINTENANCE</code>) to clean initial seed records. All customized test bookings or edits will be reset.
        </p>

        <button
          onClick={() => setIsResetConfirmOpen(true)}
          className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset Demo Data to Initial Seeds</span>
        </button>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleExecuteReset}
        title="Reset Entire Database?"
        message="This action will erase all modifications, user bookings, and payments, restoring the factory demo dataset with 14 vehicles, 8 customers, and verified test bookings."
        confirmLabel="Yes, Reset Everything"
        isDestructive={true}
      />
    </div>
  );
};
