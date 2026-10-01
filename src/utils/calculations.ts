import { Booking, GSTSlab, Settings, Room, RoomStatus } from '../types/index.ts';

/**
 * Determine GST Rate based on room tariff per night as per Indian GST slabs
 */
export function getGSTRateForTariff(tariffPerNight: number, slabs: GSTSlab[]): number {
  if (tariffPerNight <= 0) return 0;
  for (const slab of slabs) {
    if (tariffPerNight >= slab.minTariff && tariffPerNight <= slab.maxTariff) {
      return slab.gstRate;
    }
  }
  // Fallback default
  return 12;
}

/**
 * Calculate CGST, SGST (and IGST if interstate) from taxable value and GST percentage
 * For intra-state (typical Indian hotel stay), tax is split evenly between CGST (50%) and SGST (50%).
 */
export function calculateTaxBreakdown(taxableAmount: number, gstRatePercent: number, isInterstate: boolean = false) {
  const totalTax = Math.round((taxableAmount * gstRatePercent) / 100);
  if (isInterstate) {
    return {
      taxableAmount,
      gstRatePercent,
      cgstRate: 0,
      cgstAmount: 0,
      sgstRate: 0,
      sgstAmount: 0,
      igstRate: gstRatePercent,
      igstAmount: totalTax,
      totalTax,
      totalWithTax: taxableAmount + totalTax,
    };
  }

  const halfRate = gstRatePercent / 2;
  const halfTax = Math.round(totalTax / 2);
  return {
    taxableAmount,
    gstRatePercent,
    cgstRate: halfRate,
    cgstAmount: halfTax,
    sgstRate: halfRate,
    sgstAmount: totalTax - halfTax, // ensures exact rounding match
    igstRate: 0,
    igstAmount: 0,
    totalTax,
    totalWithTax: taxableAmount + totalTax,
  };
}

/**
 * Calculate total booking cost given rate per night, total nights, and GST slabs
 */
export function calculateBookingTotal(
  ratePerNight: number,
  nights: number,
  slabs: GSTSlab[],
  discountAmount: number = 0
): {
  subtotal: number;
  discount: number;
  taxableAmount: number;
  gstRate: number;
  taxAmount: number;
  totalAmount: number;
} {
  const validNights = Math.max(1, nights);
  const subtotal = ratePerNight * validNights;
  const discount = Math.min(subtotal, Math.max(0, discountAmount));
  const taxableAmount = subtotal - discount;
  const effectiveTariffPerNight = taxableAmount / validNights;
  const gstRate = getGSTRateForTariff(effectiveTariffPerNight, slabs);
  const taxAmount = Math.round((taxableAmount * gstRate) / 100);
  const totalAmount = taxableAmount + taxAmount;

  return {
    subtotal,
    discount,
    taxableAmount,
    gstRate,
    taxAmount,
    totalAmount,
  };
}

/**
 * Strict date collision detection:
 * Two bookings overlap if and only if StartA < EndB and EndA > StartB.
 * Same-day checkout of Booking A and checkin of Booking B is NOT an overlap.
 */
export function doDatesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  return startA < endB && endA > startB;
}

/**
 * Check if a room is available for a date range against active bookings.
 * Excludes cancelled or checked_out bookings and optionally ignores a specific booking ID (for modifications).
 */
export function isRoomAvailableForDates(
  roomId: string,
  checkInDate: string,
  checkOutDate: string,
  allBookings: Booking[],
  ignoreBookingId?: string
): boolean {
  for (const booking of allBookings) {
    if (ignoreBookingId && booking.id === ignoreBookingId) continue;
    if (booking.roomId !== roomId) continue;
    if (booking.status === 'cancelled' || booking.status === 'checked_out') continue;

    if (doDatesOverlap(checkInDate, checkOutDate, booking.checkInDate, booking.checkOutDate)) {
      return false;
    }
  }
  return true;
}

/**
 * Business rule: A room that is Dirty, In progress or Out of service cannot be assigned to an arriving guest.
 */
