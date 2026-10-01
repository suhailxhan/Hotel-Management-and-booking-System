import {
  doDatesOverlap,
  isRoomAvailableForDates,
  calculateTaxBreakdown,
  calculateBookingTotal,
  canRoomBeAssignedForCheckIn,
  calculateCancellationFee,
  generateInvoiceNumber,
  generateCreditNoteNumber,
} from './calculations.ts';
import { Booking, GSTSlab, Room, Settings } from '../types/index.ts';

export function runBusinessRulesTests(): { passed: boolean; results: { name: string; success: boolean; detail: string }[] } {
  const results: { name: string; success: boolean; detail: string }[] = [];

  // Test 1: Date overlap logic
  const overlap1 = doDatesOverlap('2026-10-10', '2026-10-12', '2026-10-11', '2026-10-13'); // should be true
  const overlap2 = doDatesOverlap('2026-10-10', '2026-10-12', '2026-10-12', '2026-10-14'); // checkout on same day should be false
  const overlap3 = doDatesOverlap('2026-10-10', '2026-10-15', '2026-10-11', '2026-10-12'); // nested should be true
  
  const dateOverlapSuccess = overlap1 && !overlap2 && overlap3;
  results.push({
    name: 'Date overlap & same-day transition',
    success: dateOverlapSuccess,
    detail: dateOverlapSuccess ? 'Passed: Same-day check-in/checkout allowed, overlapping dates correctly blocked.' : 'Failed date overlap checks',
  });

  // Test 2: Double-booking prevention across bookings
  const mockBookings: Booking[] = [
    {
      id: 'b1',
      bookingReference: 'BK-001',
      guestId: 'g1',
      guestName: 'Rahul Sharma',
      guestPhone: '9876543210',
      guestEmail: 'rahul@example.com',
      roomTypeId: 'rt1',
      roomId: 'room-101',
      checkInDate: '2026-10-10',
      checkOutDate: '2026-10-14',
      adults: 2,
      children: 0,
      status: 'reserved',
      ratePerNight: 4500,
      totalNights: 4,
      roomCharges: 18000,
      taxAmount: 2160,
      totalAmount: 20160,
      advancePaid: 5000,
      createdAt: '2026-10-01',
    },
    {
      id: 'b2',
      bookingReference: 'BK-002',
      guestId: 'g2',
      guestName: 'Priya Patel',
      guestPhone: '9876543211',
      guestEmail: 'priya@example.com',
      roomTypeId: 'rt1',
      roomId: 'room-101',
      checkInDate: '2026-10-05',
      checkOutDate: '2026-10-08',
      adults: 1,
      children: 0,
      status: 'checked_out',
      ratePerNight: 4500,
      totalNights: 3,
      roomCharges: 13500,
      taxAmount: 1620,
      totalAmount: 15120,
      advancePaid: 15120,
      createdAt: '2026-10-01',
    },
  ];

  const availableDuringExisting = isRoomAvailableForDates('room-101', '2026-10-11', '2026-10-13', mockBookings); // should be false
  const availableAfterExisting = isRoomAvailableForDates('room-101', '2026-10-14', '2026-10-16', mockBookings); // should be true (checks out on 14th)
  const availableDifferentRoom = isRoomAvailableForDates('room-102', '2026-10-11', '2026-10-13', mockBookings); // should be true

  const doubleBookingSuccess = !availableDuringExisting && availableAfterExisting && availableDifferentRoom;
  results.push({
    name: 'Double-booking prevention rule',
    success: doubleBookingSuccess,
    detail: doubleBookingSuccess ? 'Passed: Room conflict detected; collision prevented while allowing adjacent and alternate room bookings.' : 'Failed room availability checks',
  });

  // Test 3: GST Slab Tax calculation (12% for <= 7500, 18% for > 7500)
  const slabs: GSTSlab[] = [
    { minTariff: 0, maxTariff: 7500, gstRate: 12 },
    { minTariff: 7501, maxTariff: 999999, gstRate: 18 },
  ];

  const calcUnder7500 = calculateBookingTotal(5000, 2, slabs);
  // Subtotal = 10,000, Taxable = 10,000, GST = 12% (1200), Total = 11,200
  const underSuccess = calcUnder7500.gstRate === 12 && calcUnder7500.taxAmount === 1200 && calcUnder7500.totalAmount === 11200;

  const calcAbove7500 = calculateBookingTotal(10000, 1, slabs);
  // Subtotal = 10,000, Taxable = 10,000, GST = 18% (1800), Total = 11,800
  const aboveSuccess = calcAbove7500.gstRate === 18 && calcAbove7500.taxAmount === 1800 && calcAbove7500.totalAmount === 11800;

  const taxBreakdown = calculateTaxBreakdown(10000, 12, false);
  const breakdownSuccess = taxBreakdown.cgstAmount === 600 && taxBreakdown.sgstAmount === 600 && taxBreakdown.totalTax === 1200;

  const gstSuccess = underSuccess && aboveSuccess && breakdownSuccess;
  results.push({
    name: 'GST slab and CGST/SGST 50-50 split calculation',
    success: gstSuccess,
    detail: gstSuccess ? 'Passed: Accurate 12% vs 18% slab selection with exact CGST/SGST apportionment.' : 'Failed GST calculations',
  });

  // Test 4: Room readiness for check-in
  const cleanRoom: Room = { id: 'r1', roomNumber: '101', floor: 1, roomTypeId: 'rt1', status: 'clean' };
  const inspectedRoom: Room = { id: 'r2', roomNumber: '102', floor: 1, roomTypeId: 'rt1', status: 'inspected' };
  const dirtyRoom: Room = { id: 'r3', roomNumber: '103', floor: 1, roomTypeId: 'rt1', status: 'dirty' };
  const oosRoom: Room = { id: 'r4', roomNumber: '104', floor: 1, roomTypeId: 'rt1', status: 'out_of_service', outOfServiceReason: 'Plumbing leak' };

  const cleanCheck = canRoomBeAssignedForCheckIn(cleanRoom).allowed;
  const inspectedCheck = canRoomBeAssignedForCheckIn(inspectedRoom).allowed;
  const dirtyCheck = !canRoomBeAssignedForCheckIn(dirtyRoom).allowed;
  const oosCheck = !canRoomBeAssignedForCheckIn(oosRoom).allowed;

  const roomReadinessSuccess = cleanCheck && inspectedCheck && dirtyCheck && oosCheck;
  results.push({
    name: 'Room status check-in constraint (Dirty / OOS blocked)',
    success: roomReadinessSuccess,
    detail: roomReadinessSuccess ? 'Passed: Blocked Dirty and Out of Service rooms from check-in assignment.' : 'Failed room readiness check',
  });

  // Test 5: Cancellation policy rules
  const mockSettings: Settings = {
    hotelName: 'The Malabar Grand',
    hotelTagline: 'Heritage Hospitality',
    hotelAddress: '42 Marine Drive',
    hotelCity: 'Kochi',
    hotelState: 'Kerala',
    hotelPincode: '682001',
    hotelPhone: '+91 484 2668000',
    hotelEmail: 'frontdesk@malabargrand.in',
    hotelGstin: '32AABCT1332L1Z5',
    invoicePrefix: 'INV',
    creditNotePrefix: 'CN',
    nextInvoiceNumber: 1045,
    nextCreditNoteNumber: 12,
    defaultCheckInTime: '14:00',
    defaultCheckOutTime: '11:00',
    lateCheckOutFeePerHour: 500,
    cancellationFreeHours: 48,
    maxDiscountPercentWithoutApproval: 15,
    gstSlabs: slabs,
    sacCodeAccommodation: '996311',
    sacCodeRestaurant: '996331',
    sacCodeServices: '999799',
  };

  // Booking with checkInDate 2026-10-15
  const futureBooking: Booking = { ...mockBookings[0], checkInDate: '2026-10-15', advancePaid: 4500, ratePerNight: 4500 };
  
  // 5 days before (120 hours > 48 hours): should be free
  const freeCancel = calculateCancellationFee(futureBooking, new Date('2026-10-10T12:00:00'), mockSettings);
  // 12 hours before (< 48 hours): should have fee
  const penaltyCancel = calculateCancellationFee(futureBooking, new Date('2026-10-15T02:00:00'), mockSettings);

  const cancellationSuccess = freeCancel.isFreeCancellation && freeCancel.refundAmount === 4500 && !penaltyCancel.isFreeCancellation && penaltyCancel.cancellationFee === 4500;
  results.push({
    name: 'Cancellation 48-hour policy check',
    success: cancellationSuccess,
    detail: cancellationSuccess ? 'Passed: Free cancellation honored > 48h; 1-night fee retained < 48h.' : 'Failed cancellation policy',
  });

  // Test 6: Sequential invoice and credit note numbering
  const invNumber = generateInvoiceNumber('INV', 42, 2026);
  const cnNumber = generateCreditNoteNumber('CN', 7, 2026);
  const numberingSuccess = invNumber === 'INV-2026-0042' && cnNumber === 'CN-2026-0007';
  results.push({
    name: 'Sequential invoice and credit note numbering',
    success: numberingSuccess,
    detail: numberingSuccess ? 'Passed: Zero-padded sequential IDs generated without deletion vulnerabilities.' : 'Failed invoice numbering',
  });

  const allPassed = results.every(r => r.success);
  return { passed: allPassed, results };
}
