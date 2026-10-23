import React, { useState, useEffect } from 'react';
import { useDatabase } from './hooks/useDatabase';
import { ToastProvider, useToast } from './components/common/ToastProvider';
import { Navbar } from './components/common/Navbar';
import { OperationsSidebar } from './components/common/OperationsSidebar';
import { OperationsHeader } from './components/common/OperationsHeader';

// Customer Pages
import { CustomerHome } from './features/customer/CustomerHome';
import { VehicleDiscovery } from './features/customer/VehicleDiscovery';
import { VehicleDetail } from './features/customer/VehicleDetail';
import { BookingWorkflow } from './features/customer/BookingWorkflow';
import { MyBookings } from './features/customer/MyBookings';
import { CustomerProfile } from './features/customer/CustomerProfile';

// Operations Pages
import { OperationsDashboard } from './features/operations/OperationsDashboard';
import { FleetManagement } from './features/operations/FleetManagement';
import { CustomerManagement } from './features/operations/CustomerManagement';
import { RentalManagement } from './features/operations/RentalManagement';
import { PaymentManagement } from './features/operations/PaymentManagement';
import { MaintenanceManagement } from './features/operations/MaintenanceManagement';
import { StaffManagement } from './features/operations/StaffManagement';
import { ReportsAnalytics } from './features/operations/ReportsAnalytics';
import { DatabaseExplorer } from './features/operations/DatabaseExplorer';
import { SqlLab } from './features/operations/SqlLab';
import { AuditLog } from './features/operations/AuditLog';
import { OperationsSettings } from './features/operations/OperationsSettings';

