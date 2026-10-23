import React from 'react';
import {
  LayoutDashboard,
  Car,
  CalendarCheck,
  Users,
  CreditCard,
  Wrench,
  UserCheck,
  BarChart3,
  Database,
  Terminal,
  FileText,
  Settings,
  ArrowLeft,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { StaffRole } from '../../types';
import { dbStore } from '../../services/dbStore';
import { useToast } from './ToastProvider';

interface OperationsSidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  onExitToCustomer: () => void;
  activeRole: StaffRole;
}

export const OperationsSidebar: React.FC<OperationsSidebarProps> = ({
  currentRoute,
  onNavigate,
  onExitToCustomer,
  activeRole,
}) => {
  const { showToast } = useToast();

  const handleRoleChange = (newRole: StaffRole) => {
    dbStore.setActiveRole(newRole);
    showToast(`Switched active demo role to ${newRole}`, 'info');
  };

  const navItems = [
    { label: 'Overview', route: '/admin/dashboard', icon: LayoutDashboard, roles: ['Admin', 'Manager', 'Rental Agent', 'Maintenance Staff'] },
    { label: 'Fleet Inventory', route: '/admin/fleet', icon: Car, roles: ['Admin', 'Manager', 'Maintenance Staff'] },
    { label: 'Rentals & Bookings', route: '/admin/rentals', icon: CalendarCheck, roles: ['Admin', 'Manager', 'Rental Agent'] },
    { label: 'Customer Directory', route: '/admin/customers', icon: Users, roles: ['Admin', 'Manager', 'Rental Agent'] },
    { label: 'Payment Ledger', route: '/admin/payments', icon: CreditCard, roles: ['Admin', 'Manager'] },
    { label: 'Fleet Maintenance', route: '/admin/maintenance', icon: Wrench, roles: ['Admin', 'Manager', 'Maintenance Staff'] },
    { label: 'Staff Management', route: '/admin/staff', icon: UserCheck, roles: ['Admin'] },
    { label: 'Reports & Analytics', route: '/admin/reports', icon: BarChart3, roles: ['Admin', 'Manager'] },
    { label: 'Relational Schema', route: '/admin/database', icon: Database, roles: ['Admin', 'Manager', 'Rental Agent', 'Maintenance Staff'] },
    { label: 'Interactive SQL Lab', route: '/admin/sql-lab', icon: Terminal, roles: ['Admin', 'Manager', 'Rental Agent', 'Maintenance Staff'] },
    { label: 'Audit Activity Log', route: '/admin/audit', icon: FileText, roles: ['Admin', 'Manager'] },
    { label: 'Operations Settings', route: '/admin/settings', icon: Settings, roles: ['Admin'] },
  ];

  return (
    <aside className="w-64 bg-[#0D1118] border-r border-[#263241] flex flex-col shrink-0 min-h-screen">
      {/* Brand & Exit */}
      <div className="p-4 border-b border-[#263241]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm bg-[#C7F36B]" />
            <span className="font-bold text-sm tracking-tight text-[#F4F7FA]">
              VELOCITY <span className="text-[#C7F36B]">OPS</span>
            </span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#18212C] text-[#55D6E8] border border-[#263241]">
            v2.4 DBMS
          </span>
        </div>

        <button
          onClick={onExitToCustomer}
          className="mt-3 w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#121821] hover:bg-[#18212C] border border-[#263241] text-xs text-[#93A1B2] hover:text-[#F4F7FA] transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5 text-[#C7F36B]" />
            <span>Customer Portal</span>
          </span>
          <ChevronRight className="w-3 h-3 text-[#93A1B2]" />
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        <div className="px-2 py-1 text-[11px] font-semibold text-[#93A1B2]/70 uppercase tracking-wider">
          Operations Modules
        </div>
        {navItems.map((item) => {
          const isAllowed = item.roles.includes(activeRole);
          const isActive = currentRoute === item.route;
          const Icon = item.icon;

          if (!isAllowed) {
            return (
              <div
                key={item.route}
                className="flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-[#93A1B2]/40 cursor-not-allowed select-none"
                title={`Requires ${item.roles.join(', ')} permission`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 opacity-40" />
                  <span>{item.label}</span>
                </div>
                <span className="text-[9px] font-mono border border-slate-800 px-1 rounded">Locked</span>
              </div>
            );
          }

          return (
            <button
              key={item.route}
              onClick={() => onNavigate(item.route)}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-[#18212C] text-[#C7F36B] font-semibold border border-[#C7F36B]/20'
                  : 'text-[#93A1B2] hover:text-[#F4F7FA] hover:bg-[#121821]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#C7F36B]' : 'text-[#93A1B2]'}`} />
                <span>{item.label}</span>
              </div>
              {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#C7F36B]" />}
            </button>
          );
        })}
      </nav>

      {/* Demo Role Switcher */}
      <div className="p-3 border-t border-[#263241] bg-[#0A0E14]">
        <div className="flex items-center gap-1.5 mb-2 text-[11px] font-semibold text-[#93A1B2]">
          <Shield className="w-3.5 h-3.5 text-[#55D6E8]" />
          <span>Active Role Switcher</span>
        </div>
        <select
          value={activeRole}
          onChange={(e) => handleRoleChange(e.target.value as StaffRole)}
          className="w-full text-xs bg-[#121821] text-[#F4F7FA] border border-[#263241] rounded-lg p-2 focus:outline-none focus:border-[#C7F36B] transition-colors"
        >
          <option value="Admin">Admin (Full Access)</option>
          <option value="Manager">Manager (Operations & Reports)</option>
          <option value="Rental Agent">Rental Agent (Bookings & Checkouts)</option>
          <option value="Maintenance Staff">Maintenance Staff (Service Bay)</option>
        </select>
        <p className="text-[10px] text-[#93A1B2]/70 mt-1.5 leading-tight">
          Demo RBAC: evaluator role simulation
        </p>
      </div>
    </aside>
  );
};