export function canRoomBeAssignedForCheckIn(room: Room): { allowed: boolean; reason?: string } {
  if (room.status === 'clean' || room.status === 'inspected') {
    return { allowed: true };
  }

  const statusDescriptions: Record<RoomStatus, string> = {
    clean: 'Clean',
    inspected: 'Inspected',
    dirty: 'Dirty (pending housekeeping cleaning)',
    in_progress: 'In progress (housekeeping is currently cleaning)',
    out_of_service: `Out of service (${room.outOfServiceReason || 'maintenance block'})`,
  };

  return {
    allowed: false,
    reason: `Room ${room.roomNumber} is currently ${statusDescriptions[room.status]}. Only Clean or Inspected rooms can be assigned for check-in.`,
  };
}

/**
 * Calculate cancellation refund and fee according to hotel cancellation policy:
 * Free cancellation up to X hours before check-in date at check-in time (e.g. 14:00).
 */
export function calculateCancellationFee(
  booking: Booking,
  cancelDate: Date,
  settings: Settings
): {
  isFreeCancellation: boolean;
  hoursUntilCheckIn: number;
  cancellationFee: number;
  refundAmount: number;
  explanation: string;
} {
  // Construct check-in Date from booking checkInDate and settings.defaultCheckInTime (e.g. "14:00")
  const [checkInHours, checkInMinutes] = (settings.defaultCheckInTime || '14:00').split(':').map(Number);
  const checkInDateTime = new Date(booking.checkInDate);
  checkInDateTime.setHours(checkInHours || 14, checkInMinutes || 0, 0, 0);

  const diffMs = checkInDateTime.getTime() - cancelDate.getTime();
  const hoursUntilCheckIn = Math.round(diffMs / (1000 * 60 * 60));

  const isFreeCancellation = hoursUntilCheckIn >= settings.cancellationFreeHours;

  if (isFreeCancellation) {
    return {
      isFreeCancellation: true,
      hoursUntilCheckIn,
      cancellationFee: 0,
      refundAmount: booking.advancePaid,
      explanation: `Cancelled ${hoursUntilCheckIn} hours before check-in. Within the ${settings.cancellationFreeHours}-hour free cancellation window. Full advance refund.`,
    };
  } else {
    // 1 night fee or advance paid
    const oneNightCharge = Math.min(booking.advancePaid, booking.ratePerNight);
    const refundAmount = Math.max(0, booking.advancePaid - oneNightCharge);
    return {
      isFreeCancellation: false,
      hoursUntilCheckIn,
      cancellationFee: oneNightCharge,
      refundAmount,
      explanation: `Cancelled ${hoursUntilCheckIn > 0 ? `${hoursUntilCheckIn} hours before check-in` : 'after check-in time'}. Outside the ${settings.cancellationFreeHours}-hour free window. Retaining 1 night fee of ₹${oneNightCharge.toLocaleString('en-IN')}.`,
    };
  }
}

/**
 * Format sequential invoice number (e.g. INV-2026-0001)
 */
export function generateInvoiceNumber(prefix: string, sequenceNumber: number, year: number = new Date().getFullYear()): string {
  const padded = String(sequenceNumber).padStart(4, '0');
  return `${prefix}-${year}-${padded}`;
}

/**
 * Format sequential credit note number (e.g. CN-2026-0001)
 */
export function generateCreditNoteNumber(prefix: string, sequenceNumber: number, year: number = new Date().getFullYear()): string {
  const padded = String(sequenceNumber).padStart(4, '0');
  return `${prefix}-${year}-${padded}`;
}

/**
 * Calculate late check-out fee if past designated check-out time
 */
export function calculateLateCheckOutCharge(
  actualCheckOutTime: Date,
  scheduledCheckOutDateStr: string,
  settings: Settings
): { hoursLate: number; fee: number } {
  const [scheduledHours, scheduledMinutes] = (settings.defaultCheckOutTime || '11:00').split(':').map(Number);
  const scheduledTime = new Date(scheduledCheckOutDateStr);
  scheduledTime.setHours(scheduledHours || 11, scheduledMinutes || 0, 0, 0);

  const diffMs = actualCheckOutTime.getTime() - scheduledTime.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  // 15-minute grace period
  if (diffHours <= 0.25) {
    return { hoursLate: 0, fee: 0 };
  }

  const hoursLate = Math.ceil(diffHours);
  const fee = hoursLate * settings.lateCheckOutFeePerHour;
  return { hoursLate, fee };
}