function VelocityOSApp() {
  const {
    vehicles,
    customers,
    staff,
    rentals,
    payments,
    maintenance,
    auditLogs,
    notifications,
    settings,
  } = useDatabase();

  const [currentRoute, setCurrentRoute] = useState<string>('/');
  const [selectedVehicleId, setSelectedVehicleId] = useState<number>(101);
  const [bookingPrefill, setBookingPrefill] = useState<{
    pickupDate?: string;
    returnDate?: string;
    location?: string;
  }>({});

  // Sync route on browser back/forward buttons or hash
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path && path !== '/') {
        setCurrentRoute(path);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (route: string) => {
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      window.history.pushState({}, '', route);
    } catch {
      // Ignore if iframe sandbox restricts pushState
    }
  };

  const handleSelectVehicle = (id: number) => {
    setSelectedVehicleId(id);
    navigate(`/vehicles/${id}`);
  };

  const handleStartBooking = (
    vehicleId: number,
    pickupDate?: string,
    returnDate?: string,
    location?: string
  ) => {
    setSelectedVehicleId(vehicleId);
    setBookingPrefill({ pickupDate, returnDate, location });
    navigate('/booking/new');
  };

  const isOperationsConsole = currentRoute.startsWith('/admin');

  return (
    <div className="min-h-screen bg-[#080B10] text-[#F4F7FA]">
      {isOperationsConsole ? (
        <div className="flex min-h-screen">
          {/* Operations Sidebar */}
          <OperationsSidebar
            currentRoute={currentRoute}
            onNavigate={navigate}
            onExitToCustomer={() => navigate('/')}
            activeRole={settings.activeRole}
          />

          {/* Main Console Content */}
          <div className="flex-1 flex flex-col min-w-0">
            <OperationsHeader
              currentRoute={currentRoute}
              activeRole={settings.activeRole}
              notifications={notifications}
              onNavigate={navigate}
              onExitToCustomer={() => navigate('/')}
            />

            <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
              {currentRoute === '/admin/dashboard' && (
                <OperationsDashboard
                  vehicles={vehicles}
                  customers={customers}
                  rentals={rentals}
                  payments={payments}
                  maintenance={maintenance}
                  activeRole={settings.activeRole}
                  onNavigate={navigate}
                  onQuickAddVehicle={() => navigate('/admin/fleet')}
                  onQuickCreateRental={() => navigate('/admin/rentals')}
                />
              )}

              {currentRoute === '/admin/fleet' && (
                <FleetManagement
                  vehicles={vehicles}
                  rentals={rentals}
                  maintenance={maintenance}
                  activeRole={settings.activeRole}
                  onOpenVehicleDetails={handleSelectVehicle}
                />
              )}

              {currentRoute === '/admin/rentals' && (
                <RentalManagement
                  rentals={rentals}
                  vehicles={vehicles}
                  customers={customers}
                  staff={staff}
                  payments={payments}
                  activeRole={settings.activeRole}
                />
              )}

              {currentRoute === '/admin/customers' && (
                <CustomerManagement
                  customers={customers}
                  rentals={rentals}
                  payments={payments}
                  activeRole={settings.activeRole}
                />
              )}

              {currentRoute === '/admin/payments' && (
                <PaymentManagement
                  payments={payments}
                  rentals={rentals}
                  customers={customers}
                  activeRole={settings.activeRole}
                />
              )}

              {currentRoute === '/admin/maintenance' && (
                <MaintenanceManagement
                  maintenance={maintenance}
                  vehicles={vehicles}
                  staff={staff}
                  activeRole={settings.activeRole}
                />
              )}

              {currentRoute === '/admin/staff' && (
                <StaffManagement staff={staff} activeRole={settings.activeRole} />
              )}

              {currentRoute === '/admin/reports' && (
                <ReportsAnalytics
                  vehicles={vehicles}
                  customers={customers}
                  rentals={rentals}
                  payments={payments}
                  maintenance={maintenance}
                  activeRole={settings.activeRole}
                />
              )}

              {currentRoute === '/admin/database' && <DatabaseExplorer />}

              {currentRoute === '/admin/sql-lab' && <SqlLab />}

              {currentRoute === '/admin/audit' && (
                <AuditLog auditLogs={auditLogs} activeRole={settings.activeRole} />
              )}

              {currentRoute === '/admin/settings' && (
                <OperationsSettings settings={settings} activeRole={settings.activeRole} />
              )}
            </main>
          </div>
        </div>
      ) : (
        /* Customer Portal Layout */
        <div className="flex flex-col min-h-screen">
          <Navbar
            currentPath={currentRoute}
            onNavigate={navigate}
            onOpenOperations={() => navigate('/admin/dashboard')}
          />

          <main className="flex-1">
            {currentRoute === '/' && (
              <CustomerHome
                vehicles={vehicles}
                onSelectVehicle={handleSelectVehicle}
                onStartBooking={handleStartBooking}
                onNavigate={navigate}
              />
            )}

            {currentRoute === '/vehicles' && (
              <VehicleDiscovery
                vehicles={vehicles}
                onSelectVehicle={handleSelectVehicle}
                onStartBooking={handleStartBooking}
              />
            )}

            {currentRoute.startsWith('/vehicles/') && (
              <VehicleDetail
                vehicleId={selectedVehicleId}
                vehicles={vehicles}
                onBack={() => navigate('/vehicles')}
                onSelectVehicle={handleSelectVehicle}
                onStartBooking={handleStartBooking}
              />
            )}

            {currentRoute === '/booking/new' && (
              <BookingWorkflow
                initialVehicleId={selectedVehicleId}
                vehicles={vehicles}
                initialPickupDate={bookingPrefill.pickupDate}
                initialReturnDate={bookingPrefill.returnDate}
                initialLocation={bookingPrefill.location}
                onNavigate={navigate}
              />
            )}

            {currentRoute === '/my-bookings' && (
              <MyBookings
                rentals={rentals}
                vehicles={vehicles}
                payments={payments}
                customers={customers}
                activeCustomerId={settings.activeCustomerId}
                onNavigate={navigate}
              />
            )}

            {currentRoute === '/profile' && (
              <CustomerProfile
                customers={customers}
                rentals={rentals}
                payments={payments}
                activeCustomerId={settings.activeCustomerId}
              />
            )}
          </main>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <VelocityOSApp />
    </ToastProvider>
  );
}
