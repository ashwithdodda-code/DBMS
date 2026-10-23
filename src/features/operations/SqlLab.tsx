import React, { useState } from 'react';
import {
  Terminal,
  Play,
  RotateCcw,
  Clock,
  Database,
  CheckCircle2,
  Info,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import { PRESET_SQL_QUERIES, executeSqlSimulator, SqlQueryResult, SqlPresetQuery } from '../../services/sqlSimulator';
import { useToast } from '../../components/common/ToastProvider';

export const SqlLab: React.FC = () => {
  const { showToast } = useToast();

  const [selectedPreset, setSelectedPreset] = useState<SqlPresetQuery>(PRESET_SQL_QUERIES[0]);
  const [sqlText, setSqlText] = useState<string>(PRESET_SQL_QUERIES[0].sql);
  const [result, setResult] = useState<SqlQueryResult>(() => executeSqlSimulator(PRESET_SQL_QUERIES[0].sql));
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'normalization' | 'acid'>('editor');

  const handleSelectPreset = (preset: SqlPresetQuery) => {
    setSelectedPreset(preset);
    setSqlText(preset.sql);
    const res = executeSqlSimulator(preset.sql);
    setResult(res);
  };

  const handleRunQuery = () => {
    setIsExecuting(true);
    setTimeout(() => {
      const res = executeSqlSimulator(sqlText);
      setResult(res);
      setIsExecuting(false);
      showToast(`Query executed in ${res.executionTimeMs}ms (${res.rowCount} rows returned)`, 'success');
    }, 150);
  };

  const handleResetQuery = () => {
    setSqlText(selectedPreset.sql);
    setResult(executeSqlSimulator(selectedPreset.sql));
    showToast('Reset query to default preset syntax.', 'info');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono text-[#C7F36B] uppercase tracking-wider">DBMS Academic Demonstration</span>
            <span className="text-slate-600">·</span>
            <span className="text-[11px] text-[#93A1B2]">Interactive SQL Evaluation Engine</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#F4F7FA]">Interactive SQL Lab & Query Playground</h1>
          <p className="text-xs text-[#93A1B2]">
            Execute relational queries against live database state. Inspect projections, joins, groupings, and ACID transaction rules.
          </p>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-1.5 bg-[#121821] border border-[#263241] rounded-lg p-1">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'editor' ? 'bg-[#18212C] text-[#C7F36B]' : 'text-[#93A1B2] hover:text-[#F4F7FA]'
            }`}
          >
            SQL Editor
          </button>
          <button
            onClick={() => setActiveTab('normalization')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'normalization' ? 'bg-[#18212C] text-[#55D6E8]' : 'text-[#93A1B2] hover:text-[#F4F7FA]'
            }`}
          >
            3NF Normalization
          </button>
          <button
            onClick={() => setActiveTab('acid')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'acid' ? 'bg-[#18212C] text-emerald-400' : 'text-[#93A1B2] hover:text-[#F4F7FA]'
            }`}
          >
            ACID Transactions
          </button>
        </div>
      </div>

      {activeTab === 'editor' && (
        <div className="space-y-6">
          {/* Query Preset Selector Pills */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#93A1B2] uppercase tracking-wider block">
              Curated DBMS Showcase Queries
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {PRESET_SQL_QUERIES.map((preset) => {
                const isSelected = selectedPreset.id === preset.id;

                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-[#18212C] border-[#C7F36B] text-[#F4F7FA]'
                        : 'bg-[#121821] border-[#263241] text-[#93A1B2] hover:border-slate-500 hover:text-[#F4F7FA]'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-xs mb-1">
                      <span className={isSelected ? 'text-[#C7F36B]' : 'text-[#F4F7FA]'}>{preset.name}</span>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#C7F36B]" />}
                    </div>
                    <p className="text-[11px] text-[#93A1B2] line-clamp-1">{preset.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Monospaced SQL Editor */}
          <div className="bg-[#121821] border border-[#263241] rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-3.5 bg-[#0D1118] border-b border-[#263241] flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#C7F36B]" />
                <span className="text-xs font-mono font-bold text-[#F4F7FA]">Query Execution Console</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#18212C] text-[#55D6E8] border border-[#263241]">
                  Live In-Memory Evaluator
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetQuery}
                  className="px-3 py-1.5 text-xs text-[#93A1B2] hover:text-[#F4F7FA] hover:bg-[#18212C] rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>

                <button
                  onClick={handleRunQuery}
                  disabled={isExecuting}
                  className="px-4 py-1.5 bg-[#C7F36B] hover:bg-[#b8e55e] text-[#080B10] font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors shadow-md shadow-[#C7F36B]/10"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isExecuting ? 'Running...' : 'Run Query'}</span>
                </button>
              </div>
            </div>

            <div className="p-4 bg-[#080B10]">
              <textarea
                value={sqlText}
                onChange={(e) => setSqlText(e.target.value)}
                rows={6}
                spellCheck={false}
                className="w-full bg-transparent font-mono text-sm text-[#C7F36B] focus:outline-none leading-relaxed resize-y selection:bg-[#55D6E8] selection:text-[#080B10]"
              />
            </div>

            {/* Educational concept tags */}
            <div className="px-4 py-2.5 bg-[#0D1118] border-t border-[#263241] flex flex-wrap items-center gap-2 text-[11px] text-[#93A1B2]">
              <span className="font-semibold text-[#F4F7FA]">DBMS Concepts Demonstrated:</span>
              {selectedPreset.concepts.map((c) => (
                <span key={c} className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#18212C] text-[#55D6E8] border border-[#263241]">
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Results Table Panel */}
          <div className="bg-[#121821] border border-[#263241] rounded-2xl overflow-hidden shadow-xl">
            <div className="p-3.5 bg-[#0D1118] border-b border-[#263241] flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="font-bold text-[#F4F7FA]">Query Execution Results</span>
                <span className="font-mono text-[#C7F36B] bg-[#C7F36B]/10 px-2 py-0.5 rounded border border-[#C7F36B]/30">
                  {result.rowCount} rows returned
                </span>
              </div>

              <div className="flex items-center gap-2 font-mono text-[11px] text-[#93A1B2]">
                <Clock className="w-3.5 h-3.5 text-[#55D6E8]" />
                <span>Execution: {result.executionTimeMs}ms</span>
              </div>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs text-[#F4F7FA]">
                <thead className="bg-[#080B10] text-[#93A1B2] uppercase text-[10px] font-mono font-semibold border-b border-[#263241]">
                  <tr>
                    {result.columns.map((col) => (
                      <th key={col} className="py-2.5 px-4">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#263241]/60 font-mono">
                  {result.rows.length === 0 ? (
                    <tr>
                      <td colSpan={result.columns.length || 1} className="py-8 text-center text-[#93A1B2]">
                        0 records matched query criteria.
                      </td>
                    </tr>
                  ) : (
                    result.rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-[#18212C]/40">
                        {result.columns.map((col) => (
                          <td key={col} className="py-2.5 px-4 text-[#F4F7FA]">
                            {row[col] !== undefined ? String(row[col]) : 'NULL'}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-[#0D1118] border-t border-[#263241] text-[11px] text-[#93A1B2] flex items-center justify-between">
              <span>{result.notice}</span>
              <span className="text-[#C7F36B] font-mono">Status: 200 OK (Clean Result Set)</span>
            </div>
          </div>
        </div>
      )}

      {/* Normalization Tab */}
      {activeTab === 'normalization' && (
        <div className="space-y-6">
          <div className="bg-[#121821] border border-[#263241] rounded-2xl p-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#F4F7FA]">Relational Database Normalization Principles</h2>
              <p className="text-xs text-[#93A1B2] mt-1">
                How VELOCITY OS eliminates data redundancy, update anomalies, and insertion inconsistencies using Third Normal Form (3NF).
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              <div className="p-4 rounded-xl bg-[#0D1118] border border-[#263241] space-y-3">
                <span className="font-mono font-bold text-[#C7F36B] text-sm">First Normal Form (1NF)</span>
                <p className="text-xs text-[#93A1B2] leading-relaxed">
                  Every attribute contains only atomic, indivisible values with no repeating groups or nested arrays.
                </p>
                <div className="p-2.5 rounded bg-[#121821] border border-[#263241] text-[11px] font-mono text-[#55D6E8]">
                  Enforcement: Customer addresses, phone numbers, and license IDs are stored as scalar column attributes.
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#0D1118] border border-[#263241] space-y-3">
                <span className="font-mono font-bold text-[#55D6E8] text-sm">Second Normal Form (2NF)</span>
                <p className="text-xs text-[#93A1B2] leading-relaxed">
                  Satisfies 1NF and ensures every non-key column is fully functionally dependent on the entire primary key, eliminating partial dependencies.
                </p>
                <div className="p-2.5 rounded bg-[#121821] border border-[#263241] text-[11px] font-mono text-[#55D6E8]">
                  Enforcement: Vehicle specifications (fuel, transmission, daily rate) belong exclusively in <code>VEHICLE</code>, not duplicated in <code>RENTAL</code>.
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#0D1118] border border-[#263241] space-y-3">
                <span className="font-mono font-bold text-emerald-400 text-sm">Third Normal Form (3NF)</span>
                <p className="text-xs text-[#93A1B2] leading-relaxed">
                  Satisfies 2NF with no transitive dependencies: non-prime attributes depend only on candidate keys (X → Y where X is superkey).
                </p>
                <div className="p-2.5 rounded bg-[#121821] border border-[#263241] text-[11px] font-mono text-emerald-400">
                  Enforcement: <code>PAYMENT</code> references <code>rental_id</code>; it does not duplicate customer names or vehicle brands.
                </div>
              </div>
            </div>

            {/* Anti-Pattern vs Velocity OS Schema */}
            <div className="p-5 rounded-xl bg-[#080B10] border border-[#263241] space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400">
                The Anti-Pattern: Denormalized "Mega-Table" (Avoided)
              </h3>
              <p className="text-xs text-[#93A1B2]">
                Storing customer details, car specs, rental dates, and payment amounts in a single table causes massive redundancy and update anomalies:
              </p>
              <div className="p-3 rounded bg-rose-500/10 border border-rose-500/20 font-mono text-xs text-rose-300 overflow-x-auto">
                DENORMALIZED_RENTAL(rental_id, customer_name, customer_email, customer_phone, car_model, car_rate, car_reg, rental_date, amount, payment_status)
              </div>

              <h3 className="text-xs font-bold uppercase tracking-wider text-[#C7F36B] pt-2">
                Velocity OS Clean 3NF Normalized Architecture (Implemented)
              </h3>
              <div className="p-3 rounded bg-[#121821] border border-[#C7F36B]/30 font-mono text-xs text-[#C7F36B] space-y-1">
                <p>CUSTOMER(customer_id PK, name, email UNIQUE, phone, driving_license UNIQUE, address)</p>
                <p>VEHICLE(vehicle_id PK, registration_no UNIQUE, brand, model, vehicle_type, rental_rate, status)</p>
                <p>RENTAL(rental_id PK, customer_id FK, vehicle_id FK, staff_id FK, rental_date, return_date, total_amount, status)</p>
                <p>PAYMENT(payment_id PK, rental_id FK, amount, payment_date, method, status, transaction_reference UNIQUE)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACID Transactions Tab */}
      {activeTab === 'acid' && (
        <div className="space-y-6">
          <div className="bg-[#121821] border border-[#263241] rounded-2xl p-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#F4F7FA]">ACID Transaction Lifecycle Guarantees</h2>
              <p className="text-xs text-[#93A1B2] mt-1">
                How Velocity OS maintains absolute consistency during multi-step reservation and payment transactions.
              </p>
            </div>

            {/* 6-step lifecycle diagram */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-3">
              {[
                { step: '1', title: 'Validate Entity', desc: 'Confirm customer & vehicle exist in relations' },
                { step: '2', title: 'Lock & Check', desc: 'Verify zero overlapping active bookings or service' },
                { step: '3', title: 'Insert Rental', desc: 'Create immutable booking record in RENTAL' },
                { step: '4', title: 'Record Ledger', desc: 'Log payment capture or pending state in PAYMENT' },
                { step: '5', title: 'Derive State', desc: 'Update vehicle derived operational status to Rented' },
                { step: '6', title: 'Atomic Commit', desc: 'Persist state or rollback all changes on any error' },
              ].map((s) => (
                <div key={s.step} className="p-3.5 rounded-xl bg-[#0D1118] border border-[#263241] relative">
                  <div className="w-6 h-6 rounded-md bg-[#C7F36B]/10 text-[#C7F36B] font-mono text-xs font-bold flex items-center justify-center mb-2">
                    {s.step}
                  </div>
                  <h4 className="text-xs font-bold text-[#F4F7FA]">{s.title}</h4>
                  <p className="text-[11px] text-[#93A1B2] mt-1 leading-snug">{s.desc}</p>
                </div>
              ))}
            </div>

            {/* 4 Pillars */}
            <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-[#263241]">
              <div className="p-4 rounded-xl bg-[#0D1118] border border-[#263241] space-y-1.5">
                <span className="font-bold text-[#C7F36B] text-sm">Atomicity ("All or Nothing")</span>
                <p className="text-xs text-[#93A1B2]">
                  If a payment simulation fails or an overlapping booking collision occurs, the entire transaction rolls back; no orphan rental or ghost payment record is written to the database.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0D1118] border border-[#263241] space-y-1.5">
                <span className="font-bold text-[#55D6E8] text-sm">Consistency (Constraint Invariants)</span>
                <p className="text-xs text-[#93A1B2]">
                  Enforces non-negative payments, unique registration numbers, unique driving licenses, and valid foreign key references across all mutations.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0D1118] border border-[#263241] space-y-1.5">
                <span className="font-bold text-amber-400 text-sm">Isolation (Serializability)</span>
                <p className="text-xs text-[#93A1B2]">
                  Availability checking locks the vehicle for requested calendar dates, preventing concurrent race conditions and double-booking disasters.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0D1118] border border-[#263241] space-y-1.5">
                <span className="font-bold text-emerald-400 text-sm">Durability (Persistence Guarantee)</span>
                <p className="text-xs text-[#93A1B2]">
                  Once committed, all booking IDs, payments, and audit events persist across browser refreshes and crash recoveries.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
