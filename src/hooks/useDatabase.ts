import { useState, useEffect } from 'react';
import { dbStore } from '../services/dbStore';
import { Vehicle, Customer, Staff, Rental, Payment, Maintenance, AuditEvent, NotificationItem, AppSettings } from '../types';

export function useDatabase() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = dbStore.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  return {
    vehicles: dbStore.getVehicles(),
    customers: dbStore.getCustomers(),
    staff: dbStore.getStaff(),
    rentals: dbStore.getRentals(),
    payments: dbStore.getPayments(),
    maintenance: dbStore.getMaintenance(),
    auditLogs: dbStore.getAuditLogs(),
    notifications: dbStore.getNotifications(),
    settings: dbStore.getSettings(),
    store: dbStore,
  };
}
