export interface RentalPriceBreakdown {
  days: number;
  dailyRate: number;
  baseAmount: number;
  waiverAmount: number;
  subtotal: number;
  taxRatePercent: number;
  taxAmount: number;
  totalAmount: number;
}

/**
 * Calculates billable days between pickup and return date.
 * Enforces minimum 1 day.
 */
export function calculateBillableDays(pickupDate: string, returnDate: string): number {
  if (!pickupDate || !returnDate) return 1;
  const start = new Date(pickupDate);
  const end = new Date(returnDate);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1;
}

export function calculateRentalBreakdown(
  dailyRate: number,
  pickupDate: string,
  returnDate: string,
  includeWaiver = false,
  waiverDailyRate = 499,
  taxRatePercent = 18
): RentalPriceBreakdown {
  const days = calculateBillableDays(pickupDate, returnDate);
  const baseAmount = dailyRate * days;
  const waiverAmount = includeWaiver ? waiverDailyRate * days : 0;
  const subtotal = baseAmount + waiverAmount;
  const taxAmount = Math.round((subtotal * taxRatePercent) / 100);
  const totalAmount = subtotal + taxAmount;

  return {
    days,
    dailyRate,
    baseAmount,
    waiverAmount,
    subtotal,
    taxRatePercent,
    taxAmount,
    totalAmount,
  };
}
