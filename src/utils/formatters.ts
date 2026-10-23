export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export function maskLicense(license: string): string {
  if (!license) return '—';
  if (license.length <= 8) return license;
  // e.g. DL-04-2019-0048123 -> DL-04-••••-8123
  const parts = license.split('-');
  if (parts.length >= 4) {
    return `${parts[0]}-${parts[1]}-••••-${parts[3].slice(-4)}`;
  }
  return license.slice(0, 4) + '••••' + license.slice(-4);
}

export function getRentalStatusStyle(status: string) {
  switch (status) {
    case 'Active':
      return 'text-[#C7F36B] border-[#C7F36B]/30 bg-[#C7F36B]/10';
    case 'Confirmed':
      return 'text-[#55D6E8] border-[#55D6E8]/30 bg-[#55D6E8]/10';
    case 'Completed':
      return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    case 'Pending Confirmation':
      return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    case 'Cancelled':
      return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
    default:
      return 'text-slate-400 border-slate-700 bg-slate-800/50';
  }
}

export function getVehicleStatusStyle(status: string) {
  switch (status) {
    case 'Available':
      return 'text-[#C7F36B] border-[#C7F36B]/30 bg-[#C7F36B]/10';
    case 'Rented':
      return 'text-[#55D6E8] border-[#55D6E8]/30 bg-[#55D6E8]/10';
    case 'Maintenance':
      return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    case 'Inactive':
      return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
    default:
      return 'text-slate-400 border-slate-700 bg-slate-800/50';
  }
}

export function getPaymentStatusStyle(status: string) {
  switch (status) {
    case 'Completed':
      return 'text-[#C7F36B] border-[#C7F36B]/30 bg-[#C7F36B]/10';
    case 'Pending':
      return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    case 'Refunded':
      return 'text-[#55D6E8] border-[#55D6E8]/30 bg-[#55D6E8]/10';
    case 'Failed':
      return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
    default:
      return 'text-slate-400 border-slate-700 bg-slate-800/50';
  }
}
