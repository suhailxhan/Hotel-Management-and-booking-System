import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext.tsx';
import { RoomType, Booking } from '../../types/index.ts';
import { calculateBookingTotal, isRoomAvailableForDates } from '../../utils/calculations.ts';
import { formatRupee, formatDate, calculateNights } from '../../utils/formatters.ts';
import { Button } from '../common/Button.tsx';
import { Input } from '../common/Input.tsx';
import { Dialog } from '../common/Dialog.tsx';

interface PublicBookingPageProps {
  onOpenLookup: () => void;
}

export const PublicBookingPage: React.FC<PublicBookingPageProps> = ({ onOpenLookup }) => {
  const { roomTypes, rooms, bookings, settings, createBooking } = useHotel();

  const [checkInDate, setCheckInDate] = useState('2026-10-05');
  const [checkOutDate, setCheckOutDate] = useState('2026-10-08');
  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(0);

  // Reservation dialog state
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestCity, setGuestCity] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState<number>(2000);
  const [bookingConfirmedVoucher, setBookingConfirmedVoucher] = useState<Booking | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const nights = calculateNights(checkInDate, checkOutDate);

  // Compute availability for each room type
  const roomCards = roomTypes.map((rt) => {
    const roomsOfType = rooms.filter((r) => r.roomTypeId === rt.id);
    const availableRooms = roomsOfType.filter((r) => {
      if (
        r.status === 'out_of_service' &&
        r.outOfServiceStartDate &&
        r.outOfServiceEndDate &&
        checkInDate <= r.outOfServiceEndDate &&
        checkOutDate >= r.outOfServiceStartDate
      ) {
        return false;
      }
      return isRoomAvailableForDates(r.id, checkInDate, checkOutDate, bookings);
    });

    const pricing = calculateBookingTotal(rt.baseRate, nights, settings.gstSlabs);

    return {
      roomType: rt,
      availableCount: availableRooms.length,
      pricing,
    };
  });

  const handleStartBooking = (rt: RoomType) => {
    setSelectedRoomType(rt);
    const pricing = calculateBookingTotal(rt.baseRate, nights, settings.gstSlabs);
    setAdvanceAmount(Math.min(pricing.totalAmount, Math.round(pricing.totalAmount * 0.3)));
    setErrorMessage('');
  };

  const handleConfirmReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomType) return;
    setErrorMessage('');

    if (!guestName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!guestPhone.trim()) {
      setErrorMessage('Please provide a mobile contact number.');
      return;
    }

    const res = createBooking({
      guestName,
      guestPhone,
      guestEmail: guestEmail || `${guestPhone}@guest.grandmalabarhotel.in`,
      guestCity: guestCity || 'India',
      roomTypeId: selectedRoomType.id,
      roomId: null, // Auto-assigned by front desk
      checkInDate,
      checkOutDate,
      adults,
      children,
      advancePaid: advanceAmount,
      specialRequests,
    });

    if (res.success && res.booking) {
      setBookingConfirmedVoucher(res.booking);
      setSelectedRoomType(null);
    } else {
      setErrorMessage(res.error || 'Failed to complete booking.');
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left w-full max-w-5xl mx-auto pb-16">
      {/* Quiet, authentic property banner (No gradient, no hero buzzwords) */}
      <div className="bg-white border border-[#D8DCD5] rounded-[6px] p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-[#0F5E63]">
            Direct Guest Reservation
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-[#14202B] mt-0.5">
            {settings.hotelName}
          </h2>
          <p className="text-xs text-[#57636E] mt-1 leading-relaxed">
            {settings.hotelAddress}, {settings.hotelCity}, {settings.hotelState}
            <br />
            Check-in from {settings.defaultCheckInTime} • Check-out by {settings.defaultCheckOutTime}
          </p>
        </div>

        <Button size="sm" variant="secondary" onClick={onOpenLookup}>
          Lookup Existing Reservation
        </Button>
      </div>

      {/* Date & Guest Picker Bar */}
      <div className="bg-white border border-[#D8DCD5] rounded-[6px] p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <div>
            <label className="text-xs font-semibold text-[#14202B] block mb-1">Check-in Date</label>
            <input
              type="date"
              value={checkInDate}
              onChange={(e) => setCheckInDate(e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-[6px] border border-[#D8DCD5] bg-white font-mono outline-none focus:ring-2 focus:ring-[#0F5E63]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#14202B] block mb-1">Check-out Date</label>
            <input
              type="date"
              value={checkOutDate}
              onChange={(e) => setCheckOutDate(e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-[6px] border border-[#D8DCD5] bg-white font-mono outline-none focus:ring-2 focus:ring-[#0F5E63]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#14202B] block mb-1">Guests</label>
            <div className="flex gap-2">
              <select
                value={adults}
                onChange={(e) => setAdults(Number(e.target.value))}
                className="w-full h-9 px-2 text-sm rounded-[6px] border border-[#D8DCD5] bg-white"
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? 'Adult' : 'Adults'}
                  </option>
                ))}
              </select>
              <select
                value={children}
                onChange={(e) => setChildren(Number(e.target.value))}
                className="w-full h-9 px-2 text-sm rounded-[6px] border border-[#D8DCD5] bg-white"
              >
                {[0, 1, 2].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? 'Child' : 'Children'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="h-9 px-3 bg-[#F4F5F2] border border-[#D8DCD5] rounded-[6px] flex items-center justify-center text-xs font-mono font-bold text-[#14202B]">
            {nights} Night{nights > 1 ? 's' : ''} Stay
          </div>
        </div>
      </div>

      {/* Available Room Types Cards */}
      <div className="flex flex-col gap-4">
        {roomCards.map(({ roomType, availableCount, pricing }) => {
          const isAvailable = availableCount > 0;

          return (
            <div
              key={roomType.id}
              className="bg-white border border-[#D8DCD5] rounded-[6px] overflow-hidden flex flex-col md:flex-row shadow-2xs"
            >
              {/* Photo slot */}
              <div className="md:w-72 h-48 md:h-auto shrink-0 bg-[#EEF0EC] relative">
                <img
                  src={roomType.photos[0]}
                  alt={`${roomType.name} guestroom photography`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-[3px] uppercase font-mono ${
                      isAvailable ? 'bg-[#15803D] text-white' : 'bg-[#B42318] text-white'
                    }`}
                  >
                    {isAvailable ? `${availableCount} Available` : 'Sold Out'}
                  </span>
                </div>
              </div>

              {/* Room details */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-[#14202B]">{roomType.name}</h3>
                      <div className="text-xs text-[#57636E] mt-0.5">
                        Capacity up to {roomType.capacity} Guests • {roomType.code}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[#57636E] mt-2 leading-relaxed">
                    {roomType.description}
                  </p>

                  {/* Amenities */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {roomType.amenities.map((a, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-[#F4F5F2] border border-[#E8ECE5] text-[11px] text-[#14202B] rounded-[3px]"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Price and CTA */}
                <div className="mt-4 pt-3 border-t border-[#E8ECE5] flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <div className="text-xs text-[#57636E]">Base Rate:</div>
                    <div className="text-xl font-bold font-mono text-[#14202B]">
                      {formatRupee(roomType.baseRate)}
                      <span className="text-xs font-normal text-[#57636E]"> / night</span>
                    </div>
                    <div className="text-[11px] text-[#57636E] font-mono mt-0.5">
                      Total for {nights} nights: {formatRupee(pricing.totalAmount)} (includes {pricing.gstRate}% GST)
                    </div>
                  </div>

                  <Button
                    size="md"
                    variant="primary"
                    disabled={!isAvailable}
                    onClick={() => handleStartBooking(roomType)}
                  >
                    {isAvailable ? 'Reserve This Room' : 'Sold Out'}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reservation Checkout Modal */}
      {selectedRoomType && (
        <Dialog
          isOpen={true}
          onClose={() => setSelectedRoomType(null)}
          title={`Reserve: ${selectedRoomType.name}`}
          maxWidth="lg"
        >
          <form onSubmit={handleConfirmReservation} className="flex flex-col gap-3 text-left">
            {errorMessage && (
              <div className="p-3 bg-[#FEE2E2] border border-[#B42318] text-[#B42318] text-xs font-semibold rounded-[6px]">
                {errorMessage}
              </div>
            )}

            <div className="bg-[#F4F5F2] border border-[#D8DCD5] rounded-[6px] p-3 text-xs font-mono">
              <div className="flex justify-between font-bold text-[#14202B] font-sans">
                <span>{selectedRoomType.name}</span>
                <span>{nights} Nights ({formatDate(checkInDate)} to {formatDate(checkOutDate)})</span>
              </div>
              <div className="flex justify-between mt-1 text-[#57636E]">
                <span>Total Tariff + GST:</span>
                <span className="font-bold text-[#14202B]">
                  {formatRupee(
                    calculateBookingTotal(selectedRoomType.baseRate, nights, settings.gstSlabs).totalAmount
                  )}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Full Name *"
                placeholder="e.g. Anand Sharma"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                required
              />
              <Input
                label="Mobile Phone *"
                placeholder="e.g. +91 98201 12233"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                required
                tabular
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Email Address"
                placeholder="anand@example.com"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
              />
              <Input
                label="City / State"
                placeholder="e.g. Bangalore, Karnataka"
                value={guestCity}
                onChange={(e) => setGuestCity(e.target.value)}
              />
            </div>

            <Input
              label="Special Requests (Airport Pickup, Floor preference, etc.)"
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
            />

            {/* Advance payment */}
            <div className="p-3 bg-[#F4F5F2] border border-[#D8DCD5] rounded-[6px]">
              <label className="text-xs font-semibold text-[#14202B] block mb-1">
                Advance Deposit (UPI / Card Confirmation) (₹)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                  className="w-32 h-9 px-2 text-sm font-mono border border-[#D8DCD5] rounded-[4px] bg-white font-bold"
                />
                <span className="text-xs text-[#57636E]">
                  Balance payable on arrival at hotel front desk.
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#D8DCD5]">
              <Button type="button" size="sm" variant="secondary" onClick={() => setSelectedRoomType(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" variant="primary">
                Confirm & Book Now
              </Button>
            </div>
          </form>
        </Dialog>
      )}

      {/* Confirmation Voucher Modal */}
      {bookingConfirmedVoucher && (
        <Dialog
          isOpen={true}
          onClose={() => setBookingConfirmedVoucher(null)}
          title="Reservation Confirmed"
          maxWidth="md"
        >
          <div className="flex flex-col gap-4 text-left text-xs">
            <div className="p-4 bg-[#DCFCE7] border border-[#15803D] rounded-[6px] text-[#14202B]">
              <div className="font-bold text-base text-[#15803D]">
                Reservation Confirmed: {bookingConfirmedVoucher.bookingReference}
              </div>
              <p className="text-xs mt-1">
                Thank you, {bookingConfirmedVoucher.guestName}. Your reservation has been recorded in the front desk PMS.
              </p>
            </div>

            <div className="border border-[#D8DCD5] rounded-[6px] p-4 bg-white font-mono flex flex-col gap-1.5">
              <div className="flex justify-between">
                <span className="text-[#57636E]">Booking Reference:</span>
                <span className="font-bold text-[#0F5E63]">{bookingConfirmedVoucher.bookingReference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#57636E]">Check-in Date:</span>
                <span>{formatDate(bookingConfirmedVoucher.checkInDate)} (from {settings.defaultCheckInTime})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#57636E]">Check-out Date:</span>
                <span>{formatDate(bookingConfirmedVoucher.checkOutDate)} (by {settings.defaultCheckOutTime})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#57636E]">Total Tariff (with GST):</span>
                <span>{formatRupee(bookingConfirmedVoucher.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-[#15803D] font-bold">
                <span>Advance Paid:</span>
                <span>{formatRupee(bookingConfirmedVoucher.advancePaid)}</span>
              </div>
              <div className="flex justify-between border-t border-[#D8DCD5] pt-1 font-bold text-[#14202B]">
                <span>Balance Payable on Arrival:</span>
                <span>{formatRupee(bookingConfirmedVoucher.totalAmount - bookingConfirmedVoucher.advancePaid)}</span>
              </div>
            </div>

            <p className="text-[#57636E] text-[11px] leading-relaxed">
              Cancellation Policy: Free cancellation up to {settings.cancellationFreeHours} hours before check-in.
              Please carry a valid government ID (Aadhaar, Passport, DL, or Voter ID) for check-in.
            </p>

            <div className="flex justify-end pt-3 border-t border-[#D8DCD5]">
              <Button size="sm" variant="primary" onClick={() => setBookingConfirmedVoucher(null)}>
                Done
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};
