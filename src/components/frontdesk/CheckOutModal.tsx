import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext.tsx';
import { Booking, PaymentMethod } from '../../types/index.ts';
import { Dialog } from '../common/Dialog.tsx';
import { Button } from '../common/Button.tsx';
import { Input } from '../common/Input.tsx';
import { formatRupee, formatDate } from '../../utils/formatters.ts';

interface CheckOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onSuccess: (bookingId: string) => void;
}

export const CheckOutModal: React.FC<CheckOutModalProps> = ({
  isOpen,
  onClose,
  booking,
  onSuccess,
}) => {
  const { getFolioByBookingId, checkOutGuest, rooms, roomTypes, settings } = useHotel();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [lateHours, setLateHours] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState('');

  if (!booking) return null;

  const folio = getFolioByBookingId(booking.id);
  const room = rooms.find((r) => r.id === booking.roomId);
  const rType = roomTypes.find((rt) => rt.id === booking.roomTypeId);

  const baseCharges = folio ? folio.lines.reduce((sum, l) => sum + l.totalAmount, 0) : 0;
  const basePaid = folio ? folio.payments.reduce((sum, p) => sum + p.amount, 0) : 0;

  // Calculate late fee
  const lateFeeSubtotal = lateHours * settings.lateCheckOutFeePerHour;
  const lateFeeTax = Math.round((lateFeeSubtotal * 12) / 100);
  const lateFeeTotal = lateFeeSubtotal + lateFeeTax;

  const finalCharges = baseCharges + lateFeeTotal;
  const balanceDue = finalCharges - basePaid;

  const handleConfirmCheckOut = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const res = checkOutGuest(booking.id, paymentMethod, lateHours);
    if (res.success) {
      onSuccess(booking.id);
      onClose();
    } else {
      setErrorMessage(res.error || 'Check-out failed.');
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Check Out: ${booking.guestName} (Room ${room?.roomNumber || '?'})`}
      maxWidth="lg"
    >
      <form onSubmit={handleConfirmCheckOut} className="flex flex-col gap-4 text-left">
        {errorMessage && (
          <div className="p-3 bg-[#FEE2E2] border border-[#B42318] text-[#B42318] text-xs font-semibold rounded-[6px]">
            {errorMessage}
          </div>
        )}

        {/* Stay Summary */}
        <div className="bg-[#F4F5F2] border border-[#D8DCD5] rounded-[6px] p-4 text-xs font-mono">
          <div className="font-bold text-sm text-[#14202B] font-sans mb-2">
            Final Account Settlement Summary
          </div>
          <div className="flex justify-between py-1 border-b border-[#E8ECE5]">
            <span className="text-[#57636E]">Guest:</span>
            <span className="font-bold">{booking.guestName}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[#E8ECE5]">
            <span className="text-[#57636E]">Room:</span>
            <span>Room {room?.roomNumber} ({rType?.name})</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[#E8ECE5]">
            <span className="text-[#57636E]">Stay Duration:</span>
            <span>{formatDate(booking.checkInDate)} to {formatDate(booking.checkOutDate)} ({booking.totalNights} nights)</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[#E8ECE5]">
            <span className="text-[#57636E]">Standard Check-Out Time:</span>
            <span>{settings.defaultCheckOutTime} AM</span>
          </div>
        </div>

        {/* Late Check-Out Options */}
        <div className="border border-[#D8DCD5] rounded-[6px] p-4 bg-white">
          <label className="text-xs font-semibold text-[#14202B] block mb-1">
            Late Check-Out Fee (if applicable)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <select
              value={lateHours}
              onChange={(e) => setLateHours(Number(e.target.value))}
              className="w-full h-9 px-3 text-sm rounded-[6px] border border-[#D8DCD5] bg-white focus:ring-2 focus:ring-[#0F5E63] outline-none"
            >
              <option value={0}>On-Time Departure (No Late Fee)</option>
              <option value={1}>1 Hour Late (₹{settings.lateCheckOutFeePerHour} + 12% GST)</option>
              <option value={2}>2 Hours Late (₹{settings.lateCheckOutFeePerHour * 2} + 12% GST)</option>
              <option value={3}>3 Hours Late (₹{settings.lateCheckOutFeePerHour * 3} + 12% GST)</option>
              <option value={4}>4 Hours Late (Half-Day Tariff)</option>
            </select>
            {lateHours > 0 && (
              <span className="text-xs text-[#0F5E63] font-mono font-semibold">
                + {formatRupee(lateFeeTotal)} added to bill
              </span>
            )}
          </div>
        </div>

        {/* Balance & Payment Collection */}
        <div className="border border-[#D8DCD5] rounded-[6px] p-4 bg-white">
          <div className="flex justify-between items-center pb-3 border-b border-[#E8ECE5]">
            <span className="text-xs font-semibold text-[#57636E]">Total Charges:</span>
            <span className="font-mono font-semibold text-sm">{formatRupee(finalCharges)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-[#E8ECE5]">
            <span className="text-xs font-semibold text-[#57636E]">Already Paid:</span>
            <span className="font-mono font-semibold text-sm text-[#15803D]">{formatRupee(basePaid)}</span>
          </div>
          <div className="flex justify-between items-center pt-3">
            <span className="text-sm font-bold text-[#14202B]">Balance Due for Settlement:</span>
            <span className="font-mono font-bold text-lg text-[#B42318]">{formatRupee(balanceDue)}</span>
          </div>

          {balanceDue > 0 && (
            <div className="mt-4 pt-3 border-t border-[#E8ECE5]">
              <label className="text-xs font-semibold text-[#14202B] block mb-1">
                Settlement Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full h-9 px-3 text-sm rounded-[6px] border border-[#D8DCD5] bg-white focus:ring-2 focus:ring-[#0F5E63] outline-none"
              >
                <option value="upi">UPI (GPay / PhonePe / Paytm / QR)</option>
                <option value="card">Credit Card / Debit Card POS</option>
                <option value="cash">Cash (Collected in Front Desk Drawer)</option>
                <option value="bank_transfer">Corporate Bank Transfer</option>
              </select>
            </div>
          )}
        </div>

        {/* Automatic actions notice */}
        <div className="p-3 bg-[#F4F5F2] border border-[#D8DCD5] rounded-[6px] text-xs text-[#57636E] leading-relaxed">
          <span className="font-bold text-[#14202B]">Upon check-out:</span>
          <ul className="list-disc pl-4 mt-1 space-y-0.5">
            <li>Sequential GST Tax Invoice ({settings.invoicePrefix}-{new Date().getFullYear()}-{String(settings.nextInvoiceNumber).padStart(4, '0')}) will be generated automatically.</li>
            <li>Room {room?.roomNumber} will be marked <span className="font-bold text-[#B45309]">DIRTY</span>.</li>
            <li>High-priority Housekeeping Departure Clean task will be queued immediately.</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D8DCD5]">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Settle & Finalize Check-Out
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
