import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  Shield,
  Clock,
  Car,
  User,
  CreditCard,
  Wrench,
  Calendar,
} from 'lucide-react';
import { AuditEvent, StaffRole } from '../../types';
import { formatDateTime } from '../../utils/formatters';

interface AuditLogProps {
  auditLogs: AuditEvent[];
  activeRole: StaffRole;
}

export const AuditLog: React.FC<AuditLogProps> = ({ auditLogs }) => {
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('All');
  const [actorFilter, setActorFilter] = useState<string>('All');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (entityFilter !== 'All' && log.entity_type !== entityFilter) return false;
      if (actorFilter !== 'All' && log.actor_role !== actorFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchId = log.event_id.toLowerCase().includes(q);
        const matchAction = log.action.toLowerCase().includes(q);
        const matchDesc = log.description.toLowerCase().includes(q);
        if (!matchId && !matchAction && !matchDesc) return false;
      }
      return true;
    });
  }, [auditLogs, entityFilter, actorFilter, search]);

  const getEntityIcon = (type: AuditEvent['entity_type']) => {
    switch (type) {
      case 'VEHICLE':
        return <Car className="w-3.5 h-3.5 text-[#55D6E8]" />;
      case 'CUSTOMER':
        return <User className="w-3.5 h-3.5 text-[#C7F36B]" />;
      case 'RENTAL':
        return <Calendar className="w-3.5 h-3.5 text-emerald-400" />;
      case 'PAYMENT':
        return <CreditCard className="w-3.5 h-3.5 text-amber-400" />;
      case 'MAINTENANCE':
        return <Wrench className="w-3.5 h-3.5 text-rose-400" />;
      default:
        return <Shield className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#F4F7FA]">System Audit Trail & Operations Log</h1>
          <p className="text-xs text-[#93A1B2]">
            Chronological audit records capturing all database mutations, status transitions, and payments.
          </p>
        </div>

        <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-[#18212C] border border-[#263241] text-[#93A1B2]">
          {auditLogs.length} Total Events Logged
        </span>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-4 rounded-xl bg-[#121821] border border-[#263241] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-[#93A1B2] absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search action, description, or event ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#0D1118] border border-[#263241] rounded-lg text-[#F4F7FA] placeholder-[#93A1B2] focus:outline-none focus:border-[#C7F36B]"
          />
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          <div className="flex items-center gap-1.5 text-xs text-[#93A1B2]">
            <span>Entity:</span>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="bg-[#0D1118] text-[#F4F7FA] border border-[#263241] rounded-lg p-1.5 text-xs"
            >
              <option value="All">All Entities</option>
              <option value="RENTAL">RENTAL</option>
              <option value="PAYMENT">PAYMENT</option>
              <option value="VEHICLE">VEHICLE</option>
              <option value="CUSTOMER">CUSTOMER</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
              <option value="SYSTEM">SYSTEM</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#93A1B2]">
            <span>Actor:</span>
            <select
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
              className="bg-[#0D1118] text-[#F4F7FA] border border-[#263241] rounded-lg p-1.5 text-xs"
            >
              <option value="All">All Actors</option>
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Rental Agent">Rental Agent</option>
              <option value="Maintenance Staff">Maintenance Staff</option>
              <option value="Customer">Customer</option>
              <option value="System">System</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-[#121821] border border-[#263241] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#F4F7FA]">
            <thead className="bg-[#0D1118] text-[#93A1B2] uppercase text-[10px] font-semibold border-b border-[#263241]">
              <tr>
                <th className="py-3 px-4">Event ID</th>
                <th className="py-3 px-4">Entity Type</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Audit Description</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263241]/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#93A1B2]">
                    No audit records match filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.event_id} className="hover:bg-[#18212C]/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#55D6E8]">{log.event_id}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0D1118] border border-[#263241] font-mono text-[10px]">
                        {getEntityIcon(log.entity_type)}
                        <span>{log.entity_type}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-[#F4F7FA]">{log.action}</td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] font-medium text-[#C7F36B]">{log.actor_role}</span>
                    </td>
                    <td className="py-3 px-4 text-[#93A1B2] max-w-md">{log.description}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#93A1B2] text-right">
                      {formatDateTime(log.timestamp)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
