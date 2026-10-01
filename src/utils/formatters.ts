/**
 * Formatting utilities for Indian currency, DD-MM-YYYY dates, and numbers.
 * Strictly avoids em dashes; uses commas, periods, or colons.
 */

export function formatRupee(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0';
  }
  const isNegative = amount < 0;
  const absAmount = Math.abs(Math.round(amount));
  
  // Format using Indian numbering system (lakhs & crores)
  const formatted = absAmount.toLocaleString('en-IN');
  return isNegative ? `-₹${formatted}` : `₹${formatted}`;
}

export function formatRupeeWithDecimals(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0.00';
  }
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const formatted = absAmount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return isNegative ? `-₹${formatted}` : `₹${formatted}`;
}

/**
 * Formats a date string (YYYY-MM-DD or ISO) into Indian standard DD-MM-YYYY
 */
export function formatDate(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
}

/**
 * Formats a date and time into DD-MM-YYYY, HH:MM AM/PM
 */
export function formatDateTime(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 hour should be 12
  const formattedHours = String(hours).padStart(2, '0');

  return `${day}-${month}-${year}, ${formattedHours}:${minutes} ${ampm}`;
}

/**
 * Returns YYYY-MM-DD string for input[type="date"]
 */
export function toISODateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate difference in nights between two YYYY-MM-DD dates
 */
export function calculateNights(checkInDate: string, checkOutDate: string): number {
  if (!checkInDate || !checkOutDate) return 1;
  const start = new Date(checkInDate);
  const end = new Date(checkOutDate);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1;
}

/**
 * Format percent without trailing zeros
 */
export function formatPercent(rate: number): string {
  return `${rate}%`;
}
