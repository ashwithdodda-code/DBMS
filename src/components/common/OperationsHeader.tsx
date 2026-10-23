import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Shield, CheckCircle2, ChevronRight, X, ExternalLink } from 'lucide-react';
import { StaffRole, NotificationItem } from '../../types';
import { dbStore } from '../../services/dbStore';
import { useToast } from './ToastProvider';

interface OperationsHeaderProps {
  currentRoute: string;
  activeRole: StaffRole;
  notifications: NotificationItem[];
  onNavigate: (route: string) => void;
  onExitToCustomer: () => void;
}

export const OperationsHeader: React.FC<OperationsHeaderProps> = ({
  currentRoute,
  activeRole,
  notifications,
  onNavigate,
  onExitToCustomer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const routeNames: Record<string, string> = {
    '/admin/dashboard': 'Executive Overview',
    '/admin/fleet': 'Fleet Inventory',
    '/admin/rentals': 'Rentals & Bookings',
    '/admin/customers': 'Customer Directory',
    '/admin/payments': 'Payment Ledger',
    '/admin/maintenance': 'Fleet Maintenance',
    '/admin/staff': 'Staff Management',
    '/admin/reports': 'Analytics & Reports',
    '/admin/database': 'Relational Schema Explorer',
    '/admin/sql-lab': 'Interactive SQL Lab',
    '/admin/audit': 'System Audit Log',
    '/admin/settings': 'Operations Settings',
  };

  const handleMarkAllRead = () => {
    dbStore.markAllNotificationsAsRead();
    showToast('All notifications marked as read', 'info');
  };

  // Quick global search results
  const vehicles = dbStore.getVehicles();
  const customers = dbStore.getCustomers();
  const rentals = dbStore.getRentals();

  const searchResults = searchQuery.trim()
    ? {
        vehicles: vehicles.filter(
          (v) =>
            v.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.registration_no.toLowerCase().includes(searchQuery.toLowerCase())
        ),
        customers: customers.filter(
          (c) =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.phone.includes(searchQuery)
        ),
        rentals: rentals.filter(
          (r) =>
            r.rental_id.toString().includes(searchQuery) ||
            r.pickup_location.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      }
    : null;

  return (
    <header className="h-16 bg-[#0D1118] border-b border-[#263241] px-6 flex items-center justify-between gap-6 shrink-0 z-30">
      {/* Breadcrumb Trail */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-[#93A1B2]">Console</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        <span className="font-semibold text-[#F4F7FA]">
          {routeNames[currentRoute] || 'Module'}
        </span>
      </div>

      {/* Center Search Trigger */}
      <div className="flex-1 max-w-md relative">
        <button
          onClick={() => setShowSearchModal(true)}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#121821] border border-[#263241] text-xs text-[#93A1B2] hover:border-slate-500 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-[#93A1B2]" />
            <span>Search fleet, customers, rentals, or IDs...</span>
          </span>
          <kbd className="hidden sm:inline-block font-mono text-[10px] bg-[#18212C] text-[#93A1B2] px-1.5 py-0.5 rounded border border-[#263241]">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-[#93A1B2] hover:text-[#F4F7FA] hover:bg-[#18212C] rounded-lg transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#C7F36B]" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[#121821] border border-[#263241] rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in duration-150">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#263241] bg-[#0D1118]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#F4F7FA]">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-[#C7F36B]/20 text-[#C7F36B] border border-[#C7F36B]/30">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-[#C7F36B] hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-[#263241]/60">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[#93A1B2]">No alerts or events.</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        dbStore.markNotificationAsRead(n.id);
                        if (n.link) {
                          onNavigate(n.link);
                          setShowNotifications(false);
                        }
                      }}
                      className={`p-3 text-xs cursor-pointer hover:bg-[#18212C] transition-colors ${
                        !n.read ? 'bg-[#18212C]/40' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-[#F4F7FA]">{n.title}</span>
                        {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-[#C7F36B]" />}
                      </div>
                      <p className="text-[11px] text-[#93A1B2] line-clamp-2">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Current Role Indicator */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#18212C] border border-[#263241]">
          <Shield className="w-3.5 h-3.5 text-[#C7F36B]" />
          <span className="text-xs font-semibold text-[#F4F7FA]">{activeRole}</span>
        </div>
      </div>

      {/* Global Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-[#121821] border border-[#263241] rounded-xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-[#263241] flex items-center gap-3 bg-[#0D1118]">
              <Search className="w-4 h-4 text-[#93A1B2]" />
              <input
                type="text"
                autoFocus
                placeholder="Search vehicles, customers, or rental reference IDs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-[#F4F7FA] placeholder-[#93A1B2] focus:outline-none"
              />
              <button
                onClick={() => {
                  setShowSearchModal(false);
                  setSearchQuery('');
                }}
                className="text-[#93A1B2] hover:text-[#F4F7FA]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto space-y-4">
              {!searchQuery.trim() ? (
                <p className="text-xs text-[#93A1B2] text-center py-6">
                  Type vehicle name, registration (e.g. KA-01), customer name, or rental ID to search.
                </p>
              ) : (
                <>
                  {searchResults?.vehicles && searchResults.vehicles.length > 0 && (
                    <div>
                      <h4 className="text-[11px] font-semibold text-[#93A1B2] uppercase mb-2">Vehicles</h4>
                      <div className="space-y-1">
                        {searchResults.vehicles.map((v) => (
                          <div
                            key={v.vehicle_id}
                            onClick={() => {
                              setShowSearchModal(false);
                              onNavigate('/admin/fleet');
                            }}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-[#18212C] cursor-pointer text-xs"
                          >
                            <div>
                              <span className="font-semibold text-[#F4F7FA]">{v.brand} {v.model}</span>
                              <span className="ml-2 font-mono text-[10px] text-[#55D6E8]">{v.registration_no}</span>
                            </div>
                            <span className="text-[#C7F36B] font-mono">₹{v.rental_rate}/day</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults?.customers && searchResults.customers.length > 0 && (
                    <div>
                      <h4 className="text-[11px] font-semibold text-[#93A1B2] uppercase mb-2">Customers</h4>
                      <div className="space-y-1">
                        {searchResults.customers.map((c) => (
                          <div
                            key={c.customer_id}
                            onClick={() => {
                              setShowSearchModal(false);
                              onNavigate('/admin/customers');
                            }}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-[#18212C] cursor-pointer text-xs"
                          >
                            <div>
                              <span className="font-semibold text-[#F4F7FA]">{c.name}</span>
                              <span className="ml-2 text-[#93A1B2]">{c.email}</span>
                            </div>
                            <span className="text-[10px] font-mono text-[#93A1B2]">ID #{c.customer_id}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults?.rentals && searchResults.rentals.length > 0 && (
                    <div>
                      <h4 className="text-[11px] font-semibold text-[#93A1B2] uppercase mb-2">Rentals</h4>
                      <div className="space-y-1">
                        {searchResults.rentals.map((r) => (
                          <div
                            key={r.rental_id}
                            onClick={() => {
                              setShowSearchModal(false);
                              onNavigate('/admin/rentals');
                            }}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-[#18212C] cursor-pointer text-xs"
                          >
                            <div>
                              <span className="font-semibold text-[#F4F7FA]">Rental #{r.rental_id}</span>
                              <span className="ml-2 text-[#93A1B2]">{r.pickup_location}</span>
                            </div>
                            <span className="text-[#C7F36B] font-mono">₹{r.total_amount}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults?.vehicles.length === 0 &&
                    searchResults?.customers.length === 0 &&
                    searchResults?.rentals.length === 0 && (
                      <p className="text-xs text-[#93A1B2] text-center py-6">
                        No matches found for "{searchQuery}".
                      </p>
                    )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
