import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext.tsx';
import { Booking } from '../../types/index.ts';
import { Dialog } from '../common/Dialog.tsx';
import { Button } from '../common/Button.tsx';
import { Input } from '../common/Input.tsx';
import { StatusLabel } from '../common/StatusLabel.tsx';
import { formatRupee, formatDate } from '../../utils/formatters.ts';

interface BookingLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BookingLookupModal: React.FC<BookingLookupModalProps> = ({ isOpen, onClose }) => {
  const { bookings, roomTypes, cancelBooking } = useHotel();

  const [lookupQuery, setLookupQuery] = useState('');
  const [matchedBooking, setMatchedBooking] = useState<Booking | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Change of personal travel plans');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    const q = lookupQuery.trim().toLowerCase();
    if (!q) {
      setMatchedBooking(null);
      return;
    }

    const found = bookings.find(
      (b) =>
        b.bookingReference.toLowerCase() === q ||
        b.guestPhone.toLowerCase().includes(q) ||
        b.guestEmail.toLowerCase() === q
    );
    setMatchedBooking(found || null);
  };

  const handleCancel = () => {
    if (!matchedBooking) return;
    const res = cancelBooking(matchedBooking.id, cancelReason);
    if (res.success) {
      setIsCancelConfirmOpen(false);
      // Reload matching booking from state
      setMatchedBooking((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
    }
  };

  if (!isOpen) return null;

  const roomType = matchedBooking
    ? roomTypes.find((rt) => rt.id === matchedBooking.roomTypeId)
    : null;

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Look Up Reservation" maxWidth="md">
      <div className="flex flex-col gap-4 text-left text-xs">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Enter Booking Reference (e.g. BK-2026-1001) or Mobile..."
            value={lookupQuery}
            onChange={(e) => setLookupQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="md" variant="primary">
            Search
          </Button>
        </form>

        {hasSearched && !matchedBooking && (
          <div className="p-4 bg-[#F4F5F2] border border-[#D8DCD5] rounded-[6px] text-center text-[#57636E]">
            No reservation found matching "{lookupQuery}". Please check your booking reference code or mobile number.
          </div>
        )}

        {matchedBooking && (
          <div className="border border-[#D8DCD5] rounded-[6px] p-4 bg-white flex flex-col gap-3 font-mono">
            <div className="flex items-center justify-between border-b border-[#E8ECE5] pb-2 font-sans">
              <div>
                <span className="font-mono font-bold text-sm text-[#0F5E63]">
                  {matchedBooking.bookingReference}
                </span>
                <div className="font-bold text-base text-[#14202B] mt-0.5">
                  {matchedBooking.guestName}
                </div>
              </div>
              <StatusLabel status={matchedBooking.status} />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[#57636E] font-sans">Room Category:</span>
                <div className="font-semibold text-[#14202B]">{roomType?.name}</div>
              </div>
              <div>
                <span className="text-[#57636E] font-sans">Contact:</span>
                <div className="text-[#14202B]">{matchedBooking.guestPhone}</div>
              </div>
              <div>
                <span className="text-[#57636E] font-sans">Check-in:</span>
                <div className="text-[#14202B]">{formatDate(matchedBooking.checkInDate)}</div>
              </div>
              <div>
                <span className="text-[#57636E] font-sans">Check-out:</span>
                <div className="text-[#14202B]">{formatDate(matchedBooking.checkOutDate)}</div>
              </div>
            </div>

            <div className="p-3 bg-[#F4F5F2] rounded-[4px] border border-[#D8DCD5] flex justify-between items-center text-xs">
              <div>
                <span className="text-[#57636E] font-sans">Total Tariff:</span>{' '}
                <span className="font-bold">{formatRupee(matchedBooking.totalAmount)}</span>
              </div>
              <div>
                <span className="text-[#57636E] font-sans">Advance Paid:</span>{' '}
                <span className="font-bold text-[#15803D]">{formatRupee(matchedBooking.advancePaid)}</span>
              </div>
            </div>

            {matchedBooking.status === 'reserved' && (
              <div className="pt-2 flex justify-end">
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setIsCancelConfirmOpen(true)}
                >
                  Cancel Reservation
                </Button>
              </div>
            )}
          </div>
        )}

        {isCancelConfirmOpen && (
          <div className="p-4 bg-[#FEE2E2] border border-[#B42318] rounded-[6px] flex flex-col gap-2">
            <span className="font-bold text-[#B42318] font-sans text-xs">
              Are you sure you want to cancel this booking?
            </span>
            <p className="text-[11px] text-[#B42318]">
              Cancellation policy rules will apply. Eligible advance payments will be refunded.
            </p>
            <div className="flex justify-end gap-2 mt-2">
              <Button size="sm" variant="secondary" onClick={() => setIsCancelConfirmOpen(false)}>
                Keep Reservation
              </Button>
              <Button size="sm" variant="danger" onClick={handleCancel}>
                Confirm Cancellation
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-[#D8DCD5]">
          <Button size="sm" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
